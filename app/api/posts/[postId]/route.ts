import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const body = await req.json()
  const { content, vote } = body
  
  const supabase = await createClient()
  
  // Handle voting
  if (vote === "up" || vote === "down") {
    const column = vote === "up" ? "upvotes" : "downvotes"
    const { data, error } = await supabase.rpc("increment_post_vote", {
      post_id: postId,
      vote_type: vote
    })
    
    // Fallback if RPC doesn't exist
    if (error?.code === "42883") {
      const { data: post } = await supabase
        .from("posts")
        .select("upvotes, downvotes")
        .eq("id", postId)
        .single()
      
      if (post) {
        const currentValue = vote === "up" ? post.upvotes : post.downvotes
        const { data: updated, error: updateError } = await supabase
          .from("posts")
          .update({ [column]: (currentValue || 0) + 1 })
          .eq("id", postId)
          .select()
          .single()
        
        if (updateError) {
          return Response.json({ error: updateError.message }, { status: 500 })
        }
        return Response.json({ post: updated })
      }
    }
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }
    return Response.json({ success: true })
  }
  
  // Handle content edit
  if (content !== undefined) {
    const { data, error } = await supabase
      .from("posts")
      .update({ 
        content,
        is_edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", postId)
      .select()
      .single()
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }
    return Response.json({ post: data })
  }
  
  return Response.json({ error: "No valid update provided" }, { status: 400 })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const supabase = await createClient()
  
  // Soft delete - mark as deleted but keep for thread integrity
  const { data, error } = await supabase
    .from("posts")
    .update({ 
      is_deleted: true,
      content: "[deleted]",
      updated_at: new Date().toISOString()
    })
    .eq("id", postId)
    .select()
    .single()
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json({ post: data })
}
