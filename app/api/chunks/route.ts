import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const documentId = searchParams.get("documentId")
  const page = searchParams.get("page")
  const search = searchParams.get("search")
  
  const supabase = await createClient()

  let query = supabase
    .from("chunks")
    .select("*")
    .order("chunk_index", { ascending: true })
    .limit(100)

  if (documentId) {
    query = query.eq("document_id", documentId)
  }

  if (page) {
    query = query.eq("page", parseInt(page, 10))
  }

  if (search) {
    query = query.textSearch("text", search)
  }

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ chunks: data })
}

export async function POST(req: Request) {
  const { documentId, chunks } = await req.json()
  
  if (!documentId || !chunks || !Array.isArray(chunks)) {
    return Response.json({ error: "documentId and chunks array required" }, { status: 400 })
  }

  const supabase = await createClient()

  // Insert all chunks
  const chunksToInsert = chunks.map((chunk: {
    page: number
    start_offset: number
    end_offset: number
    text: string
    chunk_index: number
    metadata?: Record<string, unknown>
  }) => ({
    document_id: documentId,
    page: chunk.page,
    start_offset: chunk.start_offset,
    end_offset: chunk.end_offset,
    text: chunk.text,
    chunk_index: chunk.chunk_index,
    metadata: chunk.metadata || {},
  }))

  const { data, error } = await supabase
    .from("chunks")
    .insert(chunksToInsert)
    .select()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ 
    success: true, 
    chunks: data,
    count: data.length 
  })
}
