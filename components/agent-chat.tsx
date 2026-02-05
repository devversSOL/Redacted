"use client"

import React from "react"

import { useState, useRef, useEffect, useMemo } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Bot, 
  Sparkles, 
  User, 
  Cpu, 
  Send,
  Loader2,
  MessageSquare,
  RefreshCw,
  FileSearch,
  Database,
  Link2,
  Key
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAuthHeaders, hasAnyKey } from "@/lib/byok"

interface AgentChatProps {
  investigationId?: string
}

export function AgentChat({ investigationId }: AgentChatProps) {
  const [agentType, setAgentType] = useState<"claude" | "gpt" | "gemini">("claude")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState("")
  const [hasKeys, setHasKeys] = useState(false)

  // Check for API keys on mount and when window regains focus
  useEffect(() => {
    const checkKeys = () => setHasKeys(hasAnyKey())
    checkKeys()
    window.addEventListener("focus", checkKeys)
    return () => window.removeEventListener("focus", checkKeys)
  }, [])

  // Create transport with BYOK headers
  const transport = useMemo(() => {
    const headers = getAuthHeaders(agentType)
    return new DefaultChatTransport({
      api: "/api/agents/chat",
      body: { investigationId, agentType },
      headers,
    })
  }, [investigationId, agentType])

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || status === "streaming") return
    sendMessage({ text: inputValue })
    setInputValue("")
  }

  const agentConfig = {
    claude: { icon: Sparkles, color: "text-chart-1", name: "Maine Lobster" },
    gpt: { icon: Bot, color: "text-chart-2", name: "Spiny Lobster" },
    gemini: { icon: Cpu, color: "text-chart-3", name: "Rock Lobster" }
  }

  const getMessageText = (msg: typeof messages[0]): string => {
    if (!msg.parts || !Array.isArray(msg.parts)) return ""
    return msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("")
  }

  const getToolCalls = (msg: typeof messages[0]) => {
    if (!msg.parts || !Array.isArray(msg.parts)) return []
    // Filter tool invocations and extract relevant properties
    return msg.parts
      .filter((p) => p.type === "tool-invocation")
      .map((p: any) => ({
        toolInvocationId: p.toolCallId || p.toolInvocationId || '',
        toolName: p.toolName || '',
        state: p.state || 'pending',
      }))
  }

  const AgentIcon = agentConfig[agentType].icon

  return (
    <Card className="flex flex-col h-[600px] bg-card/50 border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-semibold tracking-tight">LOBSTER INTERFACE</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={agentType}
            onValueChange={(v) => setAgentType(v as typeof agentType)}
          >
            <SelectTrigger className="w-32 font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Maine Lobster
                </span>
              </SelectItem>
              <SelectItem value="gpt">
                <span className="flex items-center gap-2">
                  <Bot className="w-3 h-3" /> Spiny Lobster
                </span>
              </SelectItem>
              <SelectItem value="gemini">
                <span className="flex items-center gap-2">
                  <Cpu className="w-3 h-3" /> Rock Lobster
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessages([])}
            className="text-muted-foreground"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <AgentIcon className={`w-12 h-12 mb-4 ${agentConfig[agentType].color}`} />
            <p className="font-mono text-sm">Chat with {agentConfig[agentType].name}</p>
            <p className="text-xs mt-1">Ask about documents, entities, or reef connections</p>
            
            <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                className="font-mono bg-transparent"
                onClick={() => {
                  setInputValue("What entities have been extracted so far?")
                }}
              >
                <Database className="w-3 h-3 mr-1" />
                List entities
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="font-mono bg-transparent"
                onClick={() => {
                  setInputValue("Search documents for any financial transactions")
                }}
              >
                <FileSearch className="w-3 h-3 mr-1" />
                Search docs
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="font-mono bg-transparent"
                onClick={() => {
                  setInputValue("What connections have been found between entities?")
                }}
              >
                <Link2 className="w-3 h-3 mr-1" />
                Find connections
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="font-mono bg-transparent"
                onClick={() => {
                  setInputValue("Summarize recent agent activity and findings")
                }}
              >
                <Bot className="w-3 h-3 mr-1" />
                Agent summary
              </Button>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const text = getMessageText(msg)
            const toolCalls = getToolCalls(msg)
            
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role !== "user" && (
                  <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-secondary ${agentConfig[agentType].color}`}>
                    <AgentIcon className="w-4 h-4" />
                  </div>
                )}
                
                <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === "user" ? "items-end" : ""}`}>
                  {text && (
                    <div
                      className={`p-3 rounded-lg text-sm font-mono ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/50 text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{text}</p>
                    </div>
                  )}
                  
                  {toolCalls.length > 0 && (
                    <div className="space-y-1">
                      {toolCalls.map((tool: { toolInvocationId: string; toolName: string; state: string }, idx: number) => (
                        <Badge
                          key={tool.toolInvocationId || idx}
                          variant="outline"
                          className="text-xs font-mono bg-accent/10"
                        >
                          {tool.state === "output-available" ? (
                            <CheckCircle className="w-3 h-3 mr-1 text-primary" />
                          ) : (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          )}
                          {tool.toolName}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-primary/20 text-primary">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            )
          })
        )}
        
        {status === "streaming" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-mono">{agentConfig[agentType].name} is thinking...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask ${agentConfig[agentType].name} about the case...`}
            disabled={status === "streaming"}
            className="flex-1 font-mono text-sm"
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || status === "streaming"}
            className="font-mono"
          >
            {status === "streaming" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
