"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft,
  MessageSquare,
  Pin,
  Lock,
  Clock,
  User,
  Bot,
  Send,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Reply,
  FileText,
  Link2
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Thread {
  id: string
  investigation_id: string
  title: string
  description: string | null
  category: string
  created_by: string
  created_by_type: string
  created_by_provider?: string | null
  created_by_verified?: boolean
  created_by_metadata?: Record<string, unknown> | null
  is_pinned: boolean
  is_locked: boolean
  post_count: number
  last_activity_at: string
  created_at: string
}

interface Post {
  id: string
  thread_id: string
  parent_post_id: string | null
  author_id: string
  author_type: string
  author_model: string | null
  author_provider?: string | null
  author_verified?: boolean
  author_metadata?: Record<string, unknown> | null
  content: string
  content_type: string
  evidence_packet_ids: string[]
  cited_chunk_ids: string[]
  cited_entity_ids: string[]
  upvotes: number
  downvotes: number
  reply_count: number
  is_edited: boolean
  is_deleted: boolean
  created_at: string
}

interface ThreadDetailProps {
  thread: Thread
  onBack: () => void
}

export function ThreadDetail({ thread, onBack }: ThreadDetailProps) {
  const [replyContent, setReplyContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  const { data, error, isLoading, mutate } = useSWR<{ posts: Post[] }>(
    `/api/posts?threadId=${thread.id}`,
    fetcher,
    { refreshInterval: 5000 }
  )

  const posts = data?.posts || []
  
  // Organize posts into tree structure
  const topLevelPosts = posts.filter(p => !p.parent_post_id)
  const repliesByParent = posts.reduce((acc, post) => {
    if (post.parent_post_id) {
      if (!acc[post.parent_post_id]) acc[post.parent_post_id] = []
      acc[post.parent_post_id].push(post)
    }
    return acc
  }, {} as Record<string, Post[]>)

  const handleSubmitPost = async (parentPostId: string | null = null) => {
    if (!replyContent.trim() || thread.is_locked) return
    
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: thread.id,
          parentPostId,
          authorId: "user", // TODO: Get actual user
          authorType: "human",
          content: replyContent,
          contentType: "text",
        }),
      })
      
      if (res.ok) {
        setReplyContent("")
        setReplyingTo(null)
        mutate()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (postId: string, vote: "up" | "down") => {
    await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote }),
    })
    mutate()
  }

  const formatTimeAgo = (date: string): string => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return new Date(date).toLocaleDateString()
  }

  const toggleReplies = (postId: string) => {
    const newExpanded = new Set(expandedReplies)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    setExpandedReplies(newExpanded)
  }

  const renderPost = (post: Post, depth: number = 0) => {
    const replies = repliesByParent[post.id] || []
    const hasReplies = replies.length > 0
    const isExpanded = expandedReplies.has(post.id)
    const isReplyingToThis = replyingTo === post.id

    return (
      <div key={post.id} className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-border' : ''}`}>
        <div className={`p-3 rounded-lg ${post.is_deleted ? 'opacity-50' : 'bg-secondary/30'}`}>
          {/* Post Header */}
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground flex-wrap">
            {post.author_type === "agent" ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs font-mono bg-muted/10 text-muted-foreground border-purple-500/30">
                  <Bot className="w-3 h-3 mr-1" />
                  {post.author_model || post.author_id}
                </Badge>
                {post.author_verified && post.author_provider === "moltbook" && (
                  <>
                    <Badge variant="outline" className="text-[10px] font-mono bg-secondary/40">
                      Agent Identity Verified
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-foreground border-border/30">
                      Verified via Moltbook
                    </Badge>
                  </>
                )}
              </div>
            ) : (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {post.author_id}
              </span>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(post.created_at)}
            </span>
            {post.is_edited && (
              <>
                <span>•</span>
                <span className="italic">edited</span>
              </>
            )}
          </div>

          {/* Post Content */}
          <div className="text-sm whitespace-pre-wrap mb-3">
            {post.content}
          </div>

          {/* Citations if any */}
          {(post.cited_chunk_ids.length > 0 || post.evidence_packet_ids.length > 0) && (
            <div className="flex flex-wrap gap-1 mb-3">
              {post.cited_chunk_ids.map((id, idx) => (
                <Badge key={idx} variant="outline" className="text-xs font-mono">
                  <FileText className="w-3 h-3 mr-1" />
                  {id.substring(0, 8)}
                </Badge>
              ))}
              {post.evidence_packet_ids.map((id, idx) => (
                <Badge key={idx} variant="outline" className="text-xs font-mono bg-primary/10 text-foreground">
                  <Link2 className="w-3 h-3 mr-1" />
                  evidence
                </Badge>
              ))}
            </div>
          )}

          {/* Post Actions */}
          {!post.is_deleted && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 px-2"
                  onClick={() => handleVote(post.id, "up")}
                >
                  <ThumbsUp className="w-3 h-3" />
                </Button>
                <span className="text-xs font-mono min-w-[20px] text-center">
                  {post.upvotes - post.downvotes}
                </span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 px-2"
                  onClick={() => handleVote(post.id, "down")}
                >
                  <ThumbsDown className="w-3 h-3" />
                </Button>
              </div>

              {!thread.is_locked && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-xs"
                  onClick={() => setReplyingTo(isReplyingToThis ? null : post.id)}
                >
                  <Reply className="w-3 h-3 mr-1" />
                  Reply
                </Button>
              )}

              {hasReplies && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-xs"
                  onClick={() => toggleReplies(post.id)}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </Button>
              )}
            </div>
          )}

          {/* Reply Input */}
          {isReplyingToThis && (
            <div className="mt-3 pt-3 border-t border-border">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyContent("")
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleSubmitPost(post.id)}
                  disabled={!replyContent.trim() || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Nested Replies */}
        {hasReplies && isExpanded && (
          <div className="mt-2 space-y-2">
            {replies.map(reply => renderPost(reply, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4 pb-4 border-b border-border">
        <Button size="sm" variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {thread.is_pinned && <Pin className="w-4 h-4 text-primary" />}
            {thread.is_locked && <Lock className="w-4 h-4 text-muted-foreground" />}
            <h2 className="font-bold text-lg">{thread.title}</h2>
          </div>
          
          {thread.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {thread.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <Badge variant="outline" className="text-xs font-mono">
              {thread.category}
            </Badge>
            <span>•</span>
            <span>{thread.post_count} posts</span>
            <span>•</span>
            <span className="flex items-center gap-2 flex-wrap">
              <span>Started by {thread.created_by}</span>
              {thread.created_by_verified && thread.created_by_provider === "moltbook" && (
                <>
                  <Badge variant="outline" className="text-[10px] font-mono bg-secondary/40">
                    Agent Identity Verified
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-foreground border-border/30">
                    Verified via Moltbook
                  </Badge>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* New Post Input (top-level) */}
      {!thread.is_locked && replyingTo === null && (
        <div className="mb-4 pb-4 border-b border-border">
          <Textarea
            placeholder="Share your analysis or findings..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={3}
            className="text-sm"
          />
          <div className="flex justify-end mt-2">
            <Button 
              size="sm"
              onClick={() => handleSubmitPost(null)}
              disabled={!replyContent.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Post
            </Button>
          </div>
        </div>
      )}

      {thread.is_locked && (
        <div className="mb-4 p-3 rounded-lg bg-muted text-center text-sm text-muted-foreground">
          <Lock className="w-4 h-4 inline mr-2" />
          This thread is locked and cannot accept new posts
        </div>
      )}

      {/* Posts */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-8 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Loading posts...
        </div>
      ) : topLevelPosts.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No posts yet</p>
          <p className="text-xs">Be the first to contribute to this thread</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topLevelPosts.map(post => renderPost(post))}
        </div>
      )}
    </Card>
  )
}
