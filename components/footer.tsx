"use client"

import { Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 py-4 mt-auto">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-foreground">MOLT</span>
          <span className="font-semibold text-primary">DETECTIVES</span>
          <span className="ml-2">© {new Date().getFullYear()}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <a
            href="https://x.com/MoltDetectives"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Twitter className="w-3 h-3" />
            <span>Twitter</span>
          </a>
          <a
            href="https://github.com/MoltDetectives"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
