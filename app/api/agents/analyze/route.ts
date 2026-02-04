import { streamText, tool } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { validateEvidencePacket, createValidationLogEntry } from "@/lib/redaction-validator"

function getModel(agentType: string, apiKey: string | null) {
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
  const userApiKey = req.headers.get("X-API-Key")
  const { documentId, investigationId, agentType = "claude" } = await req.json()
  
  const supabase = await createClient()
  
  // Fetch document
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single()

  if (docError || !doc) {
    return Response.json({ error: "Document not found" }, { status: 404 })
  }

  // Fetch existing entities for context
  const { data: existingEntities } = await supabase
    .from("entities")
    .select("name, entity_type, aliases")
    .limit(100)

  const model = getModel(agentType, userApiKey)
  const agentId = `${agentType}-analyst-${Date.now()}`

  const result = streamText({
    model,
    system: `You are an investigative research agent analyzing archived documents. Your role is to:

1. Extract and identify entities (people, organizations, locations, dates, events)
2. Find connections between entities
3. Note any redacted information with placeholder IDs like REDACTED_0x001
4. Cite specific passages from the document
5. Flag uncertain claims with confidence levels

IMPORTANT RULES:
- Never speculate on redacted identities
- Always cite exact text passages for claims
- Mark confidence as "observed" (direct quote), "corroborated" (matches other sources), or "unknown" (inference)
- Use existing entity names when they match: ${existingEntities?.map(e => e.name).join(", ")}

Respond with structured findings using the available tools.`,
    messages: [
      {
        role: "user",
        content: `Analyze this document and extract all relevant information:\n\n${doc.ocr_text}`,
      },
    ],
    tools: {
      extractEntity: tool({
        description: "Extract an entity (person, organization, location, event) from the document",
        inputSchema: z.object({
          name: z.string().describe("Entity name or REDACTED_0x### for redacted names"),
          entityType: z.enum(["person", "organization", "location", "event", "date", "document"]),
          aliases: z.array(z.string()).describe("Alternative names or references"),
          context: z.string().describe("Context from document where entity appears"),
          isRedacted: z.boolean().describe("Whether the name is redacted in original"),
        }),
        execute: async ({ name, entityType, aliases, context, isRedacted }) => {
          const { data, error } = await supabase
            .from("entities")
            .upsert({
              name,
              entity_type: entityType,
              aliases,
              is_redacted: isRedacted,
              metadata: { first_seen_in: documentId, context },
            }, { onConflict: "name" })
            .select()
            .single()
          
          return { success: !error, entity: data }
        },
      }),
      createEvidence: tool({
        description: "Create an evidence packet with a claim and citation",
        inputSchema: z.object({
          claim: z.string().describe("The factual claim being made"),
          claimType: z.enum(["observed", "corroborated", "unknown"]),
          confidence: z.number().min(0).max(1).describe("Confidence score 0-1"),
          citationText: z.string().describe("Exact quote from document"),
          citationOffset: z.number().describe("Approximate character offset in document"),
          uncertaintyNotes: z.array(z.string()).describe("Any caveats or uncertainties"),
        }),
        execute: async ({ claim, claimType, confidence, citationText, citationOffset, uncertaintyNotes }) => {
          // Validate evidence against HARD RULES before insertion
          const citations = [{ text: citationText, offset: citationOffset, document_id: documentId }]
          
          // Map lowercase claimType to capitalized for validation
          const claimTypeMap: Record<string, string> = {
            observed: 'Observed',
            corroborated: 'Corroborated', 
            unknown: 'Unknown',
          }
          
          const validationResult = validateEvidencePacket({
            statement: claim,
            claim_type: claimTypeMap[claimType] as 'Observed' | 'Corroborated' | 'Unknown',
            citations: citations as any, // Partial citations - validation only checks document_id
            uncertainty_notes: uncertaintyNotes,
          })

          if (!validationResult.valid) {
            // Log rejection and return error to agent
            await supabase.from("validation_log").insert(
              createValidationLogEntry('evidence_packet', 'agent-rejected', validationResult, claim)
            )
            return { 
              success: false, 
              error: "Evidence rejected by validation rules",
              violations: validationResult.violations.map(v => v.message)
            }
          }

          const { data, error } = await supabase
            .from("evidence_packets")
            .insert({
              investigation_id: investigationId,
              document_id: documentId,
              claim,
              claim_type: claimType,
              confidence,
              citations,
              uncertainty_notes: uncertaintyNotes,
              validation_status: validationResult.status,
              validation_notes: validationResult.warnings, // warnings is already string[]
              agent_id: agentId,
              agent_model: model,
            })
            .select()
            .single()

          if (!error) {
            await supabase.from("validation_log").insert(
              createValidationLogEntry('evidence_packet', data.id, validationResult, claim)
            )
          }
          
          return { success: !error, evidence: data }
        },
      }),
      logConnection: tool({
        description: "Log a connection between two entities",
        inputSchema: z.object({
          entity1Name: z.string(),
          entity2Name: z.string(),
          relationshipType: z.string().describe("Type of relationship (e.g., 'met with', 'employed by', 'traveled to')"),
          evidence: z.string().describe("Supporting text from document"),
        }),
        execute: async ({ entity1Name, entity2Name, relationshipType, evidence }) => {
          // This would typically update a connections table
          await supabase.from("agent_activity").insert({
            agent_id: agentId,
            agent_model: model,
            action_type: "connection_found",
            description: `${entity1Name} ${relationshipType} ${entity2Name}`,
            investigation_id: investigationId,
            metadata: { entity1: entity1Name, entity2: entity2Name, relationship: relationshipType, evidence },
          })
          
          return { success: true, connection: { entity1Name, entity2Name, relationshipType } }
        },
      }),
    },
    onFinish: async ({ text, toolCalls }) => {
      // Log completion
      await supabase.from("agent_activity").insert({
        agent_id: agentId,
        agent_model: model,
        action_type: "analysis_complete",
        description: `Completed analysis of document ${doc.filename}`,
        investigation_id: investigationId,
        metadata: {
          document_id: documentId,
          tool_calls: toolCalls?.length || 0,
        },
      })
    },
  })

  return result.toUIMessageStreamResponse()
}
