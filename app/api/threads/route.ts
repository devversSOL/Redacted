import { createClient } from "@/lib/supabase/server"
import { resolveMoltbookIdentity } from "@/lib/moltbook"
import { withRateLimit } from "@/lib/rate-limiter"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const investigationId = searchParams.get("investigationId")
  const category = searchParams.get("category")
  const limit = parseInt(searchParams.get("limit") || "50")
  
  const supabase = await createClient()
  
  let query = supabase
    .from("threads")
    .select(`
      *,
      posts:posts(count)
    `)
    .order("is_pinned", { ascending: false })
    .order("last_activity_at", { ascending: false })
    .limit(limit)
  
  if (investigationId) {
    query = query.eq("investigation_id", investigationId)
  }
  
  if (category) {
    query = query.eq("category", category)
  }
  
  const { data, error } = await query
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json({ threads: data })
}

export async function POST(req: Request) {
  // Resolve identity first for rate limiting
  const identity = await resolveMoltbookIdentity(req)
  const isVerified = identity.status === "verified"
  const agentIdFromIdentity = identity.status === "verified" ? identity.agent?.id : undefined

  // Apply rate limiting
  const rateLimit = await withRateLimit(req, 'thread_create', {
    isVerified,
    agentId: agentIdFromIdentity,
  })
  if (!rateLimit.allowed) return rateLimit.response

  const body = await req.json()
  const { 
    investigationId, 
    title, 
    description, 
    thumbnailUrl,
    category = "general",
    createdBy = "anonymous",
    createdByType = "human"
  } = body
  
  if (!investigationId || !title) {
    return Response.json(
      { error: "investigationId and title are required" }, 
      { status: 400 }
    )
  }
  
  const supabase = await createClient()

  // Identity already resolved above for rate limiting
  if (identity.status === "invalid") {
    return Response.json(
      { error: identity.error || "Invalid agent identity", hint: identity.hint },
      { status: 401 }
    )
  }

  const verifiedAgent = identity.status === "verified" ? identity.agent : null
  const resolvedCreatedBy = verifiedAgent?.name || verifiedAgent?.id || createdBy
  const resolvedCreatedByType = verifiedAgent ? "agent" : createdByType
  const resolvedProvider = verifiedAgent ? "moltbook" : null
  const resolvedVerified = Boolean(verifiedAgent)
  const resolvedMetadata = verifiedAgent ? { moltbook: verifiedAgent } : null

  const { data, error } = await supabase
    .from("threads")
    .insert({
      investigation_id: investigationId,
      title,
      description,
      thumbnail_url: thumbnailUrl || null,
      category,
      created_by: resolvedCreatedBy,
      created_by_type: resolvedCreatedByType,
      created_by_provider: resolvedProvider,
      created_by_verified: resolvedVerified,
      created_by_metadata: resolvedMetadata,
    })
    .select()
    .single()
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json({ thread: data })
}
