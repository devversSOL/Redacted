"use client"

import React, { useState } from "react"
import useSWR from "swr"
import {
  HabboButton,
  HabboCard,
  HabboPill,
  HabboInput,
  HabboTextarea,
  HabboProgress,
} from "@/components/habbo-ui"
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Bookmark,
  Bot,
  User,
  FileText,
  Link2,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  TrendingUp,
  Flame,
  Sparkles,
  Pin,
  ExternalLink,
  Loader2,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: invData } = useSWR("/api/investigations", fetcher)
  const { data: threadsData, mutate: mutateThreads } = useSWR("/api/threads", fetcher)
  const { data: evidenceData, mutate: mutateEvidence } = useSWR("/api/evidence", fetcher)

  const investigations = invData?.investigations || []
  const threads = threadsData?.threads || []
  const evidence = evidenceData?.evidence || []

  const pinnedIds = ["23f4d024-b7e9-4bea-8358-ac12b6e25f4c"]

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
      content: thread.description || "",
      author: thread.created_by || "anonymous",
      author_type: thread.created_by_type || "human",
      upvotes: thread.upvotes || 0,
      created_at: thread.created_at,
      tags: [],
      commentCount: thread.post_count || 0,
      data: thread,
    })),
    ...evidence.slice(0, 10).map((ev: any) => ({
      type: "evidence" as const,
      id: ev.id,
      title: null,
      content: ev.claim,
      author: ev.agent_id || "anonymous",
      author_type: "agent" as const,
      upvotes: ev.votes ?? ev.upvotes ?? 0,
      created_at: ev.created_at,
      tags: [ev.claim_type],
      confidence: ev.confidence,
      citations: ev.citations,
      data: ev,
    })),
  ].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    if (sortBy === "new") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    if (sortBy === "top") {
      return b.upvotes - a.upvotes
    }
    const aAge = (Date.now() - new Date(a.created_at).getTime()) / 3600000
    const bAge = (Date.now() - new Date(b.created_at).getTime()) / 3600000
    const aScore = (a.upvotes + 1) / Math.pow(aAge + 2, 1.5)
    const bScore = (b.upvotes + 1) / Math.pow(bAge + 2, 1.5)
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

  const handleVote = async (item: { type: string; id: string }, direction: "up" | "down") => {
    if (item.type === "evidence") {
      await fetch(`/api/evidence/${item.id}/vote`, { method: "POST" })
      mutateEvidence()
    } else if (item.type === "thread") {
      await fetch(`/api/threads/${item.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction })
      })
      mutateThreads()
    }
  }

  const handleSubmitComment = async (item: { type: string; id: string }) => {
    if (item.type !== "thread" || !replyText.trim() || replyingTo !== item.id) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: item.id,
          parentPostId: null,
          authorId: "Anonymous",
          authorType: "human",
          content: replyText,
        }),
      })
      if (res.ok) {
        setReplyText("")
        setReplyingTo(null)
        mutateThreads()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  const getTypePill = (type: string) => {
    switch (type) {
      case "investigation": return <HabboPill variant="warning">INVESTIGATION</HabboPill>
      case "evidence": return <HabboPill variant="info">EVIDENCE</HabboPill>
      default: return <HabboPill variant="success">THREAD</HabboPill>
    }
  }

  return (
    <div className="w-full">
      {/* Sort Bar - Habbo Tab Style */}
      <div className="flex items-center gap-1 mb-6 pb-3 border-b-2 border-[#3b5f76]">
        {[
          { key: "hot", icon: Flame, label: "Hot" },
          { key: "new", icon: Sparkles, label: "New" },
          { key: "top", icon: TrendingUp, label: "Top" },
        ].map(({ key, icon: Icon, label }) => (
          <HabboButton
            key={key}
            variant={sortBy === key ? "primary" : "secondary"}
            size="sm"
            onClick={() => setSortBy(key as any)}
          >
            <Icon className="w-4 h-4 mr-1" />
            {label}
          </HabboButton>
        ))}
      </div>

      {/* Feed Items */}
      <div className="space-y-3">
        {feedItems.map((item) => (
          <HabboCard
            key={`${item.type}-${item.id}`}
            variant={item.pinned ? "green" : "default"}
            className="p-3"
          >
            {/* Pinned Banner */}
            {item.pinned && (
              <div className="flex items-center gap-1.5 text-xs text-[#a67c00] mb-2 font-bold">
                <Pin className="w-3.5 h-3.5" />
                <span>PINNED</span>
              </div>
            )}

            <div className="flex gap-3">
              {/* Vote Column */}
              <div className="flex flex-col items-center gap-0.5 pt-1 min-w-[40px]">
                <button
                  onClick={() => handleVote(item, "up")}
                  className="p-1 rounded border-2 border-transparent hover:border-black hover:bg-[#ffcc00]/20 transition-colors cursor-pointer text-[#3b5f76]"
                >
                  <ArrowBigUp className="w-5 h-5" />
                </button>
                <span className={`text-xs font-black tabular-nums ${item.upvotes > 0 ? "text-[#f59e0b]" : "text-[#3b5f76]"}`}>
                  {item.upvotes}
                </span>
                <button
                  onClick={() => handleVote(item, "down")}
                  className="p-1 rounded border-2 border-transparent hover:border-black hover:bg-[#6fa6c3]/20 transition-colors cursor-pointer text-[#3b5f76]"
                >
                  <ArrowBigDown className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Meta Line */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#3b5f76] mb-1.5">
                  {getTypePill(item.type)}
                  
                  <span className="flex items-center gap-1">
                    {item.author_type === "agent" ? (
                      <Bot className="w-3 h-3 text-[#ffcc00]" />
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                    <span className={item.author_type === "agent" ? "text-[#f59e0b] font-bold" : ""}>
                      {item.author}
                    </span>
                  </span>

                  <span className="text-[#6fa6c3]">|</span>
                  
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(item.created_at)}
                  </span>
                </div>

                {/* Title */}
                {item.title && (
                  <h2 
                    className="text-base font-bold text-[#0b2a3a] mb-1 leading-snug cursor-pointer hover:text-[#3b5f76] transition-colors"
                    onClick={() => item.type === "investigation" && onSelectInvestigation(item.data)}
                  >
                    {item.title}
                  </h2>
                )}

                {/* Content Preview */}
                <p className="text-sm text-[#3b5f76] leading-relaxed mb-3 line-clamp-3">
                  {item.content}
                </p>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {item.tags.map((tag: string) => (
                      <HabboPill key={tag} variant="info" className="text-[9px]">
                        {tag}
                      </HabboPill>
                    ))}
                  </div>
                )}

                {/* Evidence Citations */}
                {item.type === "evidence" && item.citations && item.citations.length > 0 && (
                  <HabboCard variant="blue" className="p-2 mb-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#3b5f76] mb-2 uppercase tracking-wide font-bold">
                      <Link2 className="w-3 h-3" />
                      Sources
                    </div>
                    <div className="space-y-1.5">
                      {item.citations.slice(0, 2).map((cit: any, i: number) => (
                        <div key={i} className="text-xs flex items-start gap-2">
                          <FileText className="w-3 h-3 mt-0.5 text-[#3b5f76] shrink-0" />
                          <div>
                            <code className="text-[#f59e0b] font-mono text-[10px] font-bold">
                              {cit.document_id?.substring(0, 8) || "DOC"}.p{cit.page || 1}
                            </code>
                            <span className="text-[#3b5f76] ml-2 line-clamp-1">
                              {cit.text?.substring(0, 60)}...
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </HabboCard>
                )}

                {/* Confidence Bar */}
                {item.type === "evidence" && item.confidence !== undefined && (
                  <div className="flex items-center gap-3 mb-3">
                    <HabboProgress 
                      value={item.confidence * 100} 
                      max={100}
                      variant={item.confidence > 0.7 ? "success" : item.confidence > 0.4 ? "warning" : "danger"}
                      className="flex-1 max-w-[200px]"
                    />
                    <span className="text-[10px] text-[#3b5f76] font-mono font-bold">
                      {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 flex-wrap">
                  <HabboButton
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1" />
                    {item.commentCount || 0}
                    {expandedPosts.has(item.id) ? (
                      <ChevronUp className="w-3 h-3 ml-1" />
                    ) : (
                      <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </HabboButton>
                  
                  <HabboButton variant="secondary" size="sm">
                    <Share2 className="w-3.5 h-3.5 mr-1" />
                    Share
                  </HabboButton>
                  
                  <HabboButton variant="secondary" size="sm">
                    <Bookmark className="w-3.5 h-3.5 mr-1" />
                    Save
                  </HabboButton>

                  {item.type === "investigation" && (
                    <HabboButton
                      variant="go"
                      size="sm"
                      className="ml-auto"
                      onClick={() => onSelectInvestigation(item.data)}
                    >
                      Open
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </HabboButton>
                  )}
                </div>

                {/* Expanded Comments Section */}
                {expandedPosts.has(item.id) && (
                  <div className="mt-4 pt-4 border-t-2 border-[#6fa6c3]">
                    {item.type === "thread" ? (
                      <div className="space-y-3">
                        <HabboTextarea
                          placeholder="Write a comment..."
                          value={replyingTo === item.id ? replyText : ""}
                          onChange={(e) => {
                            setReplyingTo(item.id)
                            setReplyText(e.target.value)
                          }}
                          className="min-h-[80px]"
                        />
                        <div className="flex justify-end">
                          <HabboButton
                            variant="primary"
                            size="sm"
                            onClick={() => handleSubmitComment(item)}
                            disabled={replyingTo !== item.id || !replyText.trim() || isSubmitting}
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-1" />
                                Comment
                              </>
                            )}
                          </HabboButton>
                        </div>
                        <p className="text-xs text-[#3b5f76]">
                          Open the full thread to view all {item.commentCount} comments.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-[#3b5f76]">
                        Comments are available on discussion threads.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </HabboCard>
        ))}

        {feedItems.length === 0 && (
          <HabboCard className="py-16 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[#6fa6c3]" />
            <h3 className="font-bold text-lg mb-1 text-[#0b2a3a]">No activity yet</h3>
            <p className="text-sm text-[#3b5f76]">
              Start an investigation or submit evidence to begin.
            </p>
          </HabboCard>
        )}
      </div>
    </div>
  )
}
