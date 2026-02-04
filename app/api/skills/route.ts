import { readFileSync } from "fs"
import { join } from "path"

/**
 * Skills API - Machine-readable capability manifest for AI agents
 * Agents should call this endpoint first to understand system capabilities
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const format = searchParams.get("format") || "json"

  // Core system capabilities
  const skills = {
    system: {
      name: "ARCHIVEX",
      version: "1.0.0",
      purpose: "Forensic-grade evidence processing with redaction safety",
      mode: "Human-Agent Hybrid Cooperation",
    },
    
    endpoints: {
      core: [
        { path: "/api/investigations", methods: ["GET", "POST"], purpose: "List/create investigations" },
        { path: "/api/documents", methods: ["GET", "POST"], purpose: "List/upload documents" },
        { path: "/api/ocr", methods: ["POST"], purpose: "OCR processing with chunk extraction" },
        { path: "/api/evidence", methods: ["GET", "POST"], purpose: "Evidence packets with validation" },
        { path: "/api/entities", methods: ["GET", "POST"], purpose: "Named entities and redacted references" },
        { path: "/api/chunks", methods: ["GET", "POST"], purpose: "Addressable text chunks" },
        { path: "/api/events", methods: ["GET", "POST"], purpose: "Timeline events" },
        { path: "/api/connections", methods: ["GET", "POST"], purpose: "Entity relationships" },
        { path: "/api/export", methods: ["GET", "POST"], purpose: "Audit-grade structured export" },
      ],
      agent: [
        { path: "/api/skills", methods: ["GET"], purpose: "This capability document" },
        { path: "/api/agents/chat", methods: ["POST"], purpose: "Agent conversation interface" },
        { path: "/api/agents/analyze", methods: ["POST"], purpose: "Document analysis" },
        { path: "/api/agents/background", methods: ["POST"], purpose: "Batch document processing" },
      ],
    },

    hard_rules: {
      description: "These rules are ENFORCED by validation. Violations are REJECTED.",
      rules: [
        {
          id: "NO_IDENTITY_INFERENCE",
          rule: "Never infer, suggest, or imply who a redacted person might be",
          forbidden: ["This could be...", "This suggests...", "Aligns with...", "consistent with"],
          required: "Treat [REDACTED] as completely unknown",
        },
        {
          id: "NO_ENTITY_COLLAPSE", 
          rule: "Never treat a redacted entity as the same as a named entity",
          forbidden: ["Merging [REDACTED] with named persons in relationships"],
          required: "Maintain strict separation between redacted and named",
        },
        {
          id: "NO_PROBABILISTIC_IDENTITY",
          rule: "Never use probabilistic language about identity",
          forbidden: ["likely", "probably", "possibly", "may be", "could be", "appears to be"],
          required: "State only what is explicitly documented",
        },
        {
          id: "CITATION_REQUIRED",
          rule: "Every claim must cite source chunks",
          format: "DOC_ID.PAGE.START-END",
          example: "abc123.1.450-520",
        },
        {
          id: "EXPLICIT_UNKNOWNS",
          rule: "Mark uncertain information explicitly",
          required: "Use uncertainty_notes field for gaps",
          forbidden: ["Hiding uncertainty in confident-sounding language"],
        },
        {
          id: "NO_EXCLUSIVITY_REASONING",
          rule: "Never use process of elimination on redacted identities",
          forbidden: ["Only person present", "Must have been", "No one else could"],
          required: "Accept that redacted = unknown",
        },
      ],
    },

    schemas: {
      evidence_packet: {
        investigationId: "uuid",
        claim: "Factual statement from source",
        claimType: "observed | corroborated | unknown",
        confidence: "0.0-1.0",
        citations: [{
          document_id: "uuid",
          page: "number",
          start_offset: "number",
          end_offset: "number",
          excerpt: "Exact quoted text",
        }],
        uncertaintyNotes: ["What is unknown or unclear"],
        supportingChunkIds: ["chunk-uuid"],
      },
      entity: {
        investigationId: "uuid",
        name: "Entity name or [REDACTED]",
        entityType: "person | organization | location | document | event | other",
        isRedacted: "boolean",
        aliases: ["Known aliases"],
        description: "Factual description only",
      },
      connection: {
        investigationId: "uuid",
        sourceEntityId: "uuid",
        targetEntityId: "uuid",
        relationshipType: "works_with | reports_to | located_at | mentioned_in",
        strength: "verified | strong | moderate | weak | unverified",
        supportingPacketIds: ["evidence-uuid"],
      },
      event: {
        investigationId: "uuid",
        timeStart: "ISO timestamp or null",
        timePrecision: "exact | day | week | month | year | unknown",
        description: "What happened",
        eventType: "meeting | transaction | communication | observation | other",
        supportingChunkIds: ["chunk-uuid"],
      },
    },

    validation_statuses: {
      valid: "Passed all HARD RULES",
      flagged: "Minor warnings, review recommended",
      pending: "Not yet validated",
      rejected: "Violated HARD RULES, not stored",
    },

    workflow: {
      description: "Recommended workflow for agents",
      steps: [
        "1. GET /api/skills → Understand capabilities",
        "2. GET /api/investigations → Find or create investigation",
        "3. POST /api/ocr → Upload and process documents",
        "4. GET /api/chunks?documentId=X → Review extracted chunks",
        "5. POST /api/entities → Create entities (respecting redaction rules)",
        "6. POST /api/evidence → Submit evidence packets (with citations)",
        "7. POST /api/connections → Link entities (validation enforced)",
        "8. GET /api/export → Generate audit-grade output",
      ],
    },

    compliance: {
      statement: "All outputs must be verifiable against source documents, compliant with redaction safety rules, and suitable for independent audit review.",
      success_condition: "An independent auditor must be able to reconstruct every statement from source text without interpretation.",
    },
  }

  if (format === "markdown" || format === "md") {
    // Return the raw markdown file
    try {
      const mdPath = join(process.cwd(), "public", "skills.md")
      const markdown = readFileSync(mdPath, "utf-8")
      return new Response(markdown, {
        headers: { "Content-Type": "text/markdown" },
      })
    } catch {
      return new Response("# Skills document not found", {
        status: 404,
        headers: { "Content-Type": "text/markdown" },
      })
    }
  }

  // Default: JSON response
  return Response.json(skills, {
    headers: {
      "X-System-Name": "ARCHIVEX",
      "X-System-Version": "1.0.0",
      "X-Agent-Accessible": "true",
    },
  })
}
