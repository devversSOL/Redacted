"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Network,
  User,
  Building2,
  MapPin,
  FileText,
  Calendar,
  HelpCircle,
  ArrowRight,
  ArrowLeftRight,
  RefreshCw,
  Shield,
  AlertTriangle,
  Eye,
  EyeOff
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Entity {
  id: string
  name: string
  entity_type: string
  is_redacted: boolean
}

interface Connection {
  id: string
  investigation_id: string | null
  source_entity_id: string
  target_entity_id: string
  relationship_type: string
  relationship_label: string | null
  strength: string
  direction: string
  occurrence_count: number
  source_entity?: Entity
  target_entity?: Entity
  created_at: string
}

interface ConnectionGraphProps {
  investigationId?: string
}

export function ConnectionGraph({ investigationId }: ConnectionGraphProps) {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  const [showRedacted, setShowRedacted] = useState(true)
  const [filterStrength, setFilterStrength] = useState<string | null>(null)

  const { data, error, isLoading, mutate } = useSWR<{ connections: Connection[] }>(
    investigationId 
      ? `/api/connections?investigationId=${investigationId}` 
      : "/api/connections",
    fetcher,
    { refreshInterval: 10000 }
  )

  const connections = data?.connections || []

  // Extract unique entities from connections
  const entities = useMemo(() => {
    const entityMap = new Map<string, Entity>()
    
    connections.forEach(conn => {
      if (conn.source_entity) {
        entityMap.set(conn.source_entity.id, conn.source_entity)
      }
      if (conn.target_entity) {
        entityMap.set(conn.target_entity.id, conn.target_entity)
      }
    })
    
    return Array.from(entityMap.values())
  }, [connections])

  // Filter connections based on settings
  const filteredConnections = useMemo(() => {
    return connections.filter(conn => {
      // Filter by redacted visibility
      if (!showRedacted) {
        if (conn.source_entity?.is_redacted || conn.target_entity?.is_redacted) {
          return false
        }
      }
      
      // Filter by strength
      if (filterStrength && conn.strength !== filterStrength) {
        return false
      }
      
      // Filter by selected entity
      if (selectedEntity) {
        if (conn.source_entity_id !== selectedEntity && conn.target_entity_id !== selectedEntity) {
          return false
        }
      }
      
      return true
    })
  }, [connections, showRedacted, filterStrength, selectedEntity])

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "person": return User
      case "organization": return Building2
      case "location": return MapPin
      case "document": return FileText
      case "event": return Calendar
      default: return HelpCircle
    }
  }

  const strengthColors: Record<string, string> = {
    verified: "bg-primary/10 text-foreground border-border/30",
    strong: "bg-muted/10 text-muted-foreground border-blue-500/30",
    moderate: "bg-muted/10 text-muted-foreground border-yellow-500/30",
    weak: "bg-muted/10 text-muted-foreground border-border/30",
    unverified: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading connections...
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-foreground">
          Failed to load connection graph
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-semibold flex items-center gap-2">
          <Network className="w-4 h-4" />
          Entity Connections
          <Badge variant="outline" className="font-mono text-xs">
            {filteredConnections.length} connections
          </Badge>
        </h3>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={showRedacted ? "default" : "ghost"}
            onClick={() => setShowRedacted(!showRedacted)}
            className="h-7 text-xs"
          >
            {showRedacted ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
            {showRedacted ? "Showing" : "Hiding"} Redacted
          </Button>
          
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={filterStrength === null ? "default" : "ghost"}
              onClick={() => setFilterStrength(null)}
              className="h-7 text-xs"
            >
              All
            </Button>
            {["verified", "strong", "weak"].map(s => (
              <Button
                key={s}
                size="sm"
                variant={filterStrength === s ? "default" : "ghost"}
                onClick={() => setFilterStrength(s)}
                className="h-7 text-xs"
              >
                {s}
              </Button>
            ))}
          </div>
          
          <Button size="sm" variant="ghost" onClick={() => mutate()}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Entity chips for filtering */}
      {entities.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border">
          <span className="text-xs text-muted-foreground self-center">Filter by entity:</span>
          <Button
            size="sm"
            variant={selectedEntity === null ? "default" : "ghost"}
            onClick={() => setSelectedEntity(null)}
            className="h-6 text-xs"
          >
            All
          </Button>
          {entities.slice(0, 10).map(entity => {
            const Icon = getEntityIcon(entity.entity_type)
            return (
              <Button
                key={entity.id}
                size="sm"
                variant={selectedEntity === entity.id ? "default" : "outline"}
                onClick={() => setSelectedEntity(entity.id === selectedEntity ? null : entity.id)}
                className={`h-6 text-xs ${entity.is_redacted ? 'border-dashed' : ''}`}
              >
                <Icon className="w-3 h-3 mr-1" />
                {entity.is_redacted ? "[REDACTED]" : entity.name.substring(0, 15)}
              </Button>
            )
          })}
        </div>
      )}

      {filteredConnections.length === 0 ? (
        <div className="text-center text-muted-foreground py-8 text-sm">
          No connections found
          {selectedEntity && " for selected entity"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConnections.map(conn => {
            const SourceIcon = getEntityIcon(conn.source_entity?.entity_type || "unknown")
            const TargetIcon = getEntityIcon(conn.target_entity?.entity_type || "unknown")
            const hasRedacted = conn.source_entity?.is_redacted || conn.target_entity?.is_redacted
            
            return (
              <div 
                key={conn.id}
                className={`p-3 rounded-lg border ${hasRedacted ? 'border-dashed border-yellow-500/30 bg-muted/5' : 'border-border bg-secondary/30'}`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Source Entity */}
                  <div 
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      conn.source_entity?.is_redacted 
                        ? 'bg-muted/20 text-muted-foreground' 
                        : 'bg-primary/10 text-primary'
                    }`}
                    onClick={() => setSelectedEntity(conn.source_entity_id)}
                  >
                    <SourceIcon className="w-3 h-3" />
                    {conn.source_entity?.is_redacted ? (
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        [REDACTED]
                      </span>
                    ) : (
                      conn.source_entity?.name || "Unknown"
                    )}
                  </div>

                  {/* Relationship */}
                  <div className="flex items-center gap-1">
                    {conn.direction === "bidirectional" ? (
                      <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-mono ${strengthColors[conn.strength] || strengthColors.unverified}`}
                    >
                      {conn.relationship_type}
                    </Badge>
                  </div>

                  {/* Target Entity */}
                  <div 
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      conn.target_entity?.is_redacted 
                        ? 'bg-muted/20 text-muted-foreground' 
                        : 'bg-primary/10 text-primary'
                    }`}
                    onClick={() => setSelectedEntity(conn.target_entity_id)}
                  >
                    <TargetIcon className="w-3 h-3" />
                    {conn.target_entity?.is_redacted ? (
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        [REDACTED]
                      </span>
                    ) : (
                      conn.target_entity?.name || "Unknown"
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                    {conn.occurrence_count > 1 && (
                      <Badge variant="outline" className="text-xs">
                        ×{conn.occurrence_count}
                      </Badge>
                    )}
                    <span className="font-mono">
                      {conn.strength}
                    </span>
                  </div>
                </div>

                {/* Relationship label if exists */}
                {conn.relationship_label && (
                  <div className="mt-2 text-xs text-muted-foreground italic pl-4 border-l-2 border-border">
                    {conn.relationship_label}
                  </div>
                )}

                {/* Redaction warning */}
                {hasRedacted && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <AlertTriangle className="w-3 h-3" />
                    Contains redacted entity - identity unknown
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
