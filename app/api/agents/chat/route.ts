import { streamText, tool, convertToModelMessages } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

function getModel(agentType: string, apiKey: string | null) {
  // BYOK: Create provider with user key if available, otherwise fall back to env
  switch (agentType) {
    case "claude": {
      const provider = createAnthropic({ apiKey: apiKey || undefined })
      return provider("claude-sonnet-4-20250514")
    }
    case "gpt": {
      const provider = createOpenAI({ apiKey: apiKey || undefined })
      return provider("gpt-4o")
    }
    case "gemini": {
      const provider = createGoogleGenerativeAI({ apiKey: apiKey || undefined })
      return provider("gemini-2.0-flash-001")
    }
    default: {
      const provider = createAnthropic({ apiKey: apiKey || undefined })
      return provider("claude-sonnet-4-20250514")
    }
  }
}

export async function POST(req: Request) {
  // BYOK: Get API key from request header
  const userApiKey = req.headers.get("X-API-Key")
  
  const { messages, investigationId, agentType = "claude" } = await req.json()
  
  const supabase = await createClient()
  const model = getModel(agentType, userApiKey)
  const agentId = `${agentType}-chat-${Date.now()}`

  // Fetch investigation context
  let investigationContext = ""
  if (investigationId) {
    const { data: investigation } = await supabase
      .from("investigations")
      .select("*, documents(*), evidence_packets(*)")
      .eq("id", investigationId)
      .single()
    
    if (investigation) {
      investigationContext = `
Current Investigation: ${investigation.title}
Description: ${investigation.description}
Documents: ${investigation.documents?.length || 0}
Evidence Packets: ${investigation.evidence_packets?.length || 0}

Recent Evidence:
${investigation.evidence_packets?.slice(0, 5).map((e: { claim: string; claim_type: string }) => `- [${e.claim_type}] ${e.claim}`).join("\n") || "None yet"}
`
    }
  }

  // Fetch all entities for reference
  const { data: entities } = await supabase
    .from("entities")
    .select("name, entity_type, aliases, is_redacted")
    .limit(200)

  const result = streamText({
    model,
    system: `You are an AI research agent working on the REDACTED platform - a forensic-grade collaborative investigation system.

${investigationContext}

Known Entities:
${entities?.map(e => `- ${e.name} (${e.entity_type})${e.is_redacted ? " [REDACTED]" : ""}`).join("\n") || "None yet"}

Your capabilities:
1. Search and analyze documents in the database
2. Create evidence packets with chunk-based citations
3. Identify and track entities
4. Find connections between entities
5. Collaborate with other agents (Claude, GPT, Gemini)

═══════════════════════════════════════════════════════════════
                    HARD RULES - MANDATORY
   Violations will be REJECTED by the validation layer.
═══════════════════════════════════════════════════════════════

RULE 1: NO IDENTITY INFERENCE
- NEVER infer, suggest, or imply who a redacted person might be
- FORBIDDEN phrases: "This could be...", "This suggests...", "consistent with...", "aligns with..."
- Treat [REDACTED] as completely unknown - not a puzzle to solve

RULE 2: NO ENTITY COLLAPSE
- NEVER treat a redacted entity as the same as a named entity
- NEVER merge [REDACTED] with a named person in any relationship
- Keep redacted and named entities strictly separate

RULE 3: NO PROBABILISTIC IDENTITY LANGUAGE
- FORBIDDEN when referring to identity: "likely", "probably", "possibly", "may be", "could be", "appears to be"
- State ONLY what is explicitly documented in source text

RULE 4: CITATION REQUIRED
- Every claim MUST cite source chunks
- Citation format: DOC_ID.PAGE.START-END
- Example: "abc123.1.450-520"
- Include the exact excerpt text

RULE 5: EXPLICIT UNKNOWNS
- Mark uncertain information explicitly in uncertainty_notes
- Never hide uncertainty in confident-sounding language
- If something is unknown, say "UNKNOWN" explicitly

RULE 6: NO EXCLUSIVITY REASONING
- FORBIDDEN: "Only person present", "Must have been", "No one else could"
- Never use process of elimination on redacted identities
- Accept that redacted = unknown, period

═══════════════════════════════════════════════════════════════

SUCCESS CONDITION: An independent auditor must be able to reconstruct 
every statement from source text without interpretation.

Use tools to record findings in the database. All evidence packets will
be validated before storage - violations will be rejected.`,
    messages: await convertToModelMessages(messages),
    tools: {
      searchDocuments: tool({
        description: "Search through processed documents for relevant text",
        inputSchema: z.object({
          query: z.string().describe("Search query"),
        }),
        execute: async ({ query }) => {
          const { data } = await supabase
            .from("documents")
            .select("id, filename, ocr_text")
            .textSearch("ocr_text", query)
            .limit(5)
          
          return {
            results: data?.map(d => ({
              id: d.id,
              filename: d.filename,
              snippet: d.ocr_text?.substring(0, 500) + "...",
            })) || [],
          }
        },
      }),
      getDocument: tool({
        description: "Get full text of a specific document",
        inputSchema: z.object({
          documentId: z.string().describe("Document UUID"),
        }),
        execute: async ({ documentId }) => {
          const { data } = await supabase
            .from("documents")
            .select("*")
            .eq("id", documentId)
            .single()
          
          return data || { error: "Document not found" }
        },
      }),
      createEvidence: tool({
        description: "Create an evidence packet with a claim",
        inputSchema: z.object({
          claim: z.string(),
          claimType: z.enum(["observed", "corroborated", "unknown"]),
          confidence: z.number().min(0).max(1),
          citationText: z.string(),
          documentId: z.string().nullable(),
          uncertaintyNotes: z.array(z.string()),
        }),
        execute: async ({ claim, claimType, confidence, citationText, documentId, uncertaintyNotes }) => {
          const { data, error } = await supabase
            .from("evidence_packets")
            .insert({
              investigation_id: investigationId,
              document_id: documentId,
              claim,
              claim_type: claimType,
              confidence,
              citations: [{ text: citationText, document_id: documentId }],
              uncertainty_notes: uncertaintyNotes,
              agent_id: agentId,
              agent_model: model,
            })
            .select()
            .single()
          
          return { success: !error, evidence: data }
        },
      }),
      findEntity: tool({
        description: "Search for an entity in the database",
        inputSchema: z.object({
          name: z.string(),
        }),
        execute: async ({ name }) => {
          const { data } = await supabase
            .from("entities")
            .select("*")
            .ilike("name", `%${name}%`)
            .limit(10)
          
          return { entities: data || [] }
        },
      }),
      listRecentActivity: tool({
        description: "Get recent agent activity for the investigation",
        inputSchema: z.object({
          limit: z.number().default(10),
        }),
        execute: async ({ limit }) => {
          const { data } = await supabase
            .from("agent_activity")
            .select("*")
            .eq("investigation_id", investigationId)
            .order("created_at", { ascending: false })
            .limit(limit)
          
          return { activity: data || [] }
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
