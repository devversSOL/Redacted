import { createClient } from "@/lib/supabase/server"
import { validateEvidencePacket, createValidationLogEntry } from "@/lib/redaction-validator"
import { formatCitation } from "@/lib/chunk-extractor"
import { withRateLimit } from "@/lib/rate-limiter"
import { resolveMoltbookIdentity } from "@/lib/moltbook"
import type { StructuredCitation } from "@/lib/forensic-types"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const investigationId = searchParams.get("investigationId")
  
  const supabase = await createClient()

  let query = supabase
    .from("evidence_packets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  if (investigationId) {
    query = query.eq("investigation_id", investigationId)
  }

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ evidence: data })
}

export async function POST(req: Request) {
  // Resolve identity for rate limiting tier
  const identity = await resolveMoltbookIdentity(req)
  const isVerified = identity.status === "verified"
  const agentIdFromIdentity = identity.status === "verified" ? identity.agent?.id : undefined

  // Apply rate limiting
  const rateLimit = await withRateLimit(req, 'evidence_create', {
    isVerified,
    agentId: agentIdFromIdentity,
  })
  if (!rateLimit.allowed) return rateLimit.response

  const { 
    investigationId, 
    claim, 
    claimType, 
    confidence, 
    citations, 
    uncertaintyNotes,
    agentId,
    agentModel,
    rawOutput,
    supportingChunkIds
  } = await req.json()
  
  const supabase = await createClient()

  // Format citations with canonical string format if they have offset info
  const formattedCitations = (citations || []).map((c: StructuredCitation) => ({
    ...c,
    canonical: c.page && c.start_offset && c.end_offset 
      ? formatCitation(c) 
      : null
  }))

  // Validate the evidence packet against redaction rules
  const validationResult = validateEvidencePacket({
    statement: claim,
    claim_type: claimType || "Unknown",
    citations: formattedCitations,
    uncertainty_notes: uncertaintyNotes || [],
    raw_agent_output: rawOutput,
  })

  // Determine validation status - reject hard violations
  if (!validationResult.valid) {
    // Log the rejection
    await supabase.from("validation_log").insert(
      createValidationLogEntry(
        'evidence_packet',
        'rejected-pre-insert',
        validationResult,
        JSON.stringify({ claim, citations, rawOutput })
      )
    )

    return Response.json({ 
      error: "Evidence packet rejected by validation rules",
      validation: {
        status: validationResult.status,
        violations: validationResult.violations,
        warnings: validationResult.warnings,
      }
    }, { status: 400 })
  }

  // Insert with validation status
  const { data, error } = await supabase
    .from("evidence_packets")
    .insert({
      investigation_id: investigationId || null,
      claim,
      claim_type: claimType || "unknown",
      confidence: confidence || 0.3,
      citations: formattedCitations,
      uncertainty_notes: uncertaintyNotes || [],
      supporting_chunk_ids: supportingChunkIds || [],
      validation_status: validationResult.status,
      validation_notes: validationResult.warnings,
      raw_agent_output: rawOutput || null,
      agent_id: agentId || "human-contributor",
      agent_model: agentModel || null,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Log successful validation
  await supabase.from("validation_log").insert(
    createValidationLogEntry('evidence_packet', data.id, validationResult, claim)
  )

  return Response.json({ 
    evidence: data,
    validation: {
      status: validationResult.status,
      warnings: validationResult.warnings,
    }
  })
}
