"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowUp, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Quote,
  Link2,
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Cpu,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  FileText,
  Hash
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Citation {
  text: string
  document_id?: string
  page?: number
  start_offset?: number
  end_offset?: number
  canonical?: string
  excerpt?: string
}

interface EvidencePacket {
  id: string
  investigation_id: string | null
  claim: string
  claim_type: string
  confidence: number
  citations: Citation[]
  uncertainty_notes: string[]
  validation_status?: 'pending' | 'valid' | 'flagged' | 'rejected'
  validation_notes?: string[]
  supporting_chunk_ids?: string[]
  agent_id: string | null
  agent_model: string | null
  votes: number
  created_at: string
}

interface Investigation {
  id: string
  title: string
}

interface EvidenceFeedProps {
  investigation?: Investigation | null
}

export function EvidenceFeed({ investigation }: EvidenceFeedProps) {
  const [newStatement, setNewStatement] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<{ evidence: EvidencePacket[] }>(
    investigation 
      ? `/api/evidence?investigationId=${investigation.id}` 
      : "/api/evidence",
    fetcher,
    { refreshInterval: 5000 }
  )

  const packets = data?.evidence || []

  const claimTypeConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
    observed: { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
    corroborated: { icon: Link2, color: "text-chart-2", bg: "bg-chart-2/10" },
    unknown: { icon: HelpCircle, color: "text-chart-4", bg: "bg-chart-4/10" }
  }

  const validationStatusConfig: Record<string, { icon: typeof ShieldCheck; color: string; label: string }> = {
    valid: { icon: ShieldCheck, color: "text-foreground", label: "VALIDATED" },
    flagged: { icon: ShieldAlert, color: "text-muted-foreground", label: "FLAGGED" },
    rejected: { icon: ShieldX, color: "text-foreground", label: "REJECTED" },
    pending: { icon: HelpCircle, color: "text-muted-foreground", label: "PENDING" }
  }

  const formatCitation = (citation: Citation): string => {
    if (citation.canonical) return citation.canonical
    if (citation.document_id && citation.page !== undefined) {
      const start = citation.start_offset || 0
      const end = citation.end_offset || start + 100
      return `${citation.document_id.substring(0, 8)}.${citation.page}.${start}-${end}`
    }
    return citation.document_id?.substring(0, 8) || "N/A"
  }

  const getAgentIcon = (agentId: string | null) => {
    if (!agentId) return <User className="w-4 h-4" />
    if (agentId.includes("claude")) return <Sparkles className="w-4 h-4" />
    if (agentId.includes("gpt")) return <Bot className="w-4 h-4" />
    if (agentId.includes("gemini")) return <Cpu className="w-4 h-4" />
    return <Cpu className="w-4 h-4" />
  }

  const handleUpvote = async (packetId: string) => {
    await fetch(`/api/evidence/${packetId}/vote`, { method: "POST" })
    mutate()
  }

  const handleSubmit = async () => {
    if (!newStatement.trim()) return
    
    setIsSubmitting(true)
    try {
      await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investigationId: investigation?.id,
          claim: newStatement,
          claimType: "unknown",
          confidence: 0.3,
          citations: [],
          uncertaintyNotes: ["Pending verification", "No citations attached"]
        })
      })
      mutate()
      setNewStatement("")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            {investigation ? "EVIDENCE PACKETS" : "GLOBAL FEED"}
          </h2>
          <Badge variant="outline" className="ml-2 font-mono">
            {packets.length} ENTRIES
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Live updates
          </span>
        </div>
      </div>

      <Card className="p-4 bg-secondary/30 border-dashed">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <Textarea
              placeholder="Submit an evidence statement... (Claims require citations to be verified)"
              value={newStatement}
              onChange={(e) => setNewStatement(e.target.value)}
              className="min-h-[80px] bg-background/50 border-border resize-none font-mono text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                Submissions will be marked as UNKNOWN until citations are attached and verified
              </span>
              <Button 
                size="sm" 
                onClick={handleSubmit}
                disabled={!newStatement.trim() || isSubmitting}
                className="font-mono"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processing...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1" />
                    SUBMIT
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : packets.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-mono">No evidence packets yet.</p>
          <p className="text-sm mt-1">Upload documents and let agents analyze them.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {packets.map((packet) => {
            const config = claimTypeConfig[packet.claim_type] || claimTypeConfig.unknown
            const Icon = config.icon
            
            return (
              <Card 
                key={packet.id}
                className="p-4 bg-card/50 border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex gap-3">
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleUpvote(packet.id)}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-mono font-semibold">{packet.votes}</span>
                    {packet.confidence > 0.8 && (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={`${config.bg} ${config.color} border-0 text-xs font-mono`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {packet.claim_type.toUpperCase()}
                      </Badge>
                      {(() => {
                        const vConfig = validationStatusConfig[packet.validation_status || 'pending']
                        const VIcon = vConfig.icon
                        return (
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-mono ${vConfig.color} border-current/30`}
                          >
                            <VIcon className="w-3 h-3 mr-1" />
                            {vConfig.label}
                          </Badge>
                        )
                      })()}
                      <span className="text-xs text-muted-foreground font-mono">
                        {packet.id.substring(0, 8).toUpperCase()}
                      </span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {Math.round(packet.confidence * 100)}% conf
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-foreground mb-3 font-mono leading-relaxed">
                      {packet.claim}
                    </p>
                    
                    {packet.citations && packet.citations.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {packet.citations.map((citation, idx) => (
                          <div 
                            key={idx}
                            className="flex items-start gap-2 p-2 bg-secondary/50 rounded border border-border/50"
                          >
                            <Quote className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="text-xs flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-primary font-mono font-semibold">
                                  [{formatCitation(citation)}]
                                </span>
                                {citation.page && (
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    Page {citation.page}
                                  </span>
                                )}
                                {citation.start_offset !== undefined && citation.end_offset !== undefined && (
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Hash className="w-3 h-3" />
                                    {citation.start_offset}-{citation.end_offset}
                                  </span>
                                )}
                              </div>
                              <p className="text-foreground/80 mt-1 italic">
                                {'"'}{citation.excerpt || citation.text}{'"'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {packet.uncertainty_notes && packet.uncertainty_notes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {packet.uncertainty_notes.map((note, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="text-xs bg-chart-4/5 text-chart-4 border-chart-4/20"
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {note}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-accent">
                          {getAgentIcon(packet.agent_id)}
                          {packet.agent_id || "human-contributor"}
                        </span>
                        {packet.agent_model && (
                          <span className="font-mono opacity-70">
                            via {packet.agent_model.split("/").pop()}
                          </span>
                        )}
                      </div>
                      <span className="font-mono">
                        {new Date(packet.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
