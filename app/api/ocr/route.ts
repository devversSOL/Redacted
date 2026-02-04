import { createClient } from "@/lib/supabase/server"
import { extractChunks, computeContentHash, detectRedactions } from "@/lib/chunk-extractor"

// Force Node.js runtime for Buffer and pdf-parse
export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const investigationId = formData.get("investigationId") as string

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mimeType = file.type || "application/octet-stream"
    
    let extractedText = ""
    let pageCount = 1

    // Handle PDFs with pdf-parse
    if (mimeType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse")
        const pdfData = await pdfParse(buffer)
        extractedText = pdfData.text || ""
        pageCount = pdfData.numpages || 1
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError)
        extractedText = `[PDF document: ${file.name}]\n\nText extraction failed. The document has been uploaded for manual review.`
      }
    } 
    // Handle text files
    else if (mimeType.startsWith("text/") || file.name.match(/\.(txt|md|csv|json|xml)$/i)) {
      extractedText = buffer.toString("utf-8")
    }
    // Handle images - store metadata only (no AI OCR)
    else if (mimeType.startsWith("image/")) {
      extractedText = `[Image document: ${file.name}]\n\nThis is an image file. Text content requires manual transcription or AI-assisted OCR.`
    }
    // Unknown file type
    else {
      extractedText = `[Document: ${file.name}]\n\nFile type: ${mimeType}\nSize: ${file.size} bytes\n\nContent extraction not available for this file type.`
    }

    // Compute content hash
    const contentHash = computeContentHash(extractedText)
    
    // Detect redactions in extracted text
    const redactions = detectRedactions(extractedText)

    // Store document in Supabase
    const supabase = await createClient()
    
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        investigation_id: investigationId || null,
        filename: file.name,
        file_url: "",
        file_type: mimeType,
        ocr_text: extractedText,
        ocr_status: extractedText.includes("[") && extractedText.includes("extraction") ? "pending" : "completed",
        content_hash: contentHash,
        page_count: pageCount,
        status: "processed",
        metadata: {
          size: file.size,
          type: mimeType,
          processed_at: new Date().toISOString(),
          redaction_count: redactions.length,
          extraction_method: mimeType === "application/pdf" ? "pdf-parse" : "direct",
        },
      })
      .select()
      .single()

    if (docError) {
      console.error("Error storing document:", docError)
      return Response.json({ error: "Failed to store document", details: docError.message }, { status: 500 })
    }

    // Extract and store chunks
    const chunkResult = extractChunks(doc.id, extractedText)
    
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
      }

      await supabase
        .from("documents")
        .update({ page_count: chunkResult.page_count || pageCount })
        .eq("id", doc.id)
    }

    return Response.json({
      success: true,
      document: {
        ...doc,
        content_hash: contentHash,
        page_count: chunkResult.page_count || pageCount,
      },
      text: extractedText,
      chunks: chunkResult.chunks.length,
      redactions: redactions.length,
    })
  } catch (error: any) {
    console.error("Document upload error:", error)
    return Response.json({ 
      error: "Document processing failed", 
      details: error?.message || "Unknown error" 
    }, { status: 500 })
  }
}
