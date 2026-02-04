/**
 * Export API - Produces audit-grade structured output
 * SUCCESS CONDITION: An independent auditor must be able to reconstruct 
 * every statement from source text without interpretation.
 */

import { createClient } from "@/lib/supabase/server"
import type { AuditableEvidencePacket, CitationString } from "@/lib/forensic-types"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const investigationId = searchParams.get("investigationId")
  const format = searchParams.get("format") || "json"
  const includeRaw = searchParams.get("includeRaw") === "true"
  const validationStatus = searchParams.get("validationStatus")
  
  const supabase = await createClient()

  // Fetch evidence packets with related data
  let query = supabase
    .from("evidence_packets")
    .select(`
      *,
      documents:document_id(id, filename, content_hash)
    `)
    .order("created_at", { ascending: true })

  if (investigationId) {
    query = query.eq("investigation_id", investigationId)
  }

  if (validationStatus) {
    query = query.eq("validation_status", validationStatus)
  }

  const { data: packets, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Fetch investigation details if specified
  let investigation = null
  if (investigationId) {
    const { data } = await supabase
      .from("investigations")
      .select("*")
      .eq("id", investigationId)
      .single()
    investigation = data
  }

  // Define packet type for mapping
  interface RawPacket {
    id: string
    claim: string
    claim_type: string
    citations: Array<{
      canonical?: string
      document_id?: string
      page?: number
      start_offset?: number
      end_offset?: number
      offset?: number
      excerpt?: string
      text?: string
    }>
    uncertainty_notes: string[]
    validation_status: string
    created_at: string
    agent_id: string
  }

  // Transform to audit-grade format
  const auditablePackets: AuditableEvidencePacket[] = (packets || []).map((packet: RawPacket) => {
    // Build canonical citation strings
    const citationStrings: CitationString[] = []
    const citationExcerpts: { citation: CitationString; excerpt: string }[] = []

    if (packet.citations && Array.isArray(packet.citations)) {
      for (const citation of packet.citations) {
        if (citation.canonical) {
          citationStrings.push(citation.canonical as CitationString)
          citationExcerpts.push({
            citation: citation.canonical as CitationString,
            excerpt: citation.excerpt || citation.text || "",
          })
        } else if (citation.document_id) {
          // Build citation from available data
          const page = citation.page || 1
          const start = citation.start_offset || citation.offset || 0
          const end = citation.end_offset || start + (citation.text?.length || 100)
          const canonical = `${citation.document_id}.${page}.${start}-${end}` as CitationString
          citationStrings.push(canonical)
          citationExcerpts.push({
            citation: canonical,
            excerpt: citation.excerpt || citation.text || "",
          })
        }
      }
    }

    return {
      packet_id: packet.id,
      claim_type: mapClaimType(packet.claim_type),
      statement: packet.claim,
      citations: citationStrings,
      citation_excerpts: citationExcerpts,
      uncertainty_notes: packet.uncertainty_notes || [],
      validation_status: (packet.validation_status || "pending") as import("@/lib/forensic-types").ValidationStatus,
      created_at: packet.created_at,
      created_by: packet.agent_id || "unknown",
    }
  })

  // Build export metadata
  const exportMetadata = {
    exported_at: new Date().toISOString(),
    investigation_id: investigationId,
    investigation_title: investigation?.title || null,
    total_packets: auditablePackets.length,
    validation_summary: {
      valid: auditablePackets.filter(p => p.validation_status === "valid").length,
      flagged: auditablePackets.filter(p => p.validation_status === "flagged").length,
      pending: auditablePackets.filter(p => p.validation_status === "pending").length,
      rejected: auditablePackets.filter(p => p.validation_status === "rejected").length,
    },
    format_version: "1.0",
    spec_compliance: "FORENSIC_EVIDENCE_SYSTEM_V1",
  }

  if (format === "csv") {
    // CSV export
    const csvRows = [
      ["packet_id", "claim_type", "statement", "citations", "uncertainty_notes", "validation_status", "created_at", "created_by"].join(","),
      ...auditablePackets.map(p => [
        p.packet_id,
        p.claim_type,
        `"${p.statement.replace(/"/g, '""')}"`,
        `"${p.citations.join("; ")}"`,
        `"${p.uncertainty_notes.join("; ").replace(/"/g, '""')}"`,
        p.validation_status,
        p.created_at,
        p.created_by,
      ].join(","))
    ]

    return new Response(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="evidence-export-${investigationId || "all"}-${Date.now()}.csv"`,
      },
    })
  }

  // JSON export (default)
  const exportData = {
    metadata: exportMetadata,
    evidence_packets: auditablePackets,
    ...(includeRaw ? { raw_packets: packets } : {}),
  }

  return Response.json(exportData, {
    headers: {
      "Content-Disposition": `attachment; filename="evidence-export-${investigationId || "all"}-${Date.now()}.json"`,
    },
  })
}

// Map internal claim types to spec-compliant types
function mapClaimType(claimType: string): "Observed" | "Corroborated" | "Unknown" {
  const normalized = (claimType || "").toLowerCase()
  if (normalized === "observed") return "Observed"
  if (normalized === "corroborated") return "Corroborated"
  return "Unknown"
}

// POST endpoint for bulk validation check
export async function POST(req: Request) {
  const { investigationId, revalidate } = await req.json()
  
  if (!revalidate) {
    return Response.json({ error: "Use GET for exports, POST is for revalidation" }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch all evidence packets for revalidation
  let query = supabase
    .from("evidence_packets")
    .select("*")

  if (investigationId) {
    query = query.eq("investigation_id", investigationId)
  }

  const { data: packets, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Import validator dynamically to avoid circular deps
  const { validateEvidencePacket, createValidationLogEntry } = await import("@/lib/redaction-validator")

  const results = {
    total: packets?.length || 0,
    revalidated: 0,
    changed: 0,
    details: [] as { id: string; oldStatus: string; newStatus: string }[],
  }

  for (const packet of packets || []) {
    const validationResult = validateEvidencePacket({
      statement: packet.claim,
      claim_type: packet.claim_type,
      citations: packet.citations,
      uncertainty_notes: packet.uncertainty_notes,
      raw_agent_output: packet.raw_agent_output,
    })

    const oldStatus = packet.validation_status || "pending"
    const newStatus = validationResult.status

    if (oldStatus !== newStatus) {
      // Update the packet
      await supabase
        .from("evidence_packets")
        .update({
          validation_status: newStatus,
          validation_notes: validationResult.warnings,
        })
        .eq("id", packet.id)

      // Log the revalidation
      await supabase.from("validation_log").insert(
        createValidationLogEntry('evidence_packet', packet.id, validationResult, `Revalidated: ${oldStatus} -> ${newStatus}`)
      )

      results.changed++
      results.details.push({ id: packet.id, oldStatus, newStatus })
    }

    results.revalidated++
  }

  return Response.json(results)
}
