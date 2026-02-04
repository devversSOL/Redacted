import { createClient } from "@/lib/supabase/server"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("threads")
    .select(`
      *,
      investigation:investigations(id, title)
    `)
    .eq("id", threadId)
    .single()
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json({ thread: data })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params
  const body = await req.json()
  const { title, description, category, is_pinned, is_locked } = body
  
  const supabase = await createClient()
  
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (category !== undefined) updates.category = category
  if (is_pinned !== undefined) updates.is_pinned = is_pinned
  if (is_locked !== undefined) updates.is_locked = is_locked
  
  const { data, error } = await supabase
    .from("threads")
    .update(updates)
    .eq("id", threadId)
    .select()
    .single()
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json({ thread: data })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("threads")
    .delete()
    .eq("id", threadId)
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json({ success: true })
}
