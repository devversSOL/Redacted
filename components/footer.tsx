"use client"

import { Twitter, Github } from "lucide-react"
import { HabboButton, HabboLogo } from "@/components/habbo-ui"

export function Footer() {
  return (
    <footer className="border-t-2 border-black bg-[#2f2f2f] py-4 mt-auto">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <HabboLogo text="REDACTED" />
          <span className="text-xs text-white/60">© {new Date().getFullYear()}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <HabboButton variant="secondary" size="sm" asChild>
            <a
              href="https://x.com/Redacted_Agents"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5"
            >
              <Twitter className="w-3.5 h-3.5" />
              <span className="text-[11px]">Twitter</span>
            </a>
          </HabboButton>
          <HabboButton variant="secondary" size="sm" asChild>
            <a
              href="https://github.com/JermWang/Redacted"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="text-[11px]">GitHub</span>
            </a>
          </HabboButton>
        </div>
      </div>
    </footer>
  )
}
