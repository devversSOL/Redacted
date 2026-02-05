"use client"

import React from "react"

import { useState, useRef } from "react"
import useSWR from "swr"
import {
  HabboCard,
  HabboButton,
  HabboInput,
  HabboPill,
  HabboProgress,
} from "@/components/habbo-ui"
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

  return (
    <div className="space-y-3">
      {/* Document Upload Card */}
      <HabboCard variant="blue" className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <Upload className="w-4 h-4 text-[#ffcc00]" />
          <h3 className="font-bold text-[12px] text-[#0b2a3a]">DOCUMENT UPLOAD</h3>
        </div>
        
        <div className="space-y-2">
          <HabboInput
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileUpload}
            disabled={isUploading}
            className="text-xs"
          />
          
          {isUploading && (
            <div className="flex items-center gap-2 text-xs text-[#3b5f76]">
              <Loader2 className="w-4 h-4 animate-spin text-[#ffcc00]" />
              {uploadProgress}
            </div>
          )}
          
          <p className="text-[10px] text-[#3b5f76]">
            Upload images or PDFs. AI Vision will extract text automatically.
          </p>
        </div>
      </HabboCard>

      {/* Agent Control Card */}
      <HabboCard variant="green" className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#ffcc00]" />
            <h3 className="font-bold text-[12px] text-[#0b2a3a]">AGENT CONTROL</h3>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-white/50 rounded-lg border-2 border-black">
              <div className="text-xl font-black text-[#ffcc00]">{documents.length}</div>
              <div className="text-[10px] text-[#3b5f76] font-bold">Documents</div>
            </div>
            <div className="p-2 bg-white/50 rounded-lg border-2 border-black">
              <div className="text-xl font-black text-[#22c55e]">{entities.length}</div>
              <div className="text-[10px] text-[#3b5f76] font-bold">Entities</div>
            </div>
          </div>
          
          <HabboButton 
            variant="go"
            onClick={runBackgroundAgents} 
            disabled={isRunningAgents || pendingDocs === 0}
            className="w-full"
          >
            {isRunningAgents ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running Agents...</>
            ) : (
              <><Play className="w-4 h-4 mr-2" /> Run Analysis ({pendingDocs} pending)</>
            )}
          </HabboButton>
          
          <p className="text-[10px] text-[#3b5f76] text-center">
            Deploys Claude, GPT, and Gemini to analyze documents
          </p>
        </div>
      </HabboCard>

      {/* Agent Activity Card */}
      <HabboCard className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-[#ffcc00]" />
          <h3 className="font-bold text-[12px] text-[#0b2a3a]">AGENT ACTIVITY</h3>
        </div>
        
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {activity.length === 0 ? (
            <p className="text-[10px] text-[#3b5f76] text-center py-4">
              No agent activity yet
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
                className="flex items-start gap-2 p-2 rounded-lg bg-white border-2 border-black text-xs shadow-[inset_0_0_0_2px_#6fa6c3]"
              >
                <div className="text-[#ffcc00] mt-0.5">
                  {getAgentIcon(item.agent_id)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#0b2a3a] truncate">
                      {item.agent_id}
                    </span>
                    <HabboPill variant="info" className="text-[8px] px-1 py-0">
                      {item.action_type}
                    </HabboPill>
                  </div>
                  <p className="text-[#3b5f76] truncate mt-0.5 text-[10px]">
                    {item.description}
                  </p>
                  <span className="text-[#6fa6c3] font-mono text-[9px]">
                    {new Date(item.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </HabboCard>

      {/* Documents Card */}
      <HabboCard className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-[#ffcc00]" />
          <h3 className="font-bold text-[12px] text-[#0b2a3a]">DOCUMENTS</h3>
        </div>
        
        <div className="space-y-1.5 max-h-36 overflow-y-auto">
          {documents.length === 0 ? (
            <p className="text-[10px] text-[#3b5f76] text-center py-4">
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
                className="flex items-center justify-between p-2 rounded-lg bg-white border-2 border-black text-xs shadow-[inset_0_0_0_2px_#6fa6c3]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {doc.status === "analyzed" && <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e] flex-shrink-0" />}
                  {doc.status === "processed" && <Clock className="w-3.5 h-3.5 text-[#f59e0b] flex-shrink-0" />}
                  {doc.status === "pending" && <Loader2 className="w-3.5 h-3.5 text-[#6fa6c3] animate-spin flex-shrink-0" />}
                  <span className="font-mono truncate text-[#0b2a3a]">{doc.filename}</span>
                </div>
                <HabboPill 
                  variant={
                    doc.status === "analyzed" ? "success" :
                    doc.status === "processed" ? "warning" :
                    "info"
                  }
                  className="text-[8px] ml-2 flex-shrink-0"
                >
                  {doc.status}
                </HabboPill>
              </div>
            ))
          )}
        </div>
      </HabboCard>

      {/* Tracked Entities Card */}
      <HabboCard className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-4 h-4 text-[#ffcc00]" />
          <h3 className="font-bold text-[12px] text-[#0b2a3a]">TRACKED ENTITIES</h3>
        </div>
        
        <div className="space-y-1.5 max-h-36 overflow-y-auto">
          {entities.length === 0 ? (
            <p className="text-[10px] text-[#3b5f76] text-center py-4">
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
                className="flex items-center justify-between p-2 rounded-lg bg-white border-2 border-black text-xs shadow-[inset_0_0_0_2px_#6fa6c3]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <HabboPill 
                    variant={
                      entity.entity_type === "person" ? "warning" :
                      entity.entity_type === "organization" ? "info" :
                      entity.entity_type === "location" ? "success" :
                      "info"
                    }
                    className="text-[8px] px-1.5"
                  >
                    {entity.entity_type.slice(0, 3).toUpperCase()}
                  </HabboPill>
                  <span className={`font-mono truncate ${entity.is_redacted ? "text-[#dc2626] font-bold" : "text-[#0b2a3a]"}`}>
                    {entity.name}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </HabboCard>
    </div>
  )
}
