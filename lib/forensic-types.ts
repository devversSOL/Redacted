/**
 * Forensic Evidence System Types
 * These types support audit-grade evidence processing with verifiable citations
 */

// ============================================================================
// CHUNK SYSTEM - Addressable text segments with precise offsets
// ============================================================================

export interface Chunk {
  id: string
  document_id: string
  page: number
  start_offset: number
  end_offset: number
  text: string
  chunk_index: number
  metadata?: Record<string, unknown>
  created_at: string
}

export interface ChunkReference {
  chunk_id: string
  document_id: string
  page: number
  start_offset: number
  end_offset: number
}

// Canonical citation format: "DOC_ID.PAGE.START-END"
export type CitationString = `${string}.${number}.${number}-${number}`

export interface StructuredCitation {
  document_id: string
  page: number
  start_offset: number
  end_offset: number
  excerpt: string
  chunk_id?: string
}

// ============================================================================
// EVENTS - Temporal and geographic anchors
// ============================================================================

export type TimePrecision = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'exact'
export type LocationType = 'city' | 'country' | 'address' | 'coordinates' | 'unknown'
export type EventType = 'meeting' | 'transaction' | 'travel' | 'communication' | 'filing' | 'unknown'

export interface ForensicEvent {
  id: string
  investigation_id?: string
  time_start?: string
  time_end?: string
  time_precision: TimePrecision
  time_raw?: string
  location?: string
  location_type: LocationType
  description: string
  event_type: EventType
  supporting_chunk_ids: string[]
  confidence: number
  created_by?: string
  created_at: string
}

// ============================================================================
// CONNECTIONS - Entity relationships
// ============================================================================

export type ConnectionStrength = 'confirmed' | 'likely' | 'possible' | 'unverified'
export type ConnectionDirection = 'directed' | 'bidirectional'

export interface Connection {
  id: string
  investigation_id?: string
  source_entity_id: string
  target_entity_id: string
  relationship_type: string
  relationship_label?: string
  strength: ConnectionStrength
  direction: ConnectionDirection
  supporting_packet_ids: string[]
  supporting_chunk_ids: string[]
  first_observed?: string
  last_observed?: string
  occurrence_count: number
  metadata?: Record<string, unknown>
  created_by?: string
  created_at: string
}

// ============================================================================
// EVIDENCE PACKETS - Structured claims with citations
// ============================================================================

export type ClaimType = 'Observed' | 'Corroborated' | 'Unknown'
export type ValidationStatus = 'pending' | 'valid' | 'flagged' | 'rejected'

export interface ForensicEvidencePacket {
  id: string
  investigation_id?: string
  claim_type: ClaimType
  statement: string
  citations: StructuredCitation[]
  supporting_chunk_ids: string[]
  uncertainty_notes: string[]
  validation_status: ValidationStatus
  validation_notes: string[]
  raw_agent_output?: string
  agent_id?: string
  agent_model?: string
  confidence: number
  upvotes: number
  created_at: string
}

// Spec-compliant output format for auditors
export interface AuditableEvidencePacket {
  packet_id: string
  claim_type: ClaimType
  statement: string
  citations: CitationString[]
  citation_excerpts: { citation: CitationString; excerpt: string }[]
  uncertainty_notes: string[]
  validation_status: ValidationStatus
  created_at: string
  created_by: string
}

// ============================================================================
// ENTITIES - With redaction safety
// ============================================================================

export type EntityType = 'person' | 'org' | 'location' | 'event' | 'date' | 'document'

export interface ForensicEntity {
  id: string
  type: EntityType
  name: string
  aliases: string[]
  is_redacted: boolean
  first_seen_chunk_id?: string
  mention_count: number
  confidence: number
  description?: string
  metadata?: Record<string, unknown>
  created_at: string
}

// ============================================================================
// DOCUMENTS - With integrity hashing
// ============================================================================

export interface ForensicDocument {
  id: string
  investigation_id?: string
  filename: string
  source?: string
  content_hash: string
  page_count: number
  ocr_text?: string
  ocr_status: 'pending' | 'processing' | 'processed' | 'analyzed' | 'failed'
  metadata?: Record<string, unknown>
  created_at: string
}

// ============================================================================
// VALIDATION - Rule enforcement
// ============================================================================

export interface ValidationResult {
  valid: boolean
  status: ValidationStatus
  violations: ValidationViolation[]
  warnings: string[]
}

export interface ValidationViolation {
  rule: string
  severity: 'error' | 'warning'
  message: string
  evidence?: string
}

export interface ValidationLogEntry {
  id: string
  target_type: 'evidence_packet' | 'entity' | 'connection'
  target_id: string
  validation_result: 'passed' | 'flagged' | 'rejected'
  rule_violations: string[]
  validator_version: string
  raw_content?: string
  created_at: string
}

// ============================================================================
// REDACTION RULES - Hard constraints from spec
// ============================================================================

export const REDACTION_RULES = {
  // HARD RULES - These cause rejection
  NEVER_IDENTIFY_REDACTED: 'Never identify, infer, suggest, rank, or imply the identity of any redacted entity',
  NEVER_COLLAPSE_ENTITIES: 'Never collapse a redacted entity with a named individual',
  NEVER_PROBABILISTIC_IDENTITY: 'Never use probabilistic or suggestive language regarding identity',
  REQUIRE_CITATIONS: 'All claims must be directly supported by cited chunks',
  NO_IDENTITY_INFERENCE: 'Never use exclusivity reasoning to narrow identity',
  
  // DISALLOWED PATTERNS
  PROHIBITED_PATTERNS: [
    /\b(suggests?|implies?|indicates?|points? to|aligns? with)\b.*\b(identity|identit(y|ies)|who|person|individual)\b/i,
    /\b(likely|probably|possibly|perhaps|maybe|could be|might be)\b.*\b(is|was|were)\b.*\b(the|this|that)\b/i,
    /\bonly (person|one|individual)\b.*\b(present|there|who|capable)\b/i,
    /\bredacted.*\b(is|was|must be|appears to be)\b.*[A-Z][a-z]+/i,
    /\b[A-Z][a-z]+.*\b(is|was|must be)\b.*\bredacted\b/i,
    /\bnarrow(s|ed|ing)?\b.*\b(down|to|candidates?)\b/i,
    /\bprocess of elimination\b/i,
    /\bcandidate(s)?\b.*\bfor\b.*\bredacted\b/i,
  ],
  
  // REQUIRED PATTERNS - Evidence must contain these
  REQUIRED_UNCERTAINTY_MARKERS: [
    'UNKNOWN',
    'REDACTED',
    'uncertainty',
    'unclear',
    'not specified',
    'not stated',
  ],
} as const

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateEvidenceRequest {
  investigation_id?: string
  statement: string
  claim_type: ClaimType
  citations: StructuredCitation[]
  uncertainty_notes: string[]
  agent_id?: string
  agent_model?: string
  raw_output?: string
}

export interface ChunkExtractionResult {
  document_id: string
  chunks: Chunk[]
  page_count: number
  total_characters: number
}

export interface ExportEvidenceRequest {
  investigation_id?: string
  format: 'json' | 'csv'
  include_raw: boolean
}
