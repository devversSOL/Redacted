"use client"

import { useState, useEffect } from "react"
import {
  HabboButton,
  HabboInput,
  HabboCard,
  HabboPill,
  HabboWindow,
  HabboAlert,
} from "@/components/habbo-ui"
import { Key, Check, X, Sparkles, Bot, Cpu, ExternalLink, Eye, EyeOff } from "lucide-react"
import { getStoredKeys, setStoredKeys, type APIKeys } from "@/lib/byok"

export function APIKeySettings() {
  const [keys, setKeys] = useState<APIKeys>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setKeys(getStoredKeys())
  }, [open])

  const handleSave = () => {
    setStoredKeys(keys)
    setOpen(false)
  }

  const updateKey = (provider: keyof APIKeys, value: string) => {
    setKeys(prev => ({ ...prev, [provider]: value || undefined }))
  }

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }))
  }

  const providers = [
    {
      id: "anthropic" as const,
      name: "Anthropic (Claude)",
      icon: Sparkles,
      placeholder: "sk-ant-...",
      docsUrl: "https://console.anthropic.com/",
      description: "Powers Claude agents",
    },
    {
      id: "openai" as const,
      name: "OpenAI (GPT)",
      icon: Bot,
      placeholder: "sk-...",
      docsUrl: "https://platform.openai.com/api-keys",
      description: "Powers GPT agents",
    },
    {
      id: "google" as const,
      name: "Google AI (Gemini)",
      icon: Cpu,
      placeholder: "AI...",
      docsUrl: "https://aistudio.google.com/apikey",
      description: "Powers Gemini agents (free tier available)",
    },
  ]

  const hasAnyKey = Boolean(keys.anthropic || keys.openai || keys.google)
  const keyCount = [keys.anthropic, keys.openai, keys.google].filter(Boolean).length

  return (
    <>
      <HabboButton variant="secondary" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Key className="w-4 h-4" />
        <span className="hidden sm:inline text-[11px]">API Keys</span>
        {hasAnyKey ? (
          <HabboPill variant="success" className="text-[9px] px-1">{keyCount}</HabboPill>
        ) : (
          <HabboPill variant="danger" className="text-[9px] px-1">0</HabboPill>
        )}
      </HabboButton>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <HabboWindow
            title="API Key Settings"
            initialPosition={{ x: 0, y: 0 }}
            initialSize={{ width: 480, height: 520 }}
            onClose={() => setOpen(false)}
            className="relative z-10"
            style={{ position: "relative", left: 0, top: 0 }}
          >
            <div className="p-4 space-y-3">
              <HabboAlert variant="info" title="Bring Your Own Keys">
                Keys are stored locally in your browser and sent directly to providers. 
                We never store your keys on our servers.
              </HabboAlert>

              {providers.map((provider) => {
                const hasKey = Boolean(keys[provider.id])
                const Icon = provider.icon
                
                return (
                  <HabboCard key={provider.id} variant={hasKey ? "green" : "default"} className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#ffcc00]" />
                        <span className="font-bold text-[12px] text-[#0b2a3a]">{provider.name}</span>
                        {hasKey ? (
                          <HabboPill variant="success" className="text-[8px]">
                            <Check className="w-2 h-2 mr-0.5" /> Set
                          </HabboPill>
                        ) : (
                          <HabboPill variant="danger" className="text-[8px]">
                            <X className="w-2 h-2 mr-0.5" /> Missing
                          </HabboPill>
                        )}
                      </div>
                      <a
                        href={provider.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <HabboButton variant="secondary" size="sm" className="text-[10px]">
                          Get key <ExternalLink className="w-2.5 h-2.5 ml-1" />
                        </HabboButton>
                      </a>
                    </div>
                    
                    <p className="text-[10px] text-[#3b5f76] mb-2">{provider.description}</p>
                    
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <HabboInput
                          type={showKeys[provider.id] ? "text" : "password"}
                          placeholder={provider.placeholder}
                          value={keys[provider.id] || ""}
                          onChange={(e) => updateKey(provider.id, e.target.value)}
                          className="font-mono text-xs pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#3b5f76] hover:text-[#0b2a3a]"
                          onClick={() => toggleShowKey(provider.id)}
                        >
                          {showKeys[provider.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {keys[provider.id] && (
                        <HabboButton
                          variant="danger"
                          size="sm"
                          onClick={() => updateKey(provider.id, "")}
                        >
                          <X className="w-4 h-4" />
                        </HabboButton>
                      )}
                    </div>
                  </HabboCard>
                )
              })}

              <div className="flex justify-between items-center pt-3 border-t-2 border-[#6fa6c3]">
                <p className="text-[10px] text-[#3b5f76]">
                  Keys are stored in localStorage only
                </p>
                <div className="flex gap-2">
                  <HabboButton variant="secondary" size="sm" onClick={() => setOpen(false)}>
                    Cancel
                  </HabboButton>
                  <HabboButton variant="primary" size="sm" onClick={handleSave}>
                    Save Keys
                  </HabboButton>
                </div>
              </div>
            </div>
          </HabboWindow>
        </div>
      )}
    </>
  )
}
