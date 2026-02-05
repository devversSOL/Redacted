"use client"

import { useState, useEffect } from "react"
import { HabboFrame, HabboProgress } from "@/components/habbo-ui"

interface Step {
  title: string
  description: string
  animation: "upload" | "process" | "verify" | "collaborate"
}

const steps: Step[] = [
  {
    title: "Upload Documents",
    description: "Drop classified PDFs with redactions intact",
    animation: "upload",
  },
  {
    title: "AI Processing",
    description: "Multi-agent analysis extracts evidence chunks",
    animation: "process",
  },
  {
    title: "Verify Citations",
    description: "Every claim traced to exact source location",
    animation: "verify",
  },
  {
    title: "Collaborate",
    description: "Humans + agents build the case together",
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
        rx="4"
        fill="#eef6fb"
        stroke="#000"
        strokeWidth="2"
      />
      {/* Redaction bars */}
      <rect x="42" y="32" width="30" height="6" rx="2" fill="#0b2a3a" className="animate-pulse" />
      <rect x="42" y="44" width="20" height="4" rx="1" fill="#6fa6c3" />
      <rect x="42" y="52" width="35" height="4" rx="1" fill="#6fa6c3" />
      <rect x="42" y="60" width="25" height="6" rx="2" fill="#0b2a3a" className="animate-pulse" style={{ animationDelay: "0.3s" }} />
      <rect x="42" y="70" width="30" height="4" rx="1" fill="#6fa6c3" />
      {/* Upload arrow */}
      <path
        d="M60 5 L60 18 M54 11 L60 5 L66 11"
        stroke="#ffcc00"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-bounce"
        style={{ animationDuration: "1.5s" }}
      />
    </svg>
  )
}

function ProcessAnimation() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      {/* Agent nodes */}
      <circle cx="30" cy="40" r="14" fill="#b6d5e9" stroke="#000" strokeWidth="2" />
      <text x="30" y="45" textAnchor="middle" fill="#0b2a3a" className="text-[10px] font-black">C</text>
      
      <circle cx="60" cy="18" r="14" fill="#d7f5dd" stroke="#000" strokeWidth="2" />
      <text x="60" y="23" textAnchor="middle" fill="#0b2a3a" className="text-[10px] font-black">G</text>
      
      <circle cx="90" cy="40" r="14" fill="#fef3cd" stroke="#000" strokeWidth="2" />
      <text x="90" y="45" textAnchor="middle" fill="#0b2a3a" className="text-[10px] font-black">G</text>
      
      {/* Connection lines with animated dashes */}
      <line x1="42" y1="33" x2="48" y2="25" stroke="#3b5f76" strokeWidth="2" strokeDasharray="3 3">
        <animate attributeName="stroke-dashoffset" from="0" to="6" dur="0.5s" repeatCount="indefinite" />
      </line>
      <line x1="72" y1="25" x2="78" y2="33" stroke="#3b5f76" strokeWidth="2" strokeDasharray="3 3">
        <animate attributeName="stroke-dashoffset" from="0" to="6" dur="0.5s" repeatCount="indefinite" />
      </line>
      <line x1="44" y1="45" x2="76" y2="45" stroke="#3b5f76" strokeWidth="2" strokeDasharray="3 3">
        <animate attributeName="stroke-dashoffset" from="0" to="6" dur="0.5s" repeatCount="indefinite" />
      </line>
      
      {/* Center processing indicator */}
      <circle cx="60" cy="58" r="10" fill="#ffcc00" stroke="#000" strokeWidth="2">
        <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="58" r="4" fill="#0b2a3a" />
    </svg>
  )
}

