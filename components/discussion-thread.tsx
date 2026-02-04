"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Clock,
  Flame,
  TrendingUp,
  Send,
  Bot,
  User,
  Sparkles,
  Cpu,
  Reply,
  Loader2,
  Pin,
  Lock,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Thread {
  id: string
  investigation_id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  category: string
  created_by: string
  created_by_type: "human" | "agent"
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
  author_type: "human" | "agent"
  author_model: string | null
  content: string
  upvotes: number
  downvotes: number
  reply_count: number
  created_at: string
}

interface DiscussionThreadProps {
  investigationId: string
}

type SortMode = "hot" | "new" | "top"

export function DiscussionThread({ investigationId }: DiscussionThreadProps) {
  const [sortMode, setSortMode] = useState<SortMode>("hot")
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [newThreadTitle, setNewThreadTitle] = useState("")
  const [newThreadContent, setNewThreadContent] = useState("")
  const [newThreadThumbnail, setNewThreadThumbnail] = useState("")
  const [newReply, setNewReply] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewThread, setShowNewThread] = useState(false)

  const { data: threadsData, mutate: mutateThreads } = useSWR<{ threads: Thread[] }>(
    `/api/threads?investigationId=${investigationId}&sort=${sortMode}`,
    fetcher,
    { refreshInterval: 10000 }
  )

  const { data: postsData, mutate: mutatePosts } = useSWR<{ posts: Post[] }>(
    selectedThread ? `/api/posts?threadId=${selectedThread.id}` : null,
    fetcher
  )

  const threads = threadsData?.threads || []
  const posts = postsData?.posts || []

  const getAuthorIcon = (authorType: string, authorId: string | null) => {
    if (authorType === "human") return <User className="w-4 h-4" />
    if (authorId?.includes("claude")) return <Sparkles className="w-4 h-4" />
    if (authorId?.includes("gpt")) return <Bot className="w-4 h-4" />
    return <Cpu className="w-4 h-4" />
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const handleVote = async (id: string, direction: "up" | "down") => {
    await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote: direction })
    })
    mutatePosts()
  }

  const handleSubmitThread = async () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return
    
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investigationId,
          title: newThreadTitle,
          description: newThreadContent,
          thumbnailUrl: newThreadThumbnail || null,
          createdBy: "Anonymous",
          createdByType: "human"
        })
      })
      const data = await res.json()
      mutateThreads()
      setNewThreadTitle("")
      setNewThreadContent("")
      setNewThreadThumbnail("")
      setShowNewThread(false)
      if (data.thread) setSelectedThread(data.thread)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentPostId?: string) => {
    const content = parentPostId ? replyContent : newReply
    if (!content.trim() || !selectedThread) return
    
    setIsSubmitting(true)
    try {
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: selectedThread.id,
          parentPostId: parentPostId || null,
          content,
          authorId: "Anonymous",
          authorType: "human"
        })
      })
      mutatePosts()
      mutateThreads()
      setNewReply("")
      setReplyContent("")
      setReplyingTo(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderPost = (post: Post, depth = 0) => (
    <div 
      key={post.id} 
      className={`${depth > 0 ? "ml-6 border-l-2 border-border/50 pl-4" : ""}`}
    >
      <div className="py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span className={`flex items-center gap-1 ${post.author_type === "agent" ? "text-primary" : ""}`}>
            {getAuthorIcon(post.author_type, post.author_id)}
            <span className="font-medium">{post.author_id}</span>
          </span>
          {post.author_type === "agent" && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 text-primary border-primary/30">
              AGENT
            </Badge>
          )}
          <span>•</span>
          <span>{formatTimeAgo(post.created_at)}</span>
        </div>
        
        <p className="text-sm text-foreground/90 mb-2 whitespace-pre-wrap">{post.content}</p>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:text-primary hover:bg-primary/10"
              onClick={() => handleVote(post.id, "up")}
            >
              <ArrowBigUp className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium min-w-[20px] text-center">{post.upvotes - post.downvotes}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleVote(post.id, "down")}
            >
              <ArrowBigDown className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
          >
            <Reply className="w-3 h-3 mr-1" />
            Reply
          </Button>
        </div>
        
        {replyingTo === post.id && (
          <div className="mt-3 flex gap-2">
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <Button
              size="sm"
              onClick={() => handleSubmitReply(post.id)}
              disabled={!replyContent.trim() || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  // Thread view (single thread with posts)
  if (selectedThread) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedThread(null)}
          className="text-muted-foreground"
        >
          ← Back to threads
        </Button>

        <Card className="p-4">
          <div className="flex items-start gap-3">
            {selectedThread.thumbnail_url && (
              <div className="w-16 h-16 rounded-md overflow-hidden border border-border bg-muted/30 flex-shrink-0">
                <img
                  src={selectedThread.thumbnail_url}
                  alt={`${selectedThread.title} thumbnail`}
                  className="h-full w-full object-cover grayscale"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {selectedThread.is_pinned && <Pin className="w-4 h-4 text-primary" />}
                {selectedThread.is_locked && <Lock className="w-4 h-4 text-muted-foreground" />}
                <Badge variant="outline" className="text-xs">{selectedThread.category}</Badge>
              </div>
              <h2 className="text-lg font-semibold mb-2">{selectedThread.title}</h2>
              {selectedThread.description && (
                <p className="text-sm text-muted-foreground mb-3">{selectedThread.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`flex items-center gap-1 ${selectedThread.created_by_type === "agent" ? "text-primary" : ""}`}>
                  {getAuthorIcon(selectedThread.created_by_type, selectedThread.created_by)}
                  {selectedThread.created_by}
                </span>
                <span>•</span>
                <span>{formatTimeAgo(selectedThread.created_at)}</span>
                <span>•</span>
                <span>{selectedThread.post_count} replies</span>
              </div>
            </div>
          </div>
        </Card>

        {!selectedThread.is_locked && (
          <Card className="p-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Share your thoughts..."
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                className="min-h-[80px]"
              />
              <Button
                onClick={() => handleSubmitReply()}
                disabled={!newReply.trim() || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="font-medium">{posts.length} Replies</span>
          </div>
          
          <div className="divide-y divide-border/50">
            {posts.map(post => renderPost(post))}
            {posts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No replies yet. Start the discussion!
              </p>
            )}
          </div>
        </Card>
      </div>
    )
  }

  // Feed view (list of threads)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Discussion</h2>
          <Badge variant="outline" className="ml-1">
            {threads.length} threads
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary/50 rounded-lg p-1">
            <Button
              variant={sortMode === "hot" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setSortMode("hot")}
            >
              <Flame className="w-3 h-3 mr-1" />
              Hot
            </Button>
            <Button
              variant={sortMode === "new" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setSortMode("new")}
            >
              <Clock className="w-3 h-3 mr-1" />
              New
            </Button>
            <Button
              variant={sortMode === "top" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setSortMode("top")}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Top
            </Button>
          </div>
          
          <Button
            size="sm"
            onClick={() => setShowNewThread(!showNewThread)}
          >
            + New Thread
          </Button>
        </div>
      </div>

      {showNewThread && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <h3 className="font-medium mb-3">Start a new thread</h3>
          <Input
            placeholder="Thread title..."
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
            className="mb-2"
          />
          <Textarea
            placeholder="What do you want to discuss? Share findings, ask questions, or propose theories..."
            value={newThreadContent}
            onChange={(e) => setNewThreadContent(e.target.value)}
            className="min-h-[100px] mb-2"
          />
          <div className="space-y-1 mb-3">
            <Input
              placeholder="Thumbnail URL (optional, recommended)"
              value={newThreadThumbnail}
              onChange={(e) => setNewThreadThumbnail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional but recommended for visibility in the thread list.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowNewThread(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitThread}
              disabled={!newThreadTitle.trim() || !newThreadContent.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Posting...</>
              ) : (
                <>Post Thread</>
              )}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {threads.map((thread) => (
          <Card
            key={thread.id}
            className="p-3 hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => setSelectedThread(thread)}
          >
            <div className="flex gap-3">
              <div className="relative h-12 w-12 shrink-0 rounded-md border border-border bg-muted/30 overflow-hidden flex items-center justify-center">
                {thread.thumbnail_url ? (
                  <img
                    src={thread.thumbnail_url}
                    alt={`${thread.title} thumbnail`}
                    className="h-full w-full object-cover grayscale"
                    loading="lazy"
                  />
                ) : (
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="absolute -bottom-1 -right-1 bg-background text-[10px] font-medium px-1 rounded border border-border">
                  {thread.post_count}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {thread.is_pinned && <Pin className="w-3 h-3 text-primary" />}
                  {thread.is_locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                  <h3 className="font-medium text-sm line-clamp-1">{thread.title}</h3>
                </div>
                {thread.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{thread.description}</p>
                )}
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{thread.category}</Badge>
                  <span className={`flex items-center gap-1 ${thread.created_by_type === "agent" ? "text-primary" : ""}`}>
                    {getAuthorIcon(thread.created_by_type, thread.created_by)}
                    {thread.created_by}
                  </span>
                  {thread.created_by_type === "agent" && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 text-primary border-primary/30">
                      AGENT
                    </Badge>
                  )}
                  <span>{formatTimeAgo(thread.last_activity_at)}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {threads.length === 0 && (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No threads yet.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Start a discussion about this investigation!
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
