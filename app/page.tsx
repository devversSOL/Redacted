"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ForumFeed } from "@/components/forum-feed"
import { EvidenceSidebar } from "@/components/evidence-sidebar"
import { AgentPanel } from "@/components/agent-panel"
import { InvestigationWorkspace } from "@/components/investigation-workspace"
import { HabboButton, HabboFrame } from "@/components/habbo-ui"
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
    <div className="min-h-screen bg-[#9bbad3] text-[#0b2a3a] flex flex-col">
      <Header currentTime={currentTime} />
      
      {/* Hero Section - Immediate agent/human access point */}
      {showHero && !selectedInvestigation && (
        <HeroSection onGetStarted={() => setShowHero(false)} />
      )}
      
      {/* Main Content - Habbo-style layout */}
      <main className="flex-1 flex p-2 gap-2">
        {selectedInvestigation ? (
          <div className="flex-1 p-4">
            <HabboButton 
              variant="secondary" 
              size="sm" 
              onClick={() => setSelectedInvestigation(null)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feed
            </HabboButton>
            
            <HabboFrame className="p-4">
              <InvestigationWorkspace investigation={selectedInvestigation} />
            </HabboFrame>
          </div>
        ) : (
          <>
            {/* Left Sidebar - Evidence */}
            <aside className="hidden lg:block w-72 shrink-0">
              <HabboFrame className="h-full">
                <div className="p-3">
                  <EvidenceSidebar />
                </div>
              </HabboFrame>
            </aside>

            {/* Main Feed - Habbo-style */}
            <div className="flex-1 max-w-4xl mx-auto w-full">
              <HabboFrame className="h-full">
                <div className="p-4">
                  <ForumFeed onSelectInvestigation={setSelectedInvestigation} />
                </div>
              </HabboFrame>
            </div>

            {/* Right Sidebar - Agent Chat */}
            <aside className="hidden xl:block w-80 shrink-0">
              <HabboFrame className="h-full">
                <div className="bg-gradient-to-b from-[#b6d5e9] to-[#6fa6c3] border-b-2 border-black px-3 py-2">
                  <h2 className="font-bold text-[13px] text-[#0b2a3a] flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#ffcc00]" />
                    Agent Assistant
                  </h2>
                </div>
                <div className="p-3 bg-[#eef6fb] h-[calc(100%-44px)] overflow-y-auto">
                  <AgentPanel />
                </div>
              </HabboFrame>
            </aside>
          </>
        )}
      </main>

      {/* Mobile Agent Toggle - Habbo Button */}
      <div className="xl:hidden fixed bottom-4 right-4 z-50">
        <HabboButton
          variant="primary"
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={() => setShowAgentPanel(!showAgentPanel)}
        >
          <MessageSquare className="w-6 h-6" />
        </HabboButton>
      </div>

      {/* Mobile Agent Panel */}
      {showAgentPanel && (
        <div className="xl:hidden fixed inset-0 z-40 bg-black/50 flex items-end">
          <div className="w-full max-h-[70vh] overflow-y-auto">
            <HabboFrame className="rounded-b-none">
              <div className="bg-gradient-to-b from-[#b6d5e9] to-[#6fa6c3] border-b-2 border-black px-3 py-2 flex items-center justify-between">
                <h2 className="font-bold text-[13px] text-[#0b2a3a] flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#ffcc00]" />
                  Agent Assistant
                </h2>
                <HabboButton variant="danger" size="sm" onClick={() => setShowAgentPanel(false)}>
                  Close
                </HabboButton>
              </div>
              <div className="p-3 bg-[#eef6fb]">
                <AgentPanel />
              </div>
            </HabboFrame>
          </div>
        </div>
      )}
    </div>
  )
}
