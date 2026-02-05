"use client"

import React, { useState } from "react"
import useSWR from "swr"
import {
  HabboCard,
  HabboButton,
  HabboInput,
  HabboPill,
  HabboTabBar,
  HabboTab,
} from "@/components/habbo-ui"
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
      return <Image className="w-4 h-4 text-[#6fa6c3]" />
    }
    if (ext === "pdf") {
      return <FileText className="w-4 h-4 text-[#dc2626]" />
    }
    return <File className="w-4 h-4 text-[#3b5f76]" />
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="pb-3 border-b-2 border-[#3b5f76]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm flex items-center gap-2 text-[#0b2a3a]">
            <FileText className="w-4 h-4 text-[#ffcc00]" />
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
            <HabboButton 
              variant="primary" 
              size="sm"
              disabled={uploading}
              asChild
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
            </HabboButton>
          </label>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3b5f76]" />
          <HabboInput
            placeholder="Search evidence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs"
          />
        </div>

        {/* Tabs */}
        <HabboTabBar className="mt-3">
          <HabboTab active={activeTab === "recent"} onClick={() => setActiveTab("recent")}>
            Recent
          </HabboTab>
          <HabboTab active={activeTab === "docs"} onClick={() => setActiveTab("docs")}>
            Docs ({documents.length})
          </HabboTab>
          <HabboTab active={activeTab === "evidence"} onClick={() => setActiveTab("evidence")}>
            Evidence ({evidence.length})
          </HabboTab>
        </HabboTabBar>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 -mx-3 px-3">
        <div className="py-2 space-y-1.5">
          {activeTab === "recent" && (
            <>
              {[...documents, ...evidence]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 15)
                .map((item: any) => (
                  <button
                    key={item.id}
                    className="w-full text-left p-2 rounded-lg border-2 border-black bg-white hover:bg-[#eef6fb] transition-colors group shadow-[inset_0_0_0_2px_#6fa6c3]"
                  >
                    <div className="flex items-start gap-2">
                      {item.filename ? (
                        getFileIcon(item.filename)
                      ) : (
                        <Link2 className="w-4 h-4 text-[#ffcc00]" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate text-[#0b2a3a]">
                          {item.filename || item.claim?.substring(0, 40) + "..."}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#3b5f76] mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(item.created_at)}
                          {item.claim_type && (
                            <HabboPill variant="info" className="text-[8px] px-1 py-0">
                              {item.claim_type}
                            </HabboPill>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-[#6fa6c3] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}

              {documents.length === 0 && evidence.length === 0 && (
                <div className="p-4 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-[#6fa6c3]" />
                  <p className="text-xs text-[#3b5f76] font-medium">No evidence yet</p>
                  <p className="text-[10px] text-[#6fa6c3]">Upload documents above</p>
                </div>
              )}
            </>
          )}

          {activeTab === "docs" && (
            <>
              {documents.map((doc: any) => (
                <button
                  key={doc.id}
                  className="w-full text-left p-2 rounded-lg border-2 border-black bg-white hover:bg-[#eef6fb] transition-colors group shadow-[inset_0_0_0_2px_#6fa6c3]"
                >
                  <div className="flex items-start gap-2">
                    {getFileIcon(doc.filename)}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate text-[#0b2a3a]">{doc.filename}</div>
                      <div className="flex items-center gap-2 text-[10px] text-[#3b5f76] mt-0.5">
                        {doc.ocr_status === "completed" ? (
                          <CheckCircle className="w-3 h-3 text-[#22c55e]" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-[#f59e0b]" />
                        )}
                        <span>{doc.ocr_status || "pending"}</span>
                        <span>|</span>
                        <span>{formatTimeAgo(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {documents.length === 0 && (
                <div className="p-4 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-[#6fa6c3]" />
                  <p className="text-xs text-[#3b5f76] font-medium">No documents uploaded</p>
                </div>
              )}
            </>
          )}

          {activeTab === "evidence" && (
            <>
              {evidence.map((ev: any) => (
                <button
                  key={ev.id}
                  className="w-full text-left p-2 rounded-lg border-2 border-black bg-white hover:bg-[#eef6fb] transition-colors group shadow-[inset_0_0_0_2px_#6fa6c3]"
                >
                  <div className="flex items-start gap-2">
                    <Bot className="w-4 h-4 text-[#ffcc00] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs line-clamp-2 text-[#0b2a3a]">{ev.claim}</div>
                      <div className="flex items-center gap-2 text-[10px] text-[#3b5f76] mt-1">
                        <HabboPill variant="info" className="text-[8px] px-1 py-0">
                          {ev.claim_type}
                        </HabboPill>
                        <span className="font-bold">{Math.round((ev.confidence || 0) * 100)}%</span>
                        <span>|</span>
                        <span>{formatTimeAgo(ev.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {evidence.length === 0 && (
                <div className="p-4 text-center">
                  <Bot className="w-8 h-8 mx-auto mb-2 text-[#6fa6c3]" />
                  <p className="text-xs text-[#3b5f76] font-medium">No evidence extracted</p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="pt-2 border-t-2 border-[#3b5f76]">
        <label className="cursor-pointer block">
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <HabboCard variant="blue" className="p-3 text-center hover:bg-[#d9e6ef] transition-colors cursor-pointer border-dashed">
            {uploading ? (
              <Loader2 className="w-5 h-5 mx-auto animate-spin text-[#ffcc00]" />
            ) : (
              <Plus className="w-5 h-5 mx-auto text-[#3b5f76]" />
            )}
            <p className="text-[10px] text-[#3b5f76] mt-1 font-medium">
              {uploading ? "Processing..." : "Drop files here"}
            </p>
          </HabboCard>
        </label>
      </div>
    </div>
  )
}
