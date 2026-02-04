"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getFirstAvailableHeaders } from "@/lib/byok"
import {
  FileText,
  Upload,
  Search,
  Link2,
  Clock,
  ChevronRight,
  Loader2,
  Bot,
  Image,
  File,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface EvidenceSidebarProps {
  investigationId?: string
}

export function EvidenceSidebar({ investigationId }: EvidenceSidebarProps) {
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"docs" | "evidence" | "recent">("recent")

  const { data: docsData, mutate: mutateDocs } = useSWR(
    investigationId ? `/api/documents?investigationId=${investigationId}` : "/api/documents",
    fetcher
  )
  const { data: evidenceData } = useSWR(
    investigationId ? `/api/evidence?investigationId=${investigationId}` : "/api/evidence",
    fetcher
  )

  const documents = docsData?.documents || []
  const evidence = evidenceData?.evidence || []

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        if (investigationId) {
          formData.append("investigationId", investigationId)
        }

        const headers = getFirstAvailableHeaders()
        const res = await fetch("/api/ocr", {
          method: "POST",
          headers,
          body: formData,
        })

        if (!res.ok) {
          const error = await res.json()
          console.error("Upload failed:", error)
          alert(`Upload failed: ${error.error || "Unknown error"}`)
        }
      }
      mutateDocs()
    } catch (err) {
      console.error("Upload error:", err)
    } finally {
      setUploading(false)
    }
  }

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase()
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) {
      return <Image className="w-4 h-4 text-blue-400" />
    }
    if (ext === "pdf") {
      return <FileText className="w-4 h-4 text-red-400" />
    }
    return <File className="w-4 h-4 text-muted-foreground" />
  }

  return (
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Evidence Locker
          </h2>
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 px-2 text-xs cursor-pointer hover:bg-primary/10" 
              asChild 
              disabled={uploading}
            >
              <span>
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    Upload
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search evidence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {[
            { id: "recent", label: "Recent" },
            { id: "docs", label: `Docs (${documents.length})` },
            { id: "evidence", label: `Evidence (${evidence.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-2 py-1 text-[10px] rounded transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {activeTab === "recent" && (
            <>
              {/* Combined recent items */}
              {[...documents, ...evidence]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 15)
                .map((item: any) => (
                  <button
                    key={item.id}
                    className="w-full text-left p-2 rounded hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      {item.filename ? (
                        getFileIcon(item.filename)
                      ) : (
                        <Link2 className="w-4 h-4 text-cyan-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {item.filename || item.claim?.substring(0, 40) + "..."}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(item.created_at)}
                          {item.claim_type && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3">
                              {item.claim_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}

              {documents.length === 0 && evidence.length === 0 && (
                <div className="p-4 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No evidence yet</p>
                  <p className="text-[10px] text-muted-foreground">Upload documents above</p>
                </div>
              )}
            </>
          )}

          {activeTab === "docs" && (
            <>
              {documents.map((doc: any) => (
                <button
                  key={doc.id}
                  className="w-full text-left p-2 rounded hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    {getFileIcon(doc.filename)}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{doc.filename}</div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        {doc.ocr_status === "completed" ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-yellow-500" />
                        )}
                        <span>{doc.ocr_status || "pending"}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {documents.length === 0 && (
                <div className="p-4 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No documents uploaded</p>
                </div>
              )}
            </>
          )}

          {activeTab === "evidence" && (
            <>
              {evidence.map((ev: any) => (
                <button
                  key={ev.id}
                  className="w-full text-left p-2 rounded hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <Bot className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs line-clamp-2">{ev.claim}</div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3">
                          {ev.claim_type}
                        </Badge>
                        <span>{Math.round((ev.confidence || 0) * 100)}%</span>
                        <span>•</span>
                        <span>{formatTimeAgo(ev.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {evidence.length === 0 && (
                <div className="p-4 text-center">
                  <Bot className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No evidence extracted</p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="p-2 border-t border-border">
        <label className="cursor-pointer block">
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <div className="border border-dashed border-border rounded p-3 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
            {uploading ? (
              <Loader2 className="w-5 h-5 mx-auto animate-spin text-primary" />
            ) : (
              <Plus className="w-5 h-5 mx-auto text-muted-foreground" />
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              {uploading ? "Processing..." : "Drop files here"}
            </p>
          </div>
        </label>
      </div>
    </Card>
  )
}
