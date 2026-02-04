"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  Zap,
  FileText,
  Clock,
  Activity,
  MessageSquare,
  Upload,
  Folder,
  Quote,
  Bot,
  User,
  Send,
  Loader2,
  Image,
  File,
  ExternalLink,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react"
import { ThreadList } from "./thread-list"
import { ThreadDetail } from "./thread-detail"
import { AgentChat } from "./agent-chat"

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

interface Document {
  id: string
  filename: string
  ocr_text?: string
  status: string
  created_at: string
  metadata?: Record<string, unknown>
}

interface EvidencePacket {
  id: string
  claim: string
  claim_type: string
  confidence: number
  citations: Array<{ text: string; document_id?: string }>
  agent_id: string
  created_at: string
}

interface InvestigationWorkspaceProps {
  investigation: Investigation
}

export function InvestigationWorkspace({ investigation }: InvestigationWorkspaceProps) {
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [activeTab, setActiveTab] = useState<"discuss" | "evidence" | "chat">("discuss")
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const { data: docsData, mutate: mutateDocs } = useSWR<{ documents: Document[] }>(
    `/api/documents?investigationId=${investigation.id}`,
    fetcher
  )

  const { data: evidenceData } = useSWR<{ evidence: EvidencePacket[] }>(
    `/api/evidence?investigationId=${investigation.id}`,
    fetcher
  )

  const documents = docsData?.documents || []
  const evidence = evidenceData?.evidence || []

  const priorityColors: Record<string, string> = {
    critical: "bg-destructive/20 text-destructive",
    high: "bg-chart-4/20 text-chart-4",
    medium: "bg-accent/20 text-accent-foreground",
    low: "bg-muted text-muted-foreground",
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("investigationId", investigation.id)

        await fetch("/api/ocr", {
          method: "POST",
          body: formData,
        })
      }
      mutateDocs()
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Investigation Header - Compact */}
      <Card className="p-4 mb-4 bg-card/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Badge className={`${priorityColors[investigation.priority] || priorityColors.medium} text-xs font-mono shrink-0`}>
              {investigation.priority === "critical" && <AlertTriangle className="w-3 h-3 mr-1" />}
              {investigation.priority === "high" && <Zap className="w-3 h-3 mr-1" />}
              {investigation.priority?.toUpperCase()}
            </Badge>
            <h1 className="text-lg font-bold truncate">{investigation.title}</h1>
            <span className="text-xs text-muted-foreground font-mono shrink-0">
              {investigation.id.substring(0, 8).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            {investigation.created_by_type === "agent" ? (
              <Bot className="w-3.5 h-3.5 text-primary" />
            ) : (
              <User className="w-3.5 h-3.5" />
            )}
            <span>{investigation.created_by || "anonymous"}</span>
            <Badge variant="outline" className={`text-[10px] ${investigation.created_by_type === "agent" ? "bg-primary/10 text-primary" : ""}`}>
              {investigation.created_by_type === "agent" ? "AGENT" : "HUMAN"}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Main Workspace - Three Column Layout */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left Panel - Documents & Evidence */}
        <div className="col-span-3 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0 bg-card/50">
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  Evidence Locker
                </h3>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <Button size="sm" variant="ghost" className="h-7 px-2" asChild disabled={uploading}>
                    <span>
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    </span>
                  </Button>
                </label>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-7 text-xs"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {/* Documents Section */}
                <div className="mb-3">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                    Documents ({documents.length})
                  </div>
                  {documents.length === 0 ? (
                    <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>No documents yet</p>
                      <p className="text-[10px]">Upload files above</p>
                    </div>
                  ) : (
                    documents.map((doc) => (
                      <button
                        key={doc.id}
                        className="w-full text-left p-2 rounded hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="flex items-start gap-2">
                          {doc.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <Image className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          ) : (
                            <File className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium truncate">{doc.filename}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Citations Section */}
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                    Citations ({evidence.length})
                  </div>
                  {evidence.length === 0 ? (
                    <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                      <Quote className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>No citations yet</p>
                    </div>
                  ) : (
                    evidence.slice(0, 10).map((ev) => (
                      <div
                        key={ev.id}
                        className="p-2 rounded hover:bg-secondary/50 transition-colors"
                      >
                        <div className="text-xs line-clamp-2 mb-1">{ev.claim}</div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Badge variant="outline" className="text-[9px] h-4 px-1">
                            {ev.claim_type}
                          </Badge>
                          <span>{Math.round(ev.confidence * 100)}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Center Panel - Discussion & Threads */}
        <div className="col-span-6 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0 bg-card/50">
            <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col min-h-0">
              <div className="border-b border-border px-2">
                <TabsList className="h-10 bg-transparent">
                  <TabsTrigger value="discuss" className="text-xs gap-1.5 data-[state=active]:bg-secondary">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Discussion
                  </TabsTrigger>
                  <TabsTrigger value="evidence" className="text-xs gap-1.5 data-[state=active]:bg-secondary">
                    <Quote className="w-3.5 h-3.5" />
                    Evidence Feed
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="text-xs gap-1.5 data-[state=active]:bg-secondary">
                    <Bot className="w-3.5 h-3.5" />
                    Agent Chat
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="discuss" className="flex-1 m-0 min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    {selectedThread ? (
                      <ThreadDetail
                        thread={selectedThread}
                        onBack={() => setSelectedThread(null)}
                      />
                    ) : (
                      <ThreadList
                        investigationId={investigation.id}
                        investigationTitle={investigation.title}
                        onSelectThread={setSelectedThread}
                      />
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="evidence" className="flex-1 m-0 min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    {evidence.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Quote className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="font-medium">No evidence submitted yet</p>
                        <p className="text-sm">Upload documents and run agents to extract evidence</p>
                      </div>
                    ) : (
                      evidence.map((ev) => (
                        <Card key={ev.id} className="p-4 bg-secondary/20">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <p className="text-sm">{ev.claim}</p>
                            <Badge variant="outline" className="shrink-0 text-xs">
                              {ev.claim_type}
                            </Badge>
                          </div>
                          {ev.citations?.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <div className="text-[10px] text-muted-foreground uppercase mb-2">Citations</div>
                              {ev.citations.map((cite, i) => (
                                <blockquote key={i} className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-2 italic">
                                  "{cite.text?.substring(0, 150)}..."
                                </blockquote>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
                            <Bot className="w-3 h-3" />
                            <span>{ev.agent_id}</span>
                            <span>•</span>
                            <span>{Math.round(ev.confidence * 100)}% confidence</span>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="chat" className="flex-1 m-0 min-h-0 overflow-hidden">
                <div className="h-full">
                  <AgentChat investigationId={investigation.id} />
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Panel - Quick Actions & Stats */}
        <div className="col-span-3 flex flex-col gap-4 min-h-0">
          {/* Stats */}
          <Card className="p-4 bg-card/50">
            <h3 className="text-sm font-semibold mb-3">Investigation Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded bg-secondary/30 text-center">
                <div className="text-lg font-bold font-mono">{documents.length}</div>
                <div className="text-[10px] text-muted-foreground">Documents</div>
              </div>
              <div className="p-2 rounded bg-secondary/30 text-center">
                <div className="text-lg font-bold font-mono">{evidence.length}</div>
                <div className="text-[10px] text-muted-foreground">Evidence</div>
              </div>
            </div>
          </Card>

          {/* Quick Upload */}
          <Card className="p-4 bg-card/50">
            <h3 className="text-sm font-semibold mb-3">Quick Upload</h3>
            <label className="cursor-pointer block">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
                {uploading ? (
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                ) : (
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                )}
                <p className="text-xs text-muted-foreground">
                  {uploading ? "Processing..." : "Drop files or click to upload"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Images, PDFs, Documents
                </p>
              </div>
            </label>
          </Card>

          {/* Recent Activity */}
          <Card className="flex-1 p-4 bg-card/50 min-h-0 flex flex-col">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Activity
            </h3>
            <ScrollArea className="flex-1">
              <div className="space-y-2 text-xs">
                {evidence.slice(0, 5).map((ev) => (
                  <div key={ev.id} className="flex items-start gap-2 p-2 rounded bg-secondary/20">
                    <Bot className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="truncate">{ev.claim}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(ev.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {evidence.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No activity yet</p>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  )
}
