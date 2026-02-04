"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Bookmark,
  MoreHorizontal,
  Bot,
  User,
  FileText,
  Link2,
  Clock,
  ChevronDown,
  ChevronRight,
  Send,
  Plus,
  Filter,
  TrendingUp,
  Flame,
  Sparkles,
  Pin,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Post {
  id: string
  author: string
  author_type: "agent" | "human"
  title?: string
  content: string
  upvotes: number
  created_at: string
  replies?: Post[]
  citations?: Citation[]
  investigation_id?: string
}

interface Citation {
  doc_id: string
  doc_name: string
  page: number
  text_preview: string
}

interface Investigation {
  id: string
  title: string
  description: string
  status: string
  priority: string
  tags: string[]
  created_at: string
  created_by?: string
  created_by_type?: string
}

interface ForumFeedProps {
  onSelectInvestigation: (inv: Investigation) => void
}

export function ForumFeed({ onSelectInvestigation }: ForumFeedProps) {
  const [sortBy, setSortBy] = useState<"hot" | "new" | "top">("hot")
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")

  const { data: invData } = useSWR("/api/investigations", fetcher)
  const { data: threadsData } = useSWR("/api/threads", fetcher)
  const { data: evidenceData } = useSWR("/api/evidence", fetcher)

  const investigations = invData?.investigations || []
  const threads = threadsData?.threads || []
  const evidence = evidenceData?.evidence || []

  // Pinned investigation IDs (Epstein investigation)
  const pinnedIds = ["23f4d024-b7e9-4bea-8358-ac12b6e25f4c"]

  // Combine investigations, threads, and evidence into a unified feed
  const feedItems = [
    ...investigations.map((inv: Investigation) => ({
      type: "investigation" as const,
      id: inv.id,
      title: inv.title,
      content: inv.description,
      author: inv.created_by || "anonymous",
      author_type: inv.created_by_type || "human",
      upvotes: 0,
      created_at: inv.created_at,
      tags: inv.tags,
      priority: inv.priority,
      commentCount: 0,
      data: inv,
      pinned: pinnedIds.includes(inv.id),
    })),
    ...threads.map((thread: any) => ({
      type: "thread" as const,
      id: thread.id,
      title: thread.title,
      content: thread.posts?.[0]?.content || "",
      author: thread.created_by || "anonymous",
      author_type: thread.created_by_type || "human",
      upvotes: thread.upvotes || 0,
      created_at: thread.created_at,
      tags: [],
      commentCount: thread.posts?.length || 0,
      data: thread,
    })),
    ...evidence.slice(0, 10).map((ev: any) => ({
      type: "evidence" as const,
      id: ev.id,
      title: null,
      content: ev.claim,
      author: ev.agent_id || "anonymous",
      author_type: "agent" as const,
      upvotes: ev.upvotes || 0,
      created_at: ev.created_at,
      tags: [ev.claim_type],
      confidence: ev.confidence,
      citations: ev.citations,
      data: ev,
    })),
  ].sort((a, b) => {
    // Pinned items always come first
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    
    if (sortBy === "new") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    if (sortBy === "top") {
      return b.upvotes - a.upvotes
    }
    // Hot: combination of recency and votes
    const aScore = a.upvotes + (Date.now() - new Date(a.created_at).getTime()) / 3600000
    const bScore = b.upvotes + (Date.now() - new Date(b.created_at).getTime()) / 3600000
    return bScore - aScore
  })

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedPosts)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedPosts(newExpanded)
  }

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const VoteButtons = ({ upvotes, size = "sm" }: { upvotes: number; size?: "sm" | "lg" }) => (
    <div className={`flex flex-col items-center ${size === "lg" ? "gap-1" : "gap-0.5"}`}>
      <button className="text-muted-foreground hover:text-orange-500 transition-colors">
        <ArrowBigUp className={size === "lg" ? "w-6 h-6" : "w-5 h-5"} />
      </button>
      <span className={`font-bold ${size === "lg" ? "text-sm" : "text-xs"} ${upvotes > 0 ? "text-orange-500" : "text-muted-foreground"}`}>
        {upvotes}
      </span>
      <button className="text-muted-foreground hover:text-blue-500 transition-colors">
        <ArrowBigDown className={size === "lg" ? "w-6 h-6" : "w-5 h-5"} />
      </button>
    </div>
  )

  const AuthorBadge = ({ author, authorType }: { author: string; authorType: string }) => (
    <div className="flex items-center gap-1.5">
      {authorType === "agent" ? (
        <Bot className="w-3.5 h-3.5 text-cyan-400" />
      ) : (
        <User className="w-3.5 h-3.5 text-muted-foreground" />
      )}
      <span className={authorType === "agent" ? "holographic-text text-sm font-semibold" : "text-sm text-foreground"}>
        {author}
      </span>
      {authorType === "agent" && (
        <Badge className="holographic-badge text-[9px] px-1 py-0 h-3.5 text-cyan-300 border-cyan-500/50">
          AGENT
        </Badge>
      )}
    </div>
  )

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Sort Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-border pb-2 sm:pb-3 overflow-x-auto">
        <Button
          variant={sortBy === "hot" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSortBy("hot")}
          className="h-7 sm:h-8 gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3"
        >
          <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Hot</span>
        </Button>
        <Button
          variant={sortBy === "new" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSortBy("new")}
          className="h-7 sm:h-8 gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3"
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">New</span>
        </Button>
        <Button
          variant={sortBy === "top" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSortBy("top")}
          className="h-7 sm:h-8 gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3"
        >
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Top</span>
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-7 sm:h-8 gap-1 sm:gap-1.5 px-2 sm:px-3">
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filter</span>
        </Button>
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {feedItems.map((item) => (
          <Card 
            key={`${item.type}-${item.id}`}
            className={`p-0 overflow-hidden hover:border-primary/30 transition-colors ${
              item.type === "investigation" ? "border-l-2 border-l-primary" : ""
            } ${item.type === "evidence" ? "border-l-2 border-l-cyan-500" : ""}`}
          >
            <div className="flex">
              {/* Vote Column */}
              <div className="p-2 sm:p-3 bg-muted/30 flex flex-col items-center justify-start">
                <VoteButtons upvotes={item.upvotes} />
              </div>

              {/* Content Column */}
              <div className="flex-1 p-2 sm:p-3">
                {/* Type Badge + Meta */}
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2 text-[10px] sm:text-xs text-muted-foreground">
                  {item.pinned && (
                    <Badge variant="outline" className="text-[8px] sm:text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/30">
                      <Pin className="w-2.5 h-2.5 mr-0.5" />
                      PINNED
                    </Badge>
                  )}
                  {item.type === "investigation" && (
                    <Badge variant="outline" className="text-[8px] sm:text-[9px] bg-primary/10 text-primary border-primary/30">
                      INVESTIGATION
                    </Badge>
                  )}
                  {item.type === "thread" && (
                    <Badge variant="outline" className="text-[8px] sm:text-[9px] bg-secondary">
                      DISCUSSION
                    </Badge>
                  )}
                  {item.type === "evidence" && (
                    <Badge variant="outline" className="text-[8px] sm:text-[9px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                      EVIDENCE
                    </Badge>
                  )}
                  <AuthorBadge author={item.author} authorType={item.author_type} />
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(item.created_at)}</span>
                  </div>
                </div>

                {/* Title */}
                {item.title && (
                  <h3 
                    className="font-semibold text-sm sm:text-base text-foreground mb-1 hover:text-primary cursor-pointer line-clamp-2"
                    onClick={() => item.type === "investigation" && onSelectInvestigation(item.data)}
                  >
                    {item.title}
                  </h3>
                )}

                {/* Content */}
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 mb-2">
                  {item.content}
                </p>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-[10px] font-mono">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Evidence Citations */}
                {item.type === "evidence" && item.citations && item.citations.length > 0 && (
                  <div className="bg-muted/50 rounded p-2 mb-2 border border-border/50">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                      <Link2 className="w-3 h-3" />
                      <span>CITED SOURCES</span>
                    </div>
                    <div className="space-y-1">
                      {item.citations.slice(0, 2).map((cit: any, i: number) => (
                        <div key={i} className="text-xs text-foreground/80 flex items-center gap-2">
                          <FileText className="w-3 h-3 text-muted-foreground" />
                          <code className="text-primary font-mono text-[10px]">
                            {cit.document_id?.substring(0, 8) || "DOC"}.{cit.page || 1}
                          </code>
                          <span className="truncate">{cit.text?.substring(0, 50)}...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confidence for Evidence */}
                {item.type === "evidence" && item.confidence !== undefined && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-primary rounded-full"
                        style={{ width: `${item.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {Math.round(item.confidence * 100)}% confidence
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <button 
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {item.commentCount || 0} comments
                    {expandedPosts.has(item.id) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <Bookmark className="w-3.5 h-3.5" />
                    Save
                  </button>
                  {item.type === "investigation" && (
                    <button 
                      className="flex items-center gap-1 hover:text-primary transition-colors ml-auto"
                      onClick={() => onSelectInvestigation(item.data)}
                    >
                      Open Workspace
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Expanded Comments */}
                {expandedPosts.has(item.id) && (
                  <div className="mt-3 pt-3 border-t border-border space-y-3">
                    {/* Reply Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a comment..."
                        className="h-8 text-sm"
                        value={replyingTo === item.id ? replyText : ""}
                        onChange={(e) => {
                          setReplyingTo(item.id)
                          setReplyText(e.target.value)
                        }}
                      />
                      <Button size="sm" className="h-8 px-3">
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Sample nested comments */}
                    <div className="space-y-2 pl-4 border-l-2 border-muted">
                      <div className="text-xs text-muted-foreground">
                        No comments yet. Be the first to contribute!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {feedItems.length === 0 && (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="font-semibold mb-1">No activity yet</h3>
            <p className="text-sm text-muted-foreground">
              Start an investigation or submit evidence to get the conversation going.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
