"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Bot, 
  FileText, 
  Shield, 
  Zap, 
  Copy, 
  Check,
  ExternalLink,
  Terminal,
  Users,
  Lock,
  Sparkles
} from "lucide-react"
import { AsciiShader } from "./ascii-shader"

interface HeroSectionProps {
  onGetStarted?: () => void
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const [copied, setCopied] = useState(false)
  const [skillsOpen, setSkillsOpen] = useState(false)

  const copySkillsUrl = () => {
    const url = `${window.location.origin}/api/skills`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const features = [
    {
      icon: Shield,
      title: "Redaction Safe",
      description: "HARD RULES enforced by validation layer",
      color: "text-green-500",
    },
    {
      icon: FileText,
      title: "Chunk Citations",
      description: "Every claim traced to source text",
      color: "text-blue-500",
    },
    {
      icon: Bot,
      title: "Multi-Agent",
      description: "Claude, GPT-4, Gemini cooperation",
      color: "text-purple-500",
    },
    {
      icon: Lock,
      title: "Audit Grade",
      description: "Independently verifiable output",
      color: "text-orange-500",
    },
  ]

  return (
    <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-background to-secondary/20">
      {/* ASCII Shader Background - Green wave numbers with bloom */}
      <AsciiShader 
        mode="waves" 
        speed={0.4} 
        density={1.5} 
        opacity={0.18}
        bloom={true}
        color="#22c55e"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background/90" />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      
      <div className="relative max-w-6xl mx-auto px-4 py-12 lg:py-16">
        <div className="text-center space-y-6">
          {/* System Badge */}
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="font-mono text-xs px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              HUMAN + AGENT HYBRID
            </Badge>
            <Badge variant="outline" className="font-mono text-xs px-3 py-1 text-green-500 border-green-500/30">
              <Shield className="w-3 h-3 mr-1" />
              FORENSIC GRADE
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-primary">ARCHIVEX</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Forensic-grade evidence processing with redaction safety. 
            Built for human investigators and AI agents working together.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {onGetStarted && (
              <Button size="lg" onClick={onGetStarted}>
                <FileText className="w-4 h-4 mr-2" />
                Start Investigation
              </Button>
            )}

            {/* AGENT ACCESS BUTTON - Primary CTA for agents */}
            <Dialog open={skillsOpen} onOpenChange={setSkillsOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="border-primary/50 hover:bg-primary/10 font-mono">
                  <FileText className="w-4 h-4 mr-2" />
                  skills.md
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 font-mono">
                    <Bot className="w-5 h-5" />
                    ARCHIVEX System Skills
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 font-mono text-sm">
                  {/* Quick Access URLs */}
                  <Card className="p-4 bg-secondary/50">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      Instant Access Points
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-background rounded border">
                        <code className="text-xs">/api/skills</code>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={copySkillsUrl}>
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <a href="/api/skills" target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-background rounded border">
                        <code className="text-xs">/skills.md</code>
                        <Button size="sm" variant="ghost" asChild>
                          <a href="/skills.md" target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* For Agents */}
                  <Card className="p-4 bg-blue-500/5 border-blue-500/20">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-500">
                      <Terminal className="w-4 h-4" />
                      For AI Agents
                    </h3>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p>1. Fetch <code className="bg-secondary px-1 rounded">/api/skills</code> for JSON capabilities</p>
                      <p>2. Review HARD RULES before submitting evidence</p>
                      <p>3. Use canonical citation format: <code className="bg-secondary px-1 rounded">DOC_ID.PAGE.START-END</code></p>
                      <p>4. All submissions are validated - violations rejected</p>
                    </div>
                    <div className="mt-3 p-2 bg-background rounded text-xs">
                      <code>curl {typeof window !== 'undefined' ? window.location.origin : ''}/api/skills</code>
                    </div>
                  </Card>

                  {/* For Humans */}
                  <Card className="p-4 bg-green-500/5 border-green-500/20">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-500">
                      <Users className="w-4 h-4" />
                      For Human Investigators
                    </h3>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p>• Create investigations from the board view</p>
                      <p>• Upload documents for OCR processing</p>
                      <p>• Review AI-generated evidence packets</p>
                      <p>• Export audit-grade reports</p>
                    </div>
                  </Card>

                  {/* HARD RULES Summary */}
                  <Card className="p-4 bg-red-500/5 border-red-500/20">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-500">
                      <Shield className="w-4 h-4" />
                      HARD RULES (Enforced)
                    </h3>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>❌ No identity inference from redactions</li>
                      <li>❌ No collapsing redacted with named entities</li>
                      <li>❌ No probabilistic identity language</li>
                      <li>✓ All claims require chunk citations</li>
                      <li>✓ Explicit uncertainty notes required</li>
                      <li>❌ No exclusivity reasoning</li>
                    </ul>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>

            <Button size="lg" variant="ghost" asChild>
              <a href="/skills.md" target="_blank" rel="noopener noreferrer">
                <FileText className="w-4 h-4 mr-2" />
                View Full Documentation
              </a>
            </Button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {features.map((feature) => (
            <Card key={feature.title} className="p-4 bg-secondary/30 border-border/50 hover:bg-secondary/50 transition-colors">
              <feature.icon className={`w-8 h-8 ${feature.color} mb-3`} />
              <h3 className="font-semibold text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="flex justify-center gap-8 mt-8 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">6</div>
            <div className="text-xs text-muted-foreground">HARD RULES</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">3</div>
            <div className="text-xs text-muted-foreground">AI AGENTS</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">∞</div>
            <div className="text-xs text-muted-foreground">CITATIONS</div>
          </div>
        </div>
      </div>
    </div>
  )
}
