"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  MessageSquare,
  Pin,
  Lock,
  Clock,
  User,
  Bot,
  Plus,
  Filter,
  TrendingUp,
  FileText,
  Users,
  Network,
  Calendar,
  HelpCircle
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Thread {
  id: string
  investigation_id: string
  title: string
  description: string | null
  thumbnail_url?: string | null
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

interface ThreadListProps {
  investigationId: string
  investigationTitle: string
  onSelectThread: (thread: Thread) => void
}

const CATEGORIES = [
  { value: "general", label: "General Discussion", icon: MessageSquare },
  { value: "analysis", label: "Analysis", icon: TrendingUp },
  { value: "documents", label: "Documents", icon: FileText },
  { value: "entities", label: "Entities", icon: Users },
  { value: "connections", label: "Connections", icon: Network },
  { value: "timeline", label: "Timeline", icon: Calendar },
]

export function ThreadList({ investigationId, investigationTitle, onSelectThread }: ThreadListProps) {
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [newThreadOpen, setNewThreadOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newThumbnail, setNewThumbnail] = useState("")
  const [newCategory, setNewCategory] = useState("general")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const apiUrl = filterCategory 
    ? `/api/threads?investigationId=${investigationId}&category=${filterCategory}`
    : `/api/threads?investigationId=${investigationId}`

  const { data, error, isLoading, mutate } = useSWR<{ threads: Thread[] }>(
    apiUrl,
    fetcher,
    { refreshInterval: 10000 }
  )

  const threads = data?.threads || []

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category)
    return cat?.icon || HelpCircle
  }

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      general: "bg-gray-500/10 text-gray-500 border-gray-500/30",
      analysis: "bg-muted/10 text-muted-foreground border-blue-500/30",
      documents: "bg-primary/10 text-foreground border-border/30",
      entities: "bg-muted/10 text-muted-foreground border-purple-500/30",
      connections: "bg-muted/10 text-muted-foreground border-border/30",
      timeline: "bg-cyan-500/10 text-muted-foreground border-cyan-500/30",
    }
    return colors[category] || colors.general
  }

  const handleCreateThread = async () => {
    if (!newTitle.trim()) return
    
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investigationId,
          title: newTitle,
          description: newDescription || null,
          thumbnailUrl: newThumbnail || null,
          category: newCategory,
          createdBy: "user", // TODO: Get actual user
          createdByType: "human",
        }),
      })
      
      if (res.ok) {
        setNewTitle("")
        setNewDescription("")
        setNewThumbnail("")
        setNewCategory("general")
        setNewThreadOpen(false)
        mutate()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTimeAgo = (date: string): string => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return new Date(date).toLocaleDateString()
  }

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {investigationTitle}
          </h2>
          <p className="text-xs text-muted-foreground font-mono">
            {threads.length} threads
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <Select 
            value={filterCategory || "all"} 
            onValueChange={(v) => setFilterCategory(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* New Thread Button */}
          <Dialog open={newThreadOpen} onOpenChange={setNewThreadOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8">
                <Plus className="w-4 h-4 mr-1" />
                New Thread
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Thread</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Input
                    placeholder="Thread title..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Description (optional)..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    placeholder="Thumbnail URL (optional, recommended)"
                    value={newThumbnail}
                    onChange={(e) => setNewThumbnail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended for visibility in the thread list.
                  </p>
                </div>
                <div>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => {
                        const Icon = cat.icon
                        return (
                          <SelectItem key={cat.value} value={cat.value}>
                            <span className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {cat.label}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleCreateThread} 
                  disabled={!newTitle.trim() || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Creating..." : "Create Thread"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Thread List */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-8 text-sm">
          Loading threads...
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No threads yet</p>
          <p className="text-xs">Start a discussion about this investigation</p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map(thread => {
            const CategoryIcon = getCategoryIcon(thread.category)
            return (
              <div
                key={thread.id}
                onClick={() => onSelectThread(thread)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-secondary/50 ${
                  thread.is_pinned ? 'border-primary/30 bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-md border border-border bg-muted/30 overflow-hidden flex items-center justify-center shrink-0">
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {thread.is_pinned && (
                        <Pin className="w-3 h-3 text-primary" />
                      )}
                      {thread.is_locked && (
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      )}
                      <h3 className="font-semibold text-sm truncate">
                        {thread.title}
                      </h3>
                    </div>
                    
                    {thread.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {thread.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-mono ${getCategoryColor(thread.category)}`}
                      >
                        <CategoryIcon className="w-3 h-3 mr-1" />
                        {thread.category}
                      </Badge>

                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          {thread.created_by_type === "agent" ? (
                            <Bot className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          {thread.created_by}
                        </span>
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
                      </div>
                      
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(thread.last_activity_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-mono text-sm">{thread.post_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
