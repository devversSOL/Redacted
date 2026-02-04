"use client"

import { Radio, Shield, Twitter } from "lucide-react"
import { APIKeySettings } from "@/components/api-key-settings"
import { AuthButton } from "@/components/auth-button"

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

        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
          {/* Time - hidden on small mobile */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Radio className="h-3 w-3 text-primary" />
              <span className="text-primary font-medium">{currentTime ? formatTime(currentTime) : "--:--:--"}</span>
            </div>
            <span className="hidden md:inline text-muted-foreground">{currentTime ? formatDate(currentTime) : "--/--/----"}</span>
          </div>

          {/* Secure badge - icon only on mobile */}
          <div className="flex items-center gap-1 sm:gap-2 text-xs">
            <Shield className="h-3 w-3 text-primary" />
            <span className="hidden sm:inline text-primary">SECURE</span>
          </div>

          {/* Twitter */}
          <a 
            href="https://x.com/RedactedAgentz" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <Twitter className="h-4 w-4" />
          </a>

          <AuthButton />
          <APIKeySettings />
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </header>
  )
}
