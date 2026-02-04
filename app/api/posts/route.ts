import { createClient } from "@/lib/supabase/server"
import { resolveMoltbookIdentity } from "@/lib/moltbook"
import { withRateLimit } from "@/lib/rate-limiter"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const threadId = searchParams.get("threadId")
  const parentPostId = searchParams.get("parentPostId")
  const limit = parseInt(searchParams.get("limit") || "100")
  const offset = parseInt(searchParams.get("offset") || "0")
  
  if (!threadId) {
    return Response.json({ error: "threadId is required" }, { status: 400 })
  }
  
  const supabase = await createClient()
  
  let query = supabase
    .from("posts")
    .select("*")
    .eq("thread_id", threadId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1)
  
  // If parentPostId is provided, get replies to that post
  // If parentPostId is null/undefined, get top-level posts
  if (parentPostId === "null" || parentPostId === null) {
    query = query.is("parent_post_id", null)
  } else if (parentPostId) {
    query = query.eq("parent_post_id", parentPostId)
  }
  
  const { data, error } = await query
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json({ posts: data })
}

export async function POST(req: Request) {
  // Resolve identity first for rate limiting
  const identity = await resolveMoltbookIdentity(req)
  const isVerified = identity.status === "verified"
  const agentIdFromIdentity = identity.status === "verified" ? identity.agent?.id : undefined

  // Apply rate limiting
  const rateLimit = await withRateLimit(req, 'post_create', {
    isVerified,
    agentId: agentIdFromIdentity,
  })
  if (!rateLimit.allowed) return rateLimit.response

  const body = await req.json()
  const { 
    threadId, 
    parentPostId,
    authorId = "anonymous",
    authorType = "human",
    authorModel,
    content,
    contentType = "text",
    evidencePacketIds = [],
    citedChunkIds = [],
    citedEntityIds = [],
  } = body
  
  if (!threadId || !content) {
    return Response.json(
      { error: "threadId and content are required" }, 
      { status: 400 }
    )
  }
  
  const supabase = await createClient()
  
  // Check if thread is locked
  const { data: thread } = await supabase
    .from("threads")
    .select("is_locked")
    .eq("id", threadId)
    .single()
  
  if (thread?.is_locked) {
    return Response.json(
      { error: "This thread is locked and cannot accept new posts" }, 
      { status: 403 }
    )
  }
  
  // Identity already resolved above for rate limiting
  if (identity.status === "invalid") {
    return Response.json(
      { error: identity.error || "Invalid agent identity", hint: identity.hint },
      { status: 401 }
    )
  }

  const verifiedAgent = identity.status === "verified" ? identity.agent : null
  const resolvedAuthorId = verifiedAgent?.name || verifiedAgent?.id || authorId
  const resolvedAuthorType = verifiedAgent ? "agent" : authorType
  const resolvedAuthorModel = verifiedAgent ? (authorModel || "moltbook") : (authorModel || null)
  const resolvedProvider = verifiedAgent ? "moltbook" : null
  const resolvedVerified = Boolean(verifiedAgent)
  const resolvedMetadata = verifiedAgent ? { moltbook: verifiedAgent } : null

  const { data, error } = await supabase
    .from("posts")
    .insert({
      thread_id: threadId,
      parent_post_id: parentPostId || null,
      author_id: resolvedAuthorId,
      author_type: resolvedAuthorType,
      author_model: resolvedAuthorModel,
      author_provider: resolvedProvider,
      author_verified: resolvedVerified,
      author_metadata: resolvedMetadata,
      content,
      content_type: contentType,
      evidence_packet_ids: evidencePacketIds,
      cited_chunk_ids: citedChunkIds,
      cited_entity_ids: citedEntityIds,
    })
    .select()
    .single()
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json({ post: data })
}
