import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const investigationId = searchParams.get("investigationId")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const eventType = searchParams.get("eventType")
  
  const supabase = await createClient()

  let query = supabase
    .from("events")
    .select("*")
    .order("time_start", { ascending: true })
    .limit(100)

  if (investigationId) {
    query = query.eq("investigation_id", investigationId)
  }

  if (startDate) {
    query = query.gte("time_start", startDate)
  }

  if (endDate) {
    query = query.lte("time_start", endDate)
  }

  if (eventType) {
    query = query.eq("event_type", eventType)
  }

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ events: data })
}

export async function POST(req: Request) {
  const { 
    investigationId,
    timeStart,
    timeEnd,
    timePrecision,
    timeRaw,
    location,
    locationType,
    description,
    eventType,
    supportingChunkIds,
    confidence,
    createdBy
  } = await req.json()
  
  if (!description) {
    return Response.json({ error: "description is required" }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("events")
    .insert({
      investigation_id: investigationId || null,
      time_start: timeStart || null,
      time_end: timeEnd || null,
      time_precision: timePrecision || "day",
      time_raw: timeRaw || null,
      location: location || null,
      location_type: locationType || "unknown",
      description,
      event_type: eventType || "unknown",
      supporting_chunk_ids: supportingChunkIds || [],
      confidence: confidence || 0.5,
      created_by: createdBy || null,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Log activity
  await supabase.from("agent_activity").insert({
    agent_id: createdBy || "system",
    agent_type: "system",
    action_type: "event_created",
    description: `Event created: ${description.substring(0, 100)}`,
    investigation_id: investigationId || null,
    metadata: { event_id: data.id },
  })

  return Response.json({ event: data })
}
