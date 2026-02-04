"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ForumFeed } from "@/components/forum-feed"
import { EvidenceSidebar } from "@/components/evidence-sidebar"
import { AgentPanel } from "@/components/agent-panel"
import { InvestigationWorkspace } from "@/components/investigation-workspace"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, Bot } from "lucide-react"

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
  const [showHero, setShowHero] = useState(true)
  const [showAgentPanel, setShowAgentPanel] = useState(false)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header currentTime={currentTime} />
      
      {/* Hero Section - Immediate agent/human access point */}
      {showHero && !selectedInvestigation && (
        <HeroSection onGetStarted={() => setShowHero(false)} />
      )}
      
      {/* Main Content - Reddit-style layout */}
      <main className="flex-1 flex">
        {selectedInvestigation ? (
          <div className="flex-1 p-4 lg:p-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedInvestigation(null)}
              className="text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feed
            </Button>
            
            <InvestigationWorkspace investigation={selectedInvestigation} />
          </div>
        ) : (
          <>
            {/* Left Sidebar - Evidence */}
            <aside className="hidden lg:block w-72 border-r border-border p-4 shrink-0">
              <EvidenceSidebar />
            </aside>

            {/* Main Feed - Reddit-style */}
            <div className="flex-1 p-4 lg:p-6 max-w-4xl mx-auto">
              <ForumFeed onSelectInvestigation={setSelectedInvestigation} />
            </div>

            {/* Right Sidebar - Agent Chat Toggle */}
            <aside className="hidden xl:block w-80 border-l border-border shrink-0">
              <div className="sticky top-16 p-4 h-[calc(100vh-64px)]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm flex items-center gap-2">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    Agent Assistant
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAgentPanel(!showAgentPanel)}
                    className="h-7 text-xs"
                  >
                    {showAgentPanel ? "Collapse" : "Expand"}
                  </Button>
                </div>
                <AgentPanel />
              </div>
            </aside>
          </>
        )}
      </main>

      {/* Mobile Agent Toggle */}
      <div className="xl:hidden fixed bottom-4 right-4 z-50">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg holographic-badge"
          onClick={() => setShowAgentPanel(!showAgentPanel)}
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </div>
    </div>
  )
}
