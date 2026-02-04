import { generateText, tool } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { validateEvidencePacket, createValidationLogEntry } from "@/lib/redaction-validator"

const AGENT_MODELS = {
  claude: "anthropic/claude-sonnet-4",
  gpt: "openai/gpt-4o",
  gemini: "google/gemini-2.0-flash-001",
} as const

// Background worker that processes pending documents
export async function POST(req: Request) {
  const { investigationId, agentTypes = ["claude", "gpt", "gemini"] } = await req.json()
  
  const supabase = await createClient()

  // Find pending documents
  const { data: pendingDocs } = await supabase
    .from("documents")
    .select("*")
    .eq("status", "processed")
    .is("investigation_id", investigationId ? investigationId : null)
    .limit(5)

  if (!pendingDocs?.length) {
    return Response.json({ message: "No pending documents to process" })
  }

  const results = []

  for (const doc of pendingDocs) {
    // Pick a random agent type for diversity
    const agentType = agentTypes[Math.floor(Math.random() * agentTypes.length)]
    const model = AGENT_MODELS[agentType as keyof typeof AGENT_MODELS]
    const agentId = `${agentType}-background-${Date.now()}`

    try {
      // Log start of analysis
      await supabase.from("agent_activity").insert({
        agent_id: agentId,
        agent_model: model,
        action_type: "analysis_started",
        description: `Starting analysis of ${doc.filename}`,
        investigation_id: investigationId,
        metadata: { document_id: doc.id },
      })

      const { text, toolCalls } = await generateText({
        model,
        system: `You are an investigative research agent. Analyze the document and extract:
1. All named entities (people, organizations, locations, dates)
2. Key claims and facts with exact citations
3. Connections between entities
4. Anything redacted or suspicious

Use the tools to record your findings.`,
        messages: [
          {
            role: "user",
            content: `Analyze this document:\n\n${doc.ocr_text?.substring(0, 10000)}`,
          },
        ],
        tools: {
          extractEntity: tool({
            description: "Extract an entity from the document",
            inputSchema: z.object({
              name: z.string(),
              entityType: z.enum(["person", "organization", "location", "event", "date"]),
              context: z.string(),
              isRedacted: z.boolean(),
            }),
            execute: async ({ name, entityType, context, isRedacted }) => {
              await supabase.from("entities").upsert({
                name,
                entity_type: entityType,
                is_redacted: isRedacted,
                metadata: { context, source_doc: doc.id },
              }, { onConflict: "name" })
              return { recorded: true, name }
            },
          }),
          recordFinding: tool({
            description: "Record a finding with citation",
            inputSchema: z.object({
              claim: z.string(),
              claimType: z.enum(["observed", "corroborated", "unknown"]),
              confidence: z.number(),
              citation: z.string(),
            }),
            execute: async ({ claim, claimType, confidence, citation }) => {
              // Map lowercase claimType to capitalized for validation
              const claimTypeMap: Record<string, string> = {
                observed: 'Observed',
                corroborated: 'Corroborated',
                unknown: 'Unknown',
              }
              
              const citations = [{ text: citation, document_id: doc.id }]
              
              // Validate evidence against HARD RULES before insertion
              const validationResult = validateEvidencePacket({
                statement: claim,
                claim_type: claimTypeMap[claimType] as 'Observed' | 'Corroborated' | 'Unknown',
                citations: citations as any,
              })

              if (!validationResult.valid) {
                await supabase.from("validation_log").insert(
                  createValidationLogEntry('evidence_packet', 'bg-agent-rejected', validationResult, claim)
                )
                return { 
                  recorded: false, 
                  error: "Rejected by validation rules",
                  violations: validationResult.violations.map(v => v.message)
                }
              }

              await supabase.from("evidence_packets").insert({
                investigation_id: investigationId,
                document_id: doc.id,
                claim,
                claim_type: claimType,
                confidence,
                citations,
                validation_status: validationResult.status,
                validation_notes: validationResult.warnings,
                agent_id: agentId,
                agent_model: model,
              })
              return { recorded: true, claim }
            },
          }),
        },
      })

      // Log completion
      await supabase.from("agent_activity").insert({
        agent_id: agentId,
        agent_model: model,
        action_type: "analysis_complete",
        description: `Completed analysis of ${doc.filename} - ${toolCalls?.length || 0} findings`,
        investigation_id: investigationId,
        metadata: {
          document_id: doc.id,
          findings_count: toolCalls?.length || 0,
        },
      })

      results.push({
        documentId: doc.id,
        agent: agentType,
        success: true,
        findings: toolCalls?.length || 0,
      })
    } catch (error) {
      console.error(`Error processing doc ${doc.id}:`, error)
      
      await supabase.from("agent_activity").insert({
        agent_id: agentId,
        agent_model: model,
        action_type: "analysis_error",
        description: `Failed to analyze ${doc.filename}`,
        investigation_id: investigationId,
        metadata: { document_id: doc.id, error: String(error) },
      })

      results.push({
        documentId: doc.id,
        agent: agentType,
        success: false,
        error: String(error),
      })
    }
  }

  return Response.json({ results })
}
