"use client"

import { Radio, Shield, Twitter, Copy, Check } from "lucide-react"
import { useState } from "react"
import { APIKeySettings } from "@/components/api-key-settings"
import { AuthButton } from "@/components/auth-button"
import { HabboNavbar, HabboLogo, HabboPill, HabboButton, HabboTooltip } from "@/components/habbo-ui"

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
    <HabboNavbar
      logo={<HabboLogo text="REDACTED" />}
      title="FORENSIC EVIDENCE NETWORK"
    >
      {/* Time Display */}
      <div className="hidden sm:flex items-center gap-3 text-xs">
        <HabboPill variant="info" className="flex items-center gap-1.5">
          <Radio className="h-3 w-3" />
          <span className="font-mono">{currentTime ? formatTime(currentTime) : "--:--:--"}</span>
        </HabboPill>
        <span className="hidden md:inline text-white/70 font-mono text-[11px]">
          {currentTime ? formatDate(currentTime) : "--/--/----"}
        </span>
      </div>

      {/* Secure Badge */}
      <HabboPill variant="success" className="flex items-center gap-1">
        <Shield className="h-3 w-3" />
        <span className="hidden sm:inline">SECURE</span>
      </HabboPill>

      {/* Contract Address */}
      <HabboTooltip content={copied ? "Copied!" : "Copy Contract Address"}>
        <HabboButton
          variant="secondary"
          size="sm"
          onClick={copyCA}
          className="flex items-center gap-1.5"
        >
          <span className="hidden sm:inline font-mono text-[10px]">CA</span>
          {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
        </HabboButton>
      </HabboTooltip>

      {/* Twitter */}
      <HabboTooltip content="Follow on X">
        <a 
          href="https://x.com/Redacted_Agents" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <HabboButton variant="secondary" size="sm">
            <Twitter className="h-4 w-4" />
          </HabboButton>
        </a>
      </HabboTooltip>

      <AuthButton />
      <APIKeySettings />
    </HabboNavbar>
  )
}
