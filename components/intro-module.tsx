"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"

interface Step {
  title: string
  description: string
  animation: "upload" | "process" | "verify" | "collaborate"
}

const steps: Step[] = [
  {
    title: "Drop Documents",
    description: "Sink classified PDFs into the depths",
    animation: "upload",
  },
  {
    title: "Lobster Processing",
    description: "Multi-lobster analysis extracts evidence shells",
    animation: "process",
  },
  {
    title: "Verify Clawmarks",
    description: "Every claim pinched from exact source location",
    animation: "verify",
  },
  {
    title: "Collaborate",
    description: "Humans + lobsters crack the case together",
    animation: "collaborate",
  },
]

function UploadAnimation() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      {/* Document */}
      <rect
        x="35"
        y="20"
        width="50"
        height="60"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-muted-foreground"
      />
      {/* Redaction bars */}
      <rect x="42" y="32" width="30" height="4" rx="1" className="fill-foreground animate-pulse" />
      <rect x="42" y="42" width="20" height="3" rx="1" className="fill-muted-foreground/40" />
      <rect x="42" y="50" width="35" height="3" rx="1" className="fill-muted-foreground/40" />
      <rect x="42" y="58" width="25" height="4" rx="1" className="fill-foreground animate-pulse" style={{ animationDelay: "0.3s" }} />
      <rect x="42" y="68" width="30" height="3" rx="1" className="fill-muted-foreground/40" />
      {/* Upload arrow */}
      <path
        d="M60 5 L60 18 M54 11 L60 5 L66 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary animate-bounce"
        style={{ animationDuration: "1.5s" }}
      />
    </svg>
  )
}

function ProcessAnimation() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      {/* Lobster nodes */}
      <circle cx="30" cy="40" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-orange-500" />
      <text x="30" y="44" textAnchor="middle" className="fill-orange-500 text-[8px] font-mono">M</text>
      
      <circle cx="60" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-teal-500" />
      <text x="60" y="24" textAnchor="middle" className="fill-teal-500 text-[8px] font-mono">S</text>
      
      <circle cx="90" cy="40" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-500" />
      <text x="90" y="44" textAnchor="middle" className="fill-amber-500 text-[8px] font-mono">R</text>
      
      {/* Connection lines with animated dashes */}
      <line x1="42" y1="35" x2="48" y2="25" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/50" strokeDasharray="2 2">
        <animate attributeName="stroke-dashoffset" from="0" to="4" dur="0.5s" repeatCount="indefinite" />
      </line>
      <line x1="72" y1="25" x2="78" y2="35" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/50" strokeDasharray="2 2">
        <animate attributeName="stroke-dashoffset" from="0" to="4" dur="0.5s" repeatCount="indefinite" />
      </line>
      <line x1="42" y1="45" x2="78" y2="45" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/50" strokeDasharray="2 2">
        <animate attributeName="stroke-dashoffset" from="0" to="4" dur="0.5s" repeatCount="indefinite" />
      </line>
      
      {/* Center processing indicator */}
      <circle cx="60" cy="55" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground">
        <animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="55" r="3" className="fill-foreground" />
    </svg>
  )
}

function VerifyAnimation() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      {/* Document chunk */}
      <rect x="15" y="15" width="40" height="50" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
      <rect x="22" y="25" width="26" height="3" rx="1" className="fill-muted-foreground/40" />
      <rect x="22" y="33" width="20" height="3" rx="1" className="fill-muted-foreground/40" />
      <rect x="22" y="41" width="26" height="3" rx="1" className="fill-primary/60" />
      <rect x="22" y="49" width="18" height="3" rx="1" className="fill-muted-foreground/40" />
      
      {/* Arrow pointing to citation */}
      <path d="M58 40 L72 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
      </path>
      <path d="M68 36 L72 40 L68 44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
      </path>
      
      {/* Citation badge */}
      <rect x="75" y="30" width="35" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
      <text x="92.5" y="38" textAnchor="middle" className="fill-foreground text-[6px] font-mono">DOC.3</text>
      <text x="92.5" y="46" textAnchor="middle" className="fill-muted-foreground text-[5px] font-mono">12-15</text>
      
      {/* Checkmark */}
      <circle cx="100" cy="60" r="8" className="fill-green-500/20 stroke-green-500" strokeWidth="1.5">
        <animate attributeName="r" values="6;9;6" dur="2s" repeatCount="indefinite" />
      </circle>
      <path d="M96 60 L99 63 L105 56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500" />
    </svg>
  )
}

function CollaborateAnimation() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      {/* Human icon */}
      <circle cx="30" cy="25" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
      <path d="M20 50 Q20 38 30 38 Q40 38 40 50" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
      
      {/* Lobster icon - simplified claw shape */}
      <ellipse cx="88" cy="22" rx="10" ry="8" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-orange-500" />
      <path d="M78 22 L72 18 M78 22 L72 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-orange-500" />
      <path d="M76 50 Q76 38 88 38 Q100 38 100 50" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-orange-500" />
      
      {/* Chat bubbles / messages */}
      <rect x="45" y="20" width="25" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </rect>
      <rect x="50" y="38" width="20" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="0.5s" />
      </rect>
      
      {/* Shared document below */}
      <rect x="42" y="55" width="36" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
      <rect x="48" y="61" width="24" height="2" rx="1" className="fill-muted-foreground/40" />
      <rect x="48" y="66" width="18" height="2" rx="1" className="fill-muted-foreground/40" />
      
      {/* Connection lines */}
      <line x1="35" y1="50" x2="45" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-muted-foreground/50" />
      <line x1="85" y1="50" x2="75" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-muted-foreground/50" />
    </svg>
  )
}

export function IntroModule() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const renderAnimation = (type: Step["animation"]) => {
    switch (type) {
      case "upload":
        return <UploadAnimation />
      case "process":
        return <ProcessAnimation />
      case "verify":
        return <VerifyAnimation />
      case "collaborate":
        return <CollaborateAnimation />
    }
  }

  return (
    <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/60 w-full max-w-sm">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-mono">
        How It Works
      </div>

      {/* Animation viewport */}
      <div className="h-24 mb-4 text-foreground">
        {renderAnimation(steps[activeStep].animation)}
      </div>

      {/* Step info */}
      <div className="mb-4 min-h-[3.5rem]">
        <h3 className="font-semibold text-sm">{steps[activeStep].title}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {steps[activeStep].description}
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {steps.map((step, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              i === activeStep
                ? "bg-foreground"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Go to step ${i + 1}: ${step.title}`}
          />
        ))}
      </div>
    </Card>
  )
}
