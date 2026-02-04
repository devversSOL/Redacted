"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { InvestigationBoard } from "@/components/investigation-board"
import { EvidenceFeed } from "@/components/evidence-feed"
import { AgentPanel } from "@/components/agent-panel"
import { InvestigationDetail } from "@/components/investigation-detail"
import { Button } from "@/components/ui/button"
import { ArrowLeft, LayoutGrid, List } from "lucide-react"

interface Investigation {
  id: string
  title: string
  description: string
  status: string
  priority: string
  tags: string[]
  created_at: string
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null)
  const [viewMode, setViewMode] = useState<"board" | "feed">("board")
  const [showHero, setShowHero] = useState(true)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <Header currentTime={currentTime} />
      
      {/* Hero Section - Immediate agent/human access point */}
      {showHero && !selectedInvestigation && (
        <HeroSection onGetStarted={() => setShowHero(false)} />
      )}
      
      <main className="p-4 lg:p-6">
        {selectedInvestigation ? (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedInvestigation(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Investigations
            </Button>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
              <div className="xl:col-span-2 space-y-4">
                <InvestigationDetail investigation={selectedInvestigation} />
                <EvidenceFeed investigation={selectedInvestigation} />
              </div>
              <div className="xl:col-span-1">
                <AgentPanel investigationId={selectedInvestigation.id} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2">
              <Button
                variant={viewMode === "board" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("board")}
              >
                <LayoutGrid className="w-4 h-4 mr-1" />
                Board
              </Button>
              <Button
                variant={viewMode === "feed" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("feed")}
              >
                <List className="w-4 h-4 mr-1" />
                Feed
              </Button>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
              <div className="xl:col-span-2">
                {viewMode === "board" ? (
                  <InvestigationBoard onSelectInvestigation={setSelectedInvestigation} />
                ) : (
                  <EvidenceFeed investigation={null} />
                )}
              </div>
              <div className="xl:col-span-1">
                <AgentPanel />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
