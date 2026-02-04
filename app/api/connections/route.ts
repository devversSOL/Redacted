import { createClient } from "@/lib/supabase/server"
import { validateConnection, createValidationLogEntry } from "@/lib/redaction-validator"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const investigationId = searchParams.get("investigationId")
  const entityId = searchParams.get("entityId")
  const strength = searchParams.get("strength")
  
  const supabase = await createClient()

  let query = supabase
    .from("connections")
    .select(`
      *,
      source_entity:entities!connections_source_entity_id_fkey(id, name, entity_type, is_redacted),
      target_entity:entities!connections_target_entity_id_fkey(id, name, entity_type, is_redacted)
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  if (investigationId) {
    query = query.eq("investigation_id", investigationId)
  }

  if (entityId) {
    query = query.or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`)
  }

  if (strength) {
    query = query.eq("strength", strength)
  }

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ connections: data })
}

export async function POST(req: Request) {
  const { 
    investigationId,
    sourceEntityId,
    targetEntityId,
    relationshipType,
    relationshipLabel,
    strength,
    direction,
    supportingPacketIds,
    supportingChunkIds,
    firstObserved,
    metadata,
    createdBy
  } = await req.json()
  
  if (!sourceEntityId || !targetEntityId || !relationshipType) {
    return Response.json({ 
      error: "sourceEntityId, targetEntityId, and relationshipType are required" 
    }, { status: 400 })
  }

  if (sourceEntityId === targetEntityId) {
    return Response.json({ error: "Cannot create self-connection" }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch entities to validate the connection
  const { data: entities } = await supabase
    .from("entities")
    .select("id, name, entity_type, is_redacted")
    .in("id", [sourceEntityId, targetEntityId])

  const sourceEntity = entities?.find((e: { id: string }) => e.id === sourceEntityId)
  const targetEntity = entities?.find((e: { id: string }) => e.id === targetEntityId)

  if (!sourceEntity || !targetEntity) {
    return Response.json({ error: "One or both entities not found" }, { status: 404 })
  }

  // Validate connection against redaction rules
  const validationResult = validateConnection(
    { 
      relationship_type: relationshipType, 
      relationship_label: relationshipLabel 
    },
    sourceEntity as any,
    targetEntity as any
  )

  if (!validationResult.valid) {
    // Log the rejection
    await supabase.from("validation_log").insert(
      createValidationLogEntry(
        'connection',
        'attempted',
        validationResult,
        JSON.stringify({ sourceEntityId, targetEntityId, relationshipType, relationshipLabel })
      )
    )

    return Response.json({ 
      error: "Connection rejected by validation rules",
      violations: validationResult.violations 
    }, { status: 400 })
  }

  // Check for existing connection
  const { data: existing } = await supabase
    .from("connections")
    .select("id, occurrence_count")
    .eq("source_entity_id", sourceEntityId)
    .eq("target_entity_id", targetEntityId)
    .eq("relationship_type", relationshipType)
    .single()

  let data, error

  if (existing) {
    // Fetch full existing record to merge arrays
    const { data: fullExisting } = await supabase
      .from("connections")
      .select("supporting_packet_ids, supporting_chunk_ids")
      .eq("id", existing.id)
      .single()

    // Merge new packet IDs with existing (deduplicated)
    const existingPacketIds = fullExisting?.supporting_packet_ids || []
    const newPacketIds = supportingPacketIds || []
    const mergedPacketIds = [...new Set([...existingPacketIds, ...newPacketIds])]

    // Merge new chunk IDs with existing (deduplicated)
    const existingChunkIds = fullExisting?.supporting_chunk_ids || []
    const newChunkIds = supportingChunkIds || []
    const mergedChunkIds = [...new Set([...existingChunkIds, ...newChunkIds])]

    // Update existing connection
    const result = await supabase
      .from("connections")
      .update({
        occurrence_count: existing.occurrence_count + 1,
        last_observed: new Date().toISOString(),
        strength: strength || undefined,
        supporting_packet_ids: mergedPacketIds,
        supporting_chunk_ids: mergedChunkIds,
      })
      .eq("id", existing.id)
      .select()
      .single()
    
    data = result.data
    error = result.error
  } else {
    // Create new connection
    const result = await supabase
      .from("connections")
      .insert({
        investigation_id: investigationId || null,
        source_entity_id: sourceEntityId,
        target_entity_id: targetEntityId,
        relationship_type: relationshipType,
        relationship_label: relationshipLabel || null,
        strength: strength || "unverified",
        direction: direction || "directed",
        supporting_packet_ids: supportingPacketIds || [],
        supporting_chunk_ids: supportingChunkIds || [],
        first_observed: firstObserved || new Date().toISOString(),
        last_observed: new Date().toISOString(),
        occurrence_count: 1,
        metadata: metadata || {},
        created_by: createdBy || null,
      })
      .select()
      .single()
    
    data = result.data
    error = result.error
  }

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Log validation result
  await supabase.from("validation_log").insert(
    createValidationLogEntry('connection', data.id, validationResult)
  )

  // Log activity
  await supabase.from("agent_activity").insert({
    agent_id: createdBy || "system",
    agent_type: "system",
    action_type: "connection_created",
    description: `Connection: ${sourceEntity.name} ${relationshipType} ${targetEntity.name}`,
    investigation_id: investigationId || null,
    metadata: { connection_id: data.id },
  })

  return Response.json({ 
    connection: data,
    validation: {
      status: validationResult.status,
      warnings: validationResult.warnings
    }
  })
}
