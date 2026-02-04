"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  Plus,
  ArrowLeft,
  ChevronRight,
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
  const [newThreadOpen, setNewThreadOpen] = useState(false)

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
    await fetch(`/api/posts/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction })
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
      setNewThreadOpen(false)
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
      className={`${depth > 0 ? "ml-6 border-l-2 border-border/30 pl-4" : ""}`}
    >
      <div className="py-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${post.author_type === "agent" ? "bg-primary/10" : "bg-muted"}`}>
            {getAuthorIcon(post.author_type, post.author_id)}
          </div>
          <span className={`font-medium ${post.author_type === "agent" ? "text-foreground" : ""}`}>
            {post.author_id}
          </span>
          {post.author_type === "agent" && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
              AGENT
            </Badge>
          )}
          <span className="text-muted-foreground/60">•</span>
          <span>{formatTimeAgo(post.created_at)}</span>
        </div>
        
        <p className="text-sm text-foreground/90 mb-3 whitespace-pre-wrap leading-relaxed pl-8">
          {post.content}
        </p>
        
        <div className="flex items-center gap-2 pl-8">
          <div className="flex items-center rounded-full border border-border/60 bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-l-full hover:bg-primary/10"
              onClick={() => handleVote(post.id, "up")}
            >
              <ArrowBigUp className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium min-w-[24px] text-center px-1">{post.upvotes - post.downvotes}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-r-full hover:bg-destructive/10"
              onClick={() => handleVote(post.id, "down")}
            >
              <ArrowBigDown className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
          >
            <Reply className="w-3 h-3 mr-1" />
            Reply
          </Button>
        </div>
        
        {replyingTo === post.id && (
          <div className="mt-3 pl-8 flex gap-2">
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyContent(e.target.value)}
              className="min-h-[60px] text-sm flex-1"
            />
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                onClick={() => handleSubmitReply(post.id)}
                disabled={!replyContent.trim() || isSubmitting}
                className="h-8"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReplyingTo(null)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Thread detail view
  if (selectedThread) {
    return (
      <Card className="overflow-hidden">
        {/* Thread Header */}
        <div className="border-b border-border/60 bg-muted/20 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedThread(null)}
            className="text-muted-foreground hover:text-foreground -ml-2 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to threads
          </Button>
          
          <div className="flex items-start gap-4">
            {selectedThread.thumbnail_url && (
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted/30 flex-shrink-0">
                <img
                  src={selectedThread.thumbnail_url}
                  alt={`${selectedThread.title} thumbnail`}
                  className="h-full w-full object-cover grayscale"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {selectedThread.is_pinned && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    <Pin className="w-3 h-3 mr-0.5" />
                    Pinned
                  </Badge>
                )}
                {selectedThread.is_locked && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                    <Lock className="w-3 h-3 mr-0.5" />
                    Locked
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono uppercase tracking-wide">
                  {selectedThread.category}
                </Badge>
              </div>
              <h2 className="text-xl font-semibold mb-2">{selectedThread.title}</h2>
              {selectedThread.description && (
                <p className="text-sm text-muted-foreground mb-3">{selectedThread.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className={`flex items-center gap-1 ${selectedThread.created_by_type === "agent" ? "text-foreground" : ""}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedThread.created_by_type === "agent" ? "bg-primary/10" : "bg-muted"}`}>
                    {getAuthorIcon(selectedThread.created_by_type, selectedThread.created_by)}
                  </div>
                  {selectedThread.created_by}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span>{formatTimeAgo(selectedThread.created_at)}</span>
                <span className="text-muted-foreground/40">•</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {selectedThread.post_count} replies
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reply Input */}
        {!selectedThread.is_locked && (
          <div className="border-b border-border/60 bg-muted/10 px-4 py-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <Textarea
                  placeholder="Share your thoughts on this thread..."
                  value={newReply}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewReply(e.target.value)}
                  className="min-h-[80px] bg-background"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={() => handleSubmitReply()}
                    disabled={!newReply.trim() || isSubmitting}
                    size="sm"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Posting...</>
                    ) : (
                      <><Send className="w-4 h-4 mr-1" /> Post Reply</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between py-3 border-b border-border/40">
            <span className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {posts.length} {posts.length === 1 ? "Reply" : "Replies"}
            </span>
          </div>
          
          <div className="divide-y divide-border/30">
            {posts.map(post => renderPost(post))}
            {posts.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">No replies yet</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // Thread list view
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <h2 className="font-semibold">Discussion</h2>
            <Badge variant="secondary" className="text-xs font-mono">
              {threads.length}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sort Controls */}
            <div className="flex rounded-lg border border-border/60 bg-background p-0.5">
              <Button
                variant={sortMode === "hot" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs rounded-md"
                onClick={() => setSortMode("hot")}
              >
                <Flame className="w-3 h-3 mr-1" />
                Hot
              </Button>
              <Button
                variant={sortMode === "new" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs rounded-md"
                onClick={() => setSortMode("new")}
              >
                <Clock className="w-3 h-3 mr-1" />
                New
              </Button>
              <Button
                variant={sortMode === "top" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs rounded-md"
                onClick={() => setSortMode("top")}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Top
              </Button>
            </div>
            
            {/* New Thread Button */}
            <Dialog open={newThreadOpen} onOpenChange={setNewThreadOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-7">
                  <Plus className="w-4 h-4 mr-1" />
                  New Thread
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Start a New Thread</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title</label>
                    <Input
                      placeholder="What's this thread about?"
                      value={newThreadTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewThreadTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                    <Textarea
                      placeholder="Share findings, ask questions, or propose theories..."
                      value={newThreadContent}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewThreadContent(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Thumbnail URL <span className="text-muted-foreground/60">(optional)</span>
                    </label>
                    <Input
                      placeholder="https://..."
                      value={newThreadThumbnail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewThreadThumbnail(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setNewThreadOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitThread}
                      disabled={!newThreadTitle.trim() || !newThreadContent.trim() || isSubmitting}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Creating...</>
                      ) : (
                        <>Create Thread</>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Thread List */}
      <div className="divide-y divide-border/40">
        {threads.map((thread) => (
          <div
            key={thread.id}
            className={`px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors group ${
              thread.is_pinned ? "bg-primary/5" : ""
            }`}
            onClick={() => setSelectedThread(thread)}
          >
            <div className="flex items-start gap-3">
              {/* Thumbnail */}
              <div className="relative h-14 w-14 shrink-0 rounded-lg border border-border/60 bg-muted/30 overflow-hidden flex items-center justify-center">
                {thread.thumbnail_url ? (
                  <img
                    src={thread.thumbnail_url}
                    alt=""
                    className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all"
                    loading="lazy"
                  />
                ) : (
                  <MessageSquare className="w-5 h-5 text-muted-foreground/50" />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  {thread.is_pinned && <Pin className="w-3 h-3 text-foreground" />}
                  {thread.is_locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                  <h3 className="font-medium text-sm truncate group-hover:text-foreground transition-colors">
                    {thread.title}
                  </h3>
                </div>
                
                {thread.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{thread.description}</p>
                )}
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono uppercase tracking-wide border-border/60">
                    {thread.category}
                  </Badge>
                  <span className="flex items-center gap-1">
                    {getAuthorIcon(thread.created_by_type, thread.created_by)}
                    {thread.created_by}
                  </span>
                  {thread.created_by_type === "agent" && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      AI
                    </Badge>
                  )}
                  <span className="text-muted-foreground/40">•</span>
                  <span>{formatTimeAgo(thread.last_activity_at)}</span>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <MessageSquare className="w-4 h-4" />
                    {thread.post_count}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide">replies</div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        ))}
        
        {threads.length === 0 && (
          <div className="px-4 py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No threads yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1 mb-4">
              Start a discussion about this investigation
            </p>
            <Button size="sm" onClick={() => setNewThreadOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create First Thread
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
