"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Calendar,
  Clock,
  MapPin,
  FileText,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface TimelineEvent {
  id: string
  investigation_id: string | null
  time_start: string | null
  time_end: string | null
  time_precision: string
  time_raw: string | null
  location: string | null
  location_type: string
  description: string
  event_type: string
  supporting_chunk_ids: string[]
  confidence: number
  created_at: string
  created_by: string | null
}

interface TimelineViewProps {
  investigationId?: string
}

export function TimelineView({ investigationId }: TimelineViewProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [filterType, setFilterType] = useState<string | null>(null)

  const { data, error, isLoading, mutate } = useSWR<{ events: TimelineEvent[] }>(
    investigationId 
      ? `/api/events?investigationId=${investigationId}` 
      : "/api/events",
    fetcher,
    { refreshInterval: 10000 }
  )

  const events = data?.events || []

  const eventTypes = [...new Set(events.map(e => e.event_type))]
  const filteredEvents = filterType 
    ? events.filter(e => e.event_type === filterType)
    : events

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedEvents(newExpanded)
  }

  const formatTime = (event: TimelineEvent): string => {
    if (!event.time_start) return "Unknown time"
    
    const date = new Date(event.time_start)
    switch (event.time_precision) {
      case "exact":
        return date.toLocaleString()
      case "day":
        return date.toLocaleDateString()
      case "week":
        return `Week of ${date.toLocaleDateString()}`
      case "month":
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
      case "year":
        return date.getFullYear().toString()
      default:
        return event.time_raw || date.toLocaleDateString()
    }
  }

  const eventTypeColors: Record<string, string> = {
    meeting: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    transaction: "bg-green-500/10 text-green-500 border-green-500/30",
    communication: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    observation: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    other: "bg-gray-500/10 text-gray-500 border-gray-500/30",
    unknown: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading timeline...
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          Failed to load timeline events
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Timeline
          <Badge variant="outline" className="font-mono text-xs">
            {filteredEvents.length} events
          </Badge>
        </h3>
        
        <div className="flex items-center gap-2">
          {eventTypes.length > 1 && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={filterType === null ? "default" : "ghost"}
                onClick={() => setFilterType(null)}
                className="h-7 text-xs"
              >
                All
              </Button>
              {eventTypes.slice(0, 3).map(type => (
                <Button
                  key={type}
                  size="sm"
                  variant={filterType === type ? "default" : "ghost"}
                  onClick={() => setFilterType(type)}
                  className="h-7 text-xs"
                >
                  {type}
                </Button>
              ))}
            </div>
          )}
          <Button size="sm" variant="ghost" onClick={() => mutate()}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center text-muted-foreground py-8 text-sm">
          No events recorded yet
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          
          <div className="space-y-4">
            {filteredEvents.map((event, index) => (
              <div key={event.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 bg-background ${
                  event.confidence > 0.7 ? 'border-primary' : 'border-muted-foreground'
                }`} />
                
                <Card 
                  className={`p-3 cursor-pointer transition-colors hover:bg-secondary/50 ${
                    expandedEvents.has(event.id) ? 'bg-secondary/30' : ''
                  }`}
                  onClick={() => toggleExpand(event.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-mono ${eventTypeColors[event.event_type] || eventTypeColors.unknown}`}
                        >
                          {event.event_type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(event)}
                        </span>
                        {event.location && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                      
                      <p className={`text-sm ${expandedEvents.has(event.id) ? '' : 'line-clamp-2'}`}>
                        {event.description}
                      </p>
                      
                      {expandedEvents.has(event.id) && (
                        <div className="mt-3 space-y-2">
                          {event.time_raw && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-semibold">Raw time reference:</span> "{event.time_raw}"
                            </div>
                          )}
                          
                          {event.supporting_chunk_ids && event.supporting_chunk_ids.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {event.supporting_chunk_ids.map((chunkId, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs font-mono">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {chunkId.substring(0, 8)}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Confidence: {Math.round(event.confidence * 100)}%</span>
                            <span>•</span>
                            <span>Precision: {event.time_precision}</span>
                            {event.created_by && (
                              <>
                                <span>•</span>
                                <span>By: {event.created_by}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0">
                      {expandedEvents.has(event.id) ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
