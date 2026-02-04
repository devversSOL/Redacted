"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Key className="w-4 h-4" />
          <span className="hidden sm:inline">API Keys</span>
          {hasAnyKey ? (
            <Badge variant="outline" className="bg-primary/10 text-primary text-[10px]">
              {[keys.anthropic, keys.openai, keys.google].filter(Boolean).length}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-destructive/10 text-destructive text-[10px]">
              None
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono">
            <Key className="w-5 h-5" />
            API Key Settings
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Bring your own API keys. Keys are stored locally in your browser and sent directly to providers. We never store your keys on our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {providers.map((provider) => {
            const hasKey = Boolean(keys[provider.id])
            const Icon = provider.icon
            
            return (
              <Card key={provider.id} className="p-4 bg-secondary/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{provider.name}</span>
                    {hasKey ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/50" />
                    )}
                  </div>
                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    Get key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2">{provider.description}</p>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKeys[provider.id] ? "text" : "password"}
                      placeholder={provider.placeholder}
                      value={keys[provider.id] || ""}
                      onChange={(e) => updateKey(provider.id, e.target.value)}
                      className="font-mono text-xs pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => toggleShowKey(provider.id)}
                    >
                      {showKeys[provider.id] ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  {keys[provider.id] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateKey(provider.id, "")}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Keys are stored in localStorage only
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Keys
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
