import { generateText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createClient } from "@/lib/supabase/server"
import { extractChunks, computeContentHash, detectRedactions } from "@/lib/chunk-extractor"

export async function POST(req: Request) {
  // Get API key and provider from headers for BYOK
  const userApiKey = req.headers.get("X-API-Key")
  const userProvider = req.headers.get("X-API-Provider") || "openai" // Default to OpenAI

  const formData = await req.formData()
  const file = formData.get("file") as File
  const investigationId = formData.get("investigationId") as string

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 })
  }

  if (!userApiKey) {
    return Response.json({ 
      error: "No API key provided. Go to API Keys in the header and add your OpenAI, Anthropic, or Google AI key." 
    }, { status: 400 })
  }

  try {
    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")
    const mimeType = file.type || "image/png"

    // Create provider with BYOK key - support multiple providers
    let model
    let modelName = "unknown"
    
    switch (userProvider) {
      case "anthropic":
        const anthropicProvider = createAnthropic({ apiKey: userApiKey })
        model = anthropicProvider("claude-sonnet-4-20250514")
        modelName = "claude-sonnet-4"
        break
      case "google":
        const googleProvider = createGoogleGenerativeAI({ apiKey: userApiKey })
        model = googleProvider("gemini-2.0-flash-001")
        modelName = "gemini-2.0-flash"
        break
      case "openai":
      default:
        const openaiProvider = createOpenAI({ apiKey: userApiKey })
        model = openaiProvider("gpt-4o")
        modelName = "gpt-4o"
        break
    }

    // Use AI Vision to extract text from image
    const { text: ocrText } = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: `data:${mimeType};base64,${base64}`,
            },
            {
              type: "text",
              text: `You are an OCR specialist. Extract ALL text from this document image exactly as it appears. 
              
Instructions:
- Preserve the original formatting, line breaks, and structure as much as possible
- Include all visible text, headers, footers, stamps, handwritten notes
- Mark any redacted/blacked out sections as [REDACTED]
- Mark any illegible text as [ILLEGIBLE]
- Do not add any commentary or interpretation, just extract the raw text
- If this appears to be a form or table, preserve the structure using spacing or markdown tables`,
            },
          ],
        },
      ],
    })

    // Compute content hash for integrity verification
    const contentHash = computeContentHash(ocrText)
    
    // Detect redactions in the extracted text
    const redactions = detectRedactions(ocrText)

    // Store document in Supabase
    const supabase = await createClient()
    
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        investigation_id: investigationId || null,
        filename: file.name,
        file_url: "", // Empty - we process directly without storage
        file_type: file.type || "image/png",
        ocr_text: ocrText,
        ocr_status: "completed",
        content_hash: contentHash,
        page_count: 1,
        status: "processed",
        metadata: {
          size: file.size,
          type: file.type,
          model_used: modelName,
          processed_at: new Date().toISOString(),
          redaction_count: redactions.length,
        },
      })
      .select()
      .single()

    if (docError) {
      console.error("Error storing document:", docError)
      return Response.json({ error: "Failed to store document" }, { status: 500 })
    }

    // Extract and store chunks with page/offset information
    const chunkResult = extractChunks(doc.id, ocrText)
    
    if (chunkResult.chunks.length > 0) {
      const chunksToInsert = chunkResult.chunks.map(chunk => ({
        document_id: doc.id,
        page: chunk.page,
        start_offset: chunk.start_offset,
        end_offset: chunk.end_offset,
        text: chunk.text,
        chunk_index: chunk.chunk_index,
        metadata: {},
      }))

      const { error: chunkError } = await supabase
        .from("chunks")
        .insert(chunksToInsert)

      if (chunkError) {
        console.error("Error storing chunks:", chunkError)
        // Non-fatal - document is still saved
      }

      // Update document with actual page count
      await supabase
        .from("documents")
        .update({ page_count: chunkResult.page_count })
        .eq("id", doc.id)
    }

    // Log agent activity
    await supabase.from("agent_activity").insert({
      agent_id: "ocr-agent",
      agent_model: model,
      action_type: "document_processed",
      description: `Processed document: ${file.name}`,
      investigation_id: investigationId || null,
      metadata: {
        document_id: doc.id,
        text_length: ocrText.length,
        chunk_count: chunkResult.chunks.length,
        page_count: chunkResult.page_count,
        redaction_count: redactions.length,
        content_hash: contentHash,
      },
    })

    return Response.json({
      success: true,
      document: {
        ...doc,
        content_hash: contentHash,
        page_count: chunkResult.page_count,
      },
      text: ocrText,
      chunks: chunkResult.chunks.length,
      redactions: redactions.length,
    })
  } catch (error) {
    console.error("OCR Error:", error)
    return Response.json({ error: "OCR processing failed" }, { status: 500 })
  }
}
