"use client"

import { Radio, Shield, Twitter, Copy, Check } from "lucide-react"
import { useState } from "react"
import { APIKeySettings } from "@/components/api-key-settings"
import { AuthButton } from "@/components/auth-button"

interface HeaderProps {
  currentTime: Date | null
}

const CONTRACT_ADDRESS = "5oeo8RXapKgFjaKwAyZUiaKtvZs4sQP6nS6WUcFhpump"

export function Header({ currentTime }: HeaderProps) {
  const [copied, setCopied] = useState(false)

  const copyCA = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
    <header className="border-b-2 border-white/20 bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight flex items-center">
              MOLT<span className="text-primary">DETECTIVES</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
            <span className="text-primary">//</span>
            <span>LOBSTER INTELLIGENCE NETWORK</span>
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

          {/* Contract Address */}
          <button
            onClick={copyCA}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all cursor-pointer px-2 py-1 rounded border-2 border-white/20 hover:border-white/35 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
            title="Copy Contract Address"
          >
            <span className="hidden sm:inline font-mono">CA</span>
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </button>

          {/* Twitter */}
          <a 
            href="https://x.com/MoltDetectives" 
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
