"use client"

import React from "react"

import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  Zap, 
  Users, 
  FileText, 
  Clock,
  Activity,
  PauseCircle,
  CheckCircle2,
  Archive,
  Sparkles,
  Bot,
  Loader2
} from "lucide-react"
import { AgentChat } from "./agent-chat"
import { TimelineView } from "./timeline-view"
import { ConnectionGraph } from "./connection-graph"
import { ThreadList } from "./thread-list"
import { ThreadDetail } from "./thread-detail"

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Investigation {
  id: string
  title: string
  description: string
  status: string
  priority: string
  tags: string[]
  created_at: string
}

interface InvestigationDetailProps {
  investigation: Investigation
}

interface Thread {
  id: string
  investigation_id: string
  title: string
  description: string | null
  category: string
  created_by: string
  created_by_type: string
  is_pinned: boolean
  is_locked: boolean
  post_count: number
  last_activity_at: string
  created_at: string
}

export function InvestigationDetail({ investigation }: InvestigationDetailProps) {
  const [selectedThread, setSelectedThread] = React.useState<Thread | null>(null)
  
  const { data, isLoading } = useSWR(
    `/api/investigations/${investigation.id}`,
    fetcher,
    { refreshInterval: 10000 }
  )

  const fullInvestigation = data?.investigation || investigation

  const priorityColors: Record<string, string> = {
    critical: "bg-destructive/20 text-destructive border-destructive/30",
    high: "bg-chart-4/20 text-chart-4 border-chart-4/30",
    medium: "bg-accent/20 text-accent-foreground border-accent/30",
    low: "bg-muted text-muted-foreground border-border"
  }

  const statusIcons: Record<string, React.ReactNode> = {
    active: <Activity className="w-4 h-4" />,
    stalled: <PauseCircle className="w-4 h-4" />,
    resolved: <CheckCircle2 className="w-4 h-4" />,
    archived: <Archive className="w-4 h-4" />
  }

  const statusColors: Record<string, string> = {
    active: "text-primary bg-primary/10",
    stalled: "text-chart-4 bg-chart-4/10",
    resolved: "text-chart-2 bg-chart-2/10",
    archived: "text-muted-foreground bg-muted"
  }

  const documentsCount = fullInvestigation.documents?.length || 0
  const evidenceCount = fullInvestigation.evidence_packets?.length || 0

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-card/50 border-border">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={`${priorityColors[fullInvestigation.priority] || priorityColors.medium} text-xs font-mono uppercase`}>
                {fullInvestigation.priority === "critical" && <AlertTriangle className="w-3 h-3 mr-1" />}
                {fullInvestigation.priority === "high" && <Zap className="w-3 h-3 mr-1" />}
                {fullInvestigation.priority || "medium"}
              </Badge>
              <Badge className={`${statusColors[fullInvestigation.status] || statusColors.active} border-0 text-xs font-mono`}>
                {statusIcons[fullInvestigation.status] || statusIcons.active}
                <span className="ml-1">{(fullInvestigation.status || "active").toUpperCase()}</span>
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                {fullInvestigation.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
            
            <h1 className="text-xl font-bold text-foreground mb-2">
              {fullInvestigation.title}
            </h1>
            
            {fullInvestigation.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {fullInvestigation.description}
              </p>
            )}
            
            {fullInvestigation.tags && fullInvestigation.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {fullInvestigation.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs font-mono bg-secondary/50">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" className="font-mono">
              <Sparkles className="w-4 h-4 mr-1" />
              Run Agents
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded bg-secondary/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs">Documents</span>
            </div>
            <div className="text-lg font-bold font-mono">{documentsCount}</div>
          </div>
          <div className="p-3 rounded bg-secondary/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">Evidence Packets</span>
            </div>
            <div className="text-lg font-bold font-mono">{evidenceCount}</div>
          </div>
          <div className="p-3 rounded bg-secondary/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Created</span>
            </div>
            <div className="text-sm font-mono">{new Date(fullInvestigation.created_at).toLocaleDateString()}</div>
          </div>
          <div className="p-3 rounded bg-secondary/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Bot className="w-4 h-4" />
              <span className="text-xs">Status</span>
            </div>
            <div className="text-sm font-mono text-primary">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ready"}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Forum Threads - Main content area */}
      {selectedThread ? (
        <ThreadDetail 
          thread={selectedThread} 
          onBack={() => setSelectedThread(null)} 
        />
      ) : (
        <ThreadList 
          investigationId={fullInvestigation.id}
          investigationTitle={fullInvestigation.title}
          onSelectThread={setSelectedThread}
        />
      )}
      
      {/* Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TimelineView investigationId={fullInvestigation.id} />
        <ConnectionGraph investigationId={fullInvestigation.id} />
      </div>
      
      {/* Agent Chat */}
      <AgentChat investigationId={fullInvestigation.id} />
    </div>
  )
}
