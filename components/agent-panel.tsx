"use client"

import React from "react"

import { useState, useRef } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { 
  Bot, 
  Sparkles, 
  User, 
  Cpu, 
  FileText, 
  Hash,
  Activity,
  CheckCircle2,
  Clock,
  Loader2,
  Upload,
  Play,
  Zap
} from "lucide-react"
import { getFirstAvailableHeaders } from "@/lib/byok"

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface AgentPanelProps {
  investigationId?: string
}

export function AgentPanel({ investigationId }: AgentPanelProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isRunningAgents, setIsRunningAgents] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: activityData, mutate: mutateActivity } = useSWR(
    investigationId 
      ? `/api/activity?investigationId=${investigationId}&limit=20` 
      : "/api/activity?limit=20",
    fetcher,
    { refreshInterval: 3000 }
  )

  const { data: entitiesData } = useSWR("/api/entities?limit=10", fetcher, { refreshInterval: 10000 })
  const { data: docsData, mutate: mutateDocs } = useSWR(
    investigationId ? `/api/documents?investigationId=${investigationId}` : "/api/documents",
    fetcher,
    { refreshInterval: 5000 }
  )

  const activity = activityData?.activity || []
  const entities = entitiesData?.entities || []
  const documents = docsData?.documents || []

  const agentTypeIcons: Record<string, React.ReactNode> = {
    claude: <Sparkles className="w-4 h-4" />,
    gpt: <Bot className="w-4 h-4" />,
    gemini: <Cpu className="w-4 h-4" />,
    human: <User className="w-4 h-4" />,
    ocr: <FileText className="w-4 h-4" />
  }

  const getAgentIcon = (agentId: string) => {
    if (agentId.includes("claude")) return agentTypeIcons.claude
    if (agentId.includes("gpt")) return agentTypeIcons.gpt
    if (agentId.includes("gemini")) return agentTypeIcons.gemini
    if (agentId.includes("ocr")) return agentTypeIcons.ocr
    return agentTypeIcons.human
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setIsUploading(true)
    setUploadProgress(`Processing 0/${files.length} files...`)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadProgress(`Processing ${i + 1}/${files.length}: ${file.name}`)
      
      const formData = new FormData()
      formData.append("file", file)
      if (investigationId) {
        formData.append("investigationId", investigationId)
      }

      try {
        const headers = getFirstAvailableHeaders()
        await fetch("/api/ocr", {
          method: "POST",
          headers,
          body: formData,
        })
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error)
      }
    }

    setIsUploading(false)
    setUploadProgress("")
    mutateDocs()
    mutateActivity()
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const runBackgroundAgents = async () => {
    setIsRunningAgents(true)
    try {
      const byokHeaders = getFirstAvailableHeaders()
      await fetch("/api/agents/background", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...byokHeaders,
        },
        body: JSON.stringify({
          investigationId,
          agentTypes: ["claude", "gpt", "gemini"]
        })
      })
      mutateActivity()
    } finally {
      setIsRunningAgents(false)
    }
  }

  const pendingDocs = documents.filter((d: { status: string }) => d.status === "processed").length
  const analyzedDocs = documents.filter((d: { status: string }) => d.status === "analyzed").length

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-card/50 border-2 border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.1)_inset]">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-primary" />
          <h3 className="font-semibold tracking-tight">DOCUMENT UPLOAD</h3>
        </div>
        
        <div className="space-y-3">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileUpload}
            disabled={isUploading}
            className="font-mono text-sm"
          />
          
          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploadProgress}
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Upload images or PDFs. AI Vision will extract text automatically.
          </p>
        </div>
      </Card>

      <Card className="p-4 bg-card/50 border-2 border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.1)_inset]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="font-semibold tracking-tight">LOBSTER CONTROL</h3>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-2 bg-secondary/30 rounded">
              <div className="text-xl font-bold font-mono text-primary">{documents.length}</div>
              <div className="text-xs text-muted-foreground">Documents</div>
            </div>
            <div className="p-2 bg-secondary/30 rounded">
              <div className="text-xl font-bold font-mono text-chart-2">{entities.length}</div>
              <div className="text-xs text-muted-foreground">Entities</div>
            </div>
          </div>
          
          <Button 
            onClick={runBackgroundAgents} 
            disabled={isRunningAgents || pendingDocs === 0}
            className="w-full font-mono"
          >
            {isRunningAgents ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deploying Lobsters...</>
            ) : (
              <><Play className="w-4 h-4 mr-2" /> Deploy Lobsters ({pendingDocs} pending)</>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Deploys Maine, Spiny, and Rock lobsters to analyze documents
          </p>
        </div>
      </Card>

      <Card className="p-4 bg-card/50 border-2 border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.1)_inset]">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-semibold tracking-tight">LOBSTER ACTIVITY</h3>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activity.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No lobster activity yet
            </p>
          ) : (
            activity.map((item: {
              id: string
              agent_id: string
              action_type: string
              description: string
              created_at: string
            }) => (
              <div 
                key={item.id}
                className="flex items-start gap-2 p-2 rounded bg-secondary/30 text-xs"
              >
                <div className="text-accent mt-0.5">
                  {getAgentIcon(item.agent_id)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-foreground truncate">
                      {item.agent_id}
                    </span>
                    <Badge variant="outline" className="text-xs px-1">
                      {item.action_type}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground truncate mt-0.5">
                    {item.description}
                  </p>
                  <span className="text-muted-foreground/70 font-mono">
                    {new Date(item.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-4 bg-card/50 border-2 border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.1)_inset]">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold tracking-tight">DOCUMENTS</h3>
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {documents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No documents uploaded yet
            </p>
          ) : (
            documents.map((doc: {
              id: string
              filename: string
              status: string
              created_at: string
            }) => (
              <div 
                key={doc.id}
                className="flex items-center justify-between p-2 rounded bg-secondary/30 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {doc.status === "analyzed" && <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  {doc.status === "processed" && <Clock className="w-3.5 h-3.5 text-chart-4 flex-shrink-0" />}
                  {doc.status === "pending" && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin flex-shrink-0" />}
                  <span className="font-mono truncate">{doc.filename}</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ml-2 flex-shrink-0 ${
                    doc.status === "analyzed" ? "text-primary border-primary/30" :
                    doc.status === "processed" ? "text-chart-4 border-chart-4/30" :
                    "text-muted-foreground"
                  }`}
                >
                  {doc.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-4 bg-card/50 border-2 border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.1)_inset]">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-5 h-5 text-primary" />
          <h3 className="font-semibold tracking-tight">TRACKED ENTITIES</h3>
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {entities.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No entities extracted yet
            </p>
          ) : (
            entities.map((entity: {
              id: string
              name: string
              entity_type: string
              is_redacted: boolean
            }) => (
              <div 
                key={entity.id}
                className="flex items-center justify-between p-2 rounded bg-secondary/30 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-1.5 ${
                      entity.entity_type === "person" ? "text-chart-4 border-chart-4/30" :
                      entity.entity_type === "organization" ? "text-accent-foreground border-accent/30" :
                      entity.entity_type === "location" ? "text-chart-2 border-chart-2/30" :
                      "text-muted-foreground"
                    }`}
                  >
                    {entity.entity_type.slice(0, 3).toUpperCase()}
                  </Badge>
                  <span className={`font-mono truncate ${entity.is_redacted ? "text-destructive" : ""}`}>
                    {entity.name}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
