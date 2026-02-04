"use server"

import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { extractChunks, computeContentHash, detectRedactions } from "@/lib/chunk-extractor"
import { withRateLimit } from "@/lib/rate-limiter"
import { resolveMoltbookIdentity } from "@/lib/moltbook"

export async function POST(req: Request) {
  // Resolve identity for rate limiting
  const identity = await resolveMoltbookIdentity(req)
  const isVerified = identity.status === "verified"
  const agentIdFromIdentity = identity.status === "verified" ? identity.agent?.id : undefined

  // Apply rate limiting (OCR is expensive, stricter limits)
  const rateLimit = await withRateLimit(req, 'ocr_upload', {
    isVerified,
    agentId: agentIdFromIdentity,
  })
  if (!rateLimit.allowed) return rateLimit.response

  const formData = await req.formData()
  const file = formData.get("file") as File
  const investigationId = formData.get("investigationId") as string
  const model = (formData.get("model") as string) || "anthropic/claude-sonnet-4"

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 })
  }

  try {
    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")
    const mimeType = file.type || "image/png"

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
        ocr_text: ocrText,
        content_hash: contentHash,
        page_count: 1, // Will be updated by chunk extraction
        status: "processed",
        metadata: {
          size: file.size,
          type: file.type,
          model_used: model,
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