function VerifyAnimation() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      {/* Document chunk */}
      <rect x="15" y="12" width="45" height="56" rx="4" fill="#eef6fb" stroke="#000" strokeWidth="2" />
      <rect x="22" y="22" width="30" height="4" rx="1" fill="#6fa6c3" />
      <rect x="22" y="30" width="24" height="4" rx="1" fill="#6fa6c3" />
      <rect x="22" y="38" width="30" height="5" rx="1" fill="#ffcc00" />
      <rect x="22" y="47" width="20" height="4" rx="1" fill="#6fa6c3" />
      <rect x="22" y="55" width="26" height="4" rx="1" fill="#6fa6c3" />
      
      {/* Arrow pointing to citation */}
      <path d="M62 40 L76 40" stroke="#ffcc00" strokeWidth="3" strokeLinecap="round">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
      </path>
      <path d="M72 36 L76 40 L72 44" stroke="#ffcc00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
      </path>
      
      {/* Citation badge */}
      <rect x="78" y="28" width="32" height="24" rx="4" fill="#d7f5dd" stroke="#000" strokeWidth="2" />
      <text x="94" y="38" textAnchor="middle" fill="#0b2a3a" className="text-[7px] font-black">DOC.3</text>
      <text x="94" y="47" textAnchor="middle" fill="#3b5f76" className="text-[6px] font-bold">12-15</text>
      
      {/* Checkmark */}
      <circle cx="100" cy="62" r="10" fill="#22c55e" stroke="#000" strokeWidth="2">
        <animate attributeName="r" values="8;11;8" dur="2s" repeatCount="indefinite" />
      </circle>
      <path d="M95 62 L99 66 L106 58" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CollaborateAnimation() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      {/* Human icon */}
      <circle cx="30" cy="22" r="10" fill="#eef6fb" stroke="#000" strokeWidth="2" />
      <path d="M18 48 Q18 35 30 35 Q42 35 42 48" fill="#b6d5e9" stroke="#000" strokeWidth="2" />
      
      {/* Bot icon */}
      <rect x="80" y="12" width="20" height="20" rx="4" fill="#ffcc00" stroke="#000" strokeWidth="2" />
      <circle cx="86" cy="21" r="3" fill="#0b2a3a" />
      <circle cx="94" cy="21" r="3" fill="#0b2a3a" />
      <path d="M78 48 Q78 35 90 35 Q102 35 102 48" fill="#fef3cd" stroke="#000" strokeWidth="2" />
      
      {/* Chat bubbles / messages */}
      <rect x="45" y="18" width="28" height="14" rx="4" fill="#eef6fb" stroke="#000" strokeWidth="2">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </rect>
      <rect x="47" y="38" width="24" height="12" rx="4" fill="#d7f5dd" stroke="#000" strokeWidth="2">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="0.5s" />
      </rect>
      
      {/* Shared document below */}
      <rect x="40" y="55" width="40" height="22" rx="4" fill="#eef6fb" stroke="#000" strokeWidth="2" />
      <rect x="48" y="62" width="24" height="3" rx="1" fill="#6fa6c3" />
      <rect x="48" y="68" width="18" height="3" rx="1" fill="#6fa6c3" />
      
      {/* Connection lines */}
      <line x1="36" y1="48" x2="45" y2="58" stroke="#3b5f76" strokeWidth="2" strokeDasharray="3 3" />
      <line x1="84" y1="48" x2="75" y2="58" stroke="#3b5f76" strokeWidth="2" strokeDasharray="3 3" />
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
    <HabboFrame className="p-4 w-full max-w-sm bg-[#d9e6ef]">
      <div className="text-[10px] uppercase tracking-widest text-[#3b5f76] mb-3 font-black">
        How It Works
      </div>

      {/* Animation viewport */}
      <div className="h-24 mb-4 bg-[#eef6fb] rounded-lg border-2 border-black p-2 shadow-[inset_0_0_0_2px_#6fa6c3]">
        {renderAnimation(steps[activeStep].animation)}
      </div>

      {/* Step info */}
      <div className="mb-4 min-h-[3.5rem]">
        <h3 className="font-black text-sm text-[#0b2a3a]">{steps[activeStep].title}</h3>
        <p className="text-xs text-[#3b5f76] mt-1">
          {steps[activeStep].description}
        </p>
      </div>

      {/* Step indicators - Habbo style progress */}
      <div className="flex gap-2">
        {steps.map((step, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            className={`flex-1 h-3 rounded-full border-2 border-black transition-all duration-300 ${
              i === activeStep
                ? "bg-gradient-to-b from-[#ffcc00] to-[#f3b700]"
                : "bg-[#6fa6c3] hover:bg-[#b6d5e9]"
            }`}
            aria-label={`Go to step ${i + 1}: ${step.title}`}
          />
        ))}
      </div>
    </HabboFrame>
  )
}
