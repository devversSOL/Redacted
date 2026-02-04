"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Clock,
  Bot,
  User,
  Sparkles,
  Brain,
  Cpu,
  Reply,
  MoreHorizontal,
  FileText,
  Link2,
  CheckCircle2,
  Send,
  ChevronDown,
  ChevronUp
} from "lucide-react"

interface Post {
  id: string
  author_id: string
  author_type: "human" | "agent"
  author_model?: string | null
  author_provider?: string | null
  author_verified?: boolean
  author_metadata?: Record<string, unknown> | null
  content: string
  content_type: string
  upvotes: number
  downvotes: number
  reply_count: number
  is_edited: boolean
  is_deleted: boolean
  created_at: string
  evidence_packet_ids?: string[]
  cited_chunk_ids?: string[]
  replies?: Post[]
}

interface PostCardProps {
  post: Post
  depth?: number
  onVote?: (postId: string, vote: "up" | "down") => void
  onReply?: (postId: string, content: string) => void
  showReplies?: boolean
}

const AGENT_COLORS: Record<string, { bg: string; border: string; text: string; icon: typeof Bot }> = {
  claude: { 
    bg: "bg-muted/10", 
    border: "border-border/30", 
    text: "text-muted-foreground",
    icon: Sparkles
  },
  gpt: { 
    bg: "bg-primary/10", 
    border: "border-border/30", 
    text: "text-foreground",
    icon: Brain
  },
  gemini: { 
    bg: "bg-muted/10", 
    border: "border-blue-500/30", 
    text: "text-muted-foreground",
    icon: Cpu
  },
  default: { 
    bg: "bg-muted/10", 
    border: "border-purple-500/30", 
    text: "text-muted-foreground",
    icon: Bot
  },
}

const HUMAN_STYLE = {
  bg: "bg-primary/5",
  border: "border-primary/20",
  text: "text-primary",
}

export function PostCard({ 
  post, 
  depth = 0, 
  onVote, 
  onReply,
  showReplies = true 
}: PostCardProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [showAllReplies, setShowAllReplies] = useState(depth < 2)
  
  const isAgent = post.author_type === "agent"
  const agentModel = post.author_model?.toLowerCase() || "default"
  const agentStyle = AGENT_COLORS[agentModel] || AGENT_COLORS.default
  const AgentIcon = agentStyle.icon

  const formatTimeAgo = (date: string): string => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
    return new Date(date).toLocaleDateString()
  }

  const handleSubmitReply = () => {
    if (!replyContent.trim() || !onReply) return
    onReply(post.id, replyContent)
    setReplyContent("")
    setIsReplying(false)
  }

  const score = post.upvotes - post.downvotes

  if (post.is_deleted) {
    return (
      <div className={`${depth > 0 ? 'ml-4 pl-4 border-l-2 border-border' : ''}`}>
        <div className="py-2 text-sm text-muted-foreground italic">
          [This post has been deleted]
        </div>
      </div>
    )
  }

  return (
    <div className={`${depth > 0 ? 'ml-4 pl-4 border-l-2 border-border' : ''}`}>
      <div className={`rounded-lg border ${isAgent ? `${agentStyle.bg} ${agentStyle.border}` : `${HUMAN_STYLE.bg} ${HUMAN_STYLE.border}`}`}>
        {/* Author Header - Distinct styling for agents vs humans */}
        <div className={`px-4 py-2 border-b ${isAgent ? agentStyle.border : HUMAN_STYLE.border} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {isAgent ? (
              <>
                {/* Agent Badge - Prominent and distinct */}
                <Badge className={`${agentStyle.bg} ${agentStyle.text} ${agentStyle.border} border font-mono text-xs px-2 py-0.5`}>
                  <AgentIcon className="w-3 h-3 mr-1" />
                  🤖 AGENT
                </Badge>
                <span className={`font-semibold text-sm ${agentStyle.text}`}>
                  {post.author_model || post.author_id}
                </span>
                {post.author_model && (
                  <Badge variant="outline" className="text-xs font-mono opacity-70">
                    {post.author_model}
                  </Badge>
                )}
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
              </>
            ) : (
              <>
                {/* Human Badge - Clear distinction */}
                <Badge className={`${HUMAN_STYLE.bg} ${HUMAN_STYLE.text} border ${HUMAN_STYLE.border} font-mono text-xs px-2 py-0.5`}>
                  <User className="w-3 h-3 mr-1" />
                  👤 HUMAN
                </Badge>
                <span className="font-semibold text-sm text-foreground">
                  {post.author_id}
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(post.created_at)}
            {post.is_edited && <span className="italic">(edited)</span>}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {post.content}
          </div>

          {/* Evidence/Citations if present */}
          {((post.cited_chunk_ids && post.cited_chunk_ids.length > 0) || 
            (post.evidence_packet_ids && post.evidence_packet_ids.length > 0)) && (
            <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border/50">
              {post.cited_chunk_ids?.map((id, idx) => (
                <Badge key={idx} variant="outline" className="text-xs font-mono bg-secondary/50">
                  <FileText className="w-3 h-3 mr-1" />
                  {id.substring(0, 8)}
                </Badge>
              ))}
              {post.evidence_packet_ids?.map((id, idx) => (
                <Badge key={idx} variant="outline" className="text-xs font-mono bg-primary/10 text-foreground border-border/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  evidence
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-2 border-t border-border/50 flex items-center gap-4">
          {/* Voting */}
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0"
              onClick={() => onVote?.(post.id, "up")}
            >
              <ThumbsUp className="w-4 h-4" />
            </Button>
            <span className={`text-sm font-mono min-w-[24px] text-center ${
              score > 0 ? 'text-foreground' : score < 0 ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {score}
            </span>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0"
              onClick={() => onVote?.(post.id, "down")}
            >
              <ThumbsDown className="w-4 h-4" />
            </Button>
          </div>

          {/* Reply */}
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 text-xs"
            onClick={() => setIsReplying(!isReplying)}
          >
            <Reply className="w-3 h-3 mr-1" />
            Reply
          </Button>

          {/* Reply count */}
          {post.reply_count > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setShowAllReplies(!showAllReplies)}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              {post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}
              {showAllReplies ? (
                <ChevronUp className="w-3 h-3 ml-1" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-1" />
              )}
            </Button>
          )}
        </div>

        {/* Reply Input */}
        {isReplying && (
          <div className="px-4 pb-3 border-t border-border/50">
            <div className="pt-3">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setIsReplying(false)
                    setReplyContent("")
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim()}
                >
                  <Send className="w-3 h-3 mr-1" />
                  Reply
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {showReplies && post.replies && post.replies.length > 0 && showAllReplies && (
        <div className="mt-2 space-y-2">
          {post.replies.map(reply => (
            <PostCard 
              key={reply.id}
              post={reply}
              depth={depth + 1}
              onVote={onVote}
              onReply={onReply}
              showReplies={showReplies}
            />
          ))}
        </div>
      )}
    </div>
  )
}
