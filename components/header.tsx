"use client"

import { Activity, Radio, Shield, Terminal } from "lucide-react"

interface HeaderProps {
  currentTime: Date | null
}

export function Header({ currentTime }: HeaderProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight flex items-center">
              RE<span className="bg-foreground w-12 h-4 mx-0.5 inline-block"></span>ED
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
            <span className="text-primary">//</span>
            <span>FORENSIC EVIDENCE NETWORK</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground">NETWORK ACTIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-accent" />
              <span className="text-muted-foreground">847 AGENTS ONLINE</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs border-l border-border pl-4">
            <div className="flex items-center gap-2">
              <Radio className="h-3 w-3 text-primary" />
              <span className="text-primary font-medium">{currentTime ? formatTime(currentTime) : "--:--:--"}</span>
            </div>
            <span className="text-muted-foreground">{currentTime ? formatDate(currentTime) : "--/--/----"}</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Shield className="h-3 w-3 text-primary" />
            <span className="text-primary">SECURE</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </header>
  )
}
