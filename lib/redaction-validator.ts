/**
 * Redaction Rules Validation Layer
 * Enforces HARD RULES before any evidence is stored
 * 
 * FAILURE CONDITION: Any output that enables identity inference or attribution from redacted material.
 */

import type { 
  ValidationResult, 
  ValidationViolation, 
  ValidationStatus,
  ForensicEvidencePacket,
  ForensicEntity,
  Connection 
} from './forensic-types'
import { REDACTION_RULES } from './forensic-types'

const VALIDATOR_VERSION = '1.0.0'

// ============================================================================
// PROHIBITED LANGUAGE PATTERNS
// ============================================================================

const IDENTITY_INFERENCE_PATTERNS: { pattern: RegExp; rule: string; severity: 'error' | 'warning' }[] = [
  // Direct identity suggestions
  {
    pattern: /\b(suggests?|implies?|indicates?|points?\s+to)\b.{0,50}\b(identity|who|person|individual)\b/i,
    rule: REDACTION_RULES.NEVER_IDENTIFY_REDACTED,
    severity: 'error',
  },
  // Probabilistic identity language
  {
    pattern: /\b(likely|probably|possibly|perhaps|maybe)\b.{0,30}\b(is|was|were|be)\b.{0,30}\b(the|this|that)\b/i,
    rule: REDACTION_RULES.NEVER_PROBABILISTIC_IDENTITY,
    severity: 'error',
  },
  // Exclusivity reasoning
  {
    pattern: /\b(only|sole|single)\s+(person|one|individual)\b.{0,50}\b(present|there|who|capable|could)\b/i,
    rule: REDACTION_RULES.NO_IDENTITY_INFERENCE,
    severity: 'error',
  },
  // Redacted-to-named collapse
  {
    pattern: /\bredacted\b.{0,30}\b(is|was|must\s+be|appears?\s+to\s+be)\b.{0,20}[A-Z][a-z]{2,}/i,
    rule: REDACTION_RULES.NEVER_COLLAPSE_ENTITIES,
    severity: 'error',
  },
  // Named-to-redacted collapse (reverse)
  {
    pattern: /[A-Z][a-z]{2,}.{0,30}\b(is|was|must\s+be)\b.{0,20}\bredacted\b/i,
    rule: REDACTION_RULES.NEVER_COLLAPSE_ENTITIES,
    severity: 'error',
  },
  // Candidate narrowing
  {
    pattern: /\bnarrow(s|ed|ing)?\b.{0,30}\b(down|to|candidates?)\b/i,
    rule: REDACTION_RULES.NO_IDENTITY_INFERENCE,
    severity: 'error',
  },
  // Process of elimination
  {
    pattern: /\b(process\s+of\s+elimination|by\s+elimination|eliminat(e|ed|ing)\s+.{0,20}candidates?)\b/i,
    rule: REDACTION_RULES.NO_IDENTITY_INFERENCE,
    severity: 'error',
  },
  // Candidate lists for redacted
  {
    pattern: /\bcandidates?\b.{0,30}\bfor\b.{0,20}\bredacted\b/i,
    rule: REDACTION_RULES.NO_IDENTITY_INFERENCE,
    severity: 'error',
  },
  // "Aligns with" identity language
  {
    pattern: /\baligns?\s+with\b.{0,50}\b(profile|description|identity|characteristics?)\b/i,
    rule: REDACTION_RULES.NEVER_IDENTIFY_REDACTED,
    severity: 'error',
  },
  // Ranking or scoring identities
  {
    pattern: /\b(rank(s|ed|ing)?|scor(e|ed|ing)|most\s+likely)\b.{0,30}\b(candidate|identity|person)\b/i,
    rule: REDACTION_RULES.NO_IDENTITY_INFERENCE,
    severity: 'error',
  },
  // "This person" referring to redacted
  {
    pattern: /\b(this|the)\s+(redacted\s+)?(person|individual)\b.{0,30}\b(is|was|must|could)\b/i,
    rule: REDACTION_RULES.NEVER_IDENTIFY_REDACTED,
    severity: 'warning',
  },
  // Composite reasoning
  {
    pattern: /\b(based\s+on|given|considering)\b.{0,50}\b(must\s+be|is\s+likely|appears?\s+to\s+be)\b/i,
    rule: REDACTION_RULES.NEVER_PROBABILISTIC_IDENTITY,
    severity: 'warning',
  },
]

// Patterns that SHOULD be present for proper uncertainty handling
const REQUIRED_PATTERNS = [
  /\bunknown\b/i,
  /\bredacted\b/i,
  /\buncertain(ty)?\b/i,
  /\bnot\s+(specified|stated|clear|known)\b/i,
  /\bunable\s+to\s+(determine|confirm|verify)\b/i,
]

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if text contains prohibited identity inference language
 */
function checkProhibitedPatterns(text: string): ValidationViolation[] {
  const violations: ValidationViolation[] = []
  
  for (const { pattern, rule, severity } of IDENTITY_INFERENCE_PATTERNS) {
    const match = pattern.exec(text)
    if (match) {
      violations.push({
        rule,
        severity,
        message: `Prohibited pattern detected: "${match[0]}"`,
        evidence: extractContext(text, match.index, 100),
      })
    }
  }
  
  return violations
}

/**
 * Extract context around a match position
 */
function extractContext(text: string, position: number, contextLength: number): string {
  const start = Math.max(0, position - contextLength / 2)
  const end = Math.min(text.length, position + contextLength / 2)
  let context = text.substring(start, end)
  
  if (start > 0) context = '...' + context
  if (end < text.length) context = context + '...'
  
  return context
}

/**
 * Check if a statement properly handles uncertainty
 */
function checkUncertaintyHandling(
  statement: string, 
  uncertaintyNotes: string[]
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []
  
  // Check if any required pattern is present
  const hasUncertaintyMarker = REQUIRED_PATTERNS.some(p => p.test(statement))
  const hasUncertaintyNotes = uncertaintyNotes && uncertaintyNotes.length > 0
  
  if (!hasUncertaintyMarker && !hasUncertaintyNotes) {
    warnings.push('Statement lacks explicit uncertainty markers. Consider adding uncertainty notes.')
  }
  
  return { valid: true, warnings }
}

/**
 * Check if citations are properly formatted and present
 */
function checkCitations(
  statement: string,
  citations: Array<{ document_id?: string; excerpt?: string }> | undefined
): ValidationViolation[] {
  const violations: ValidationViolation[] = []
  
  if (!citations || citations.length === 0) {
    violations.push({
      rule: REDACTION_RULES.REQUIRE_CITATIONS,
      severity: 'warning',
      message: 'No citations provided. All claims should be supported by cited chunks.',
      evidence: statement.substring(0, 100),
    })
  } else {
    // Check each citation has required fields
    for (let i = 0; i < citations.length; i++) {
      const citation = citations[i]
      if (!citation.document_id) {
        violations.push({
          rule: REDACTION_RULES.REQUIRE_CITATIONS,
          severity: 'warning',
          message: `Citation ${i + 1} missing document_id`,
        })
      }
    }
  }
  
  return violations
}

/**
 * Check for attempts to link redacted entities with named entities
 */
function checkEntityCollapse(
  statement: string,
  mentionedEntities?: Array<{ name: string; is_redacted: boolean }>
): ValidationViolation[] {
  const violations: ValidationViolation[] = []
  
  if (!mentionedEntities) return violations
  
  const redactedEntities = mentionedEntities.filter(e => e.is_redacted)
  const namedEntities = mentionedEntities.filter(e => !e.is_redacted)
  
  // Check if statement contains both redacted and named entities in proximity
  for (const redacted of redactedEntities) {
    for (const named of namedEntities) {
      // Look for patterns like "REDACTED_xxx ... is ... John Smith"
      const collapsePattern = new RegExp(
        `${escapeRegex(redacted.name)}.{0,50}(is|was|same as|identical to|also known as).{0,50}${escapeRegex(named.name)}`,
        'i'
      )
      
      if (collapsePattern.test(statement)) {
        violations.push({
          rule: REDACTION_RULES.NEVER_COLLAPSE_ENTITIES,
          severity: 'error',
          message: `Potential entity collapse detected: "${redacted.name}" linked to "${named.name}"`,
          evidence: statement,
        })
      }
    }
  }
  
  return violations
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ============================================================================
// MAIN VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate an evidence packet before storage
 */
export function validateEvidencePacket(
  packet: Partial<ForensicEvidencePacket>,
  mentionedEntities?: Array<{ name: string; is_redacted: boolean }>
): ValidationResult {
  const violations: ValidationViolation[] = []
  const warnings: string[] = []
  
  const statement = packet.statement || ''
  const fullText = `${statement} ${(packet.uncertainty_notes || []).join(' ')}`
  
  // 1. Check for prohibited patterns
  violations.push(...checkProhibitedPatterns(fullText))
  
  // 2. Check citations
  violations.push(...checkCitations(statement, packet.citations))
  
  // 3. Check entity collapse
  violations.push(...checkEntityCollapse(statement, mentionedEntities))
  
  // 4. Check uncertainty handling
  const uncertaintyCheck = checkUncertaintyHandling(statement, packet.uncertainty_notes || [])
  warnings.push(...uncertaintyCheck.warnings)
  
  // 5. Check raw agent output if provided
  if (packet.raw_agent_output) {
    const rawViolations = checkProhibitedPatterns(packet.raw_agent_output)
    violations.push(...rawViolations)
  }
  
  // Determine final status
  const hasErrors = violations.some(v => v.severity === 'error')
  const hasWarnings = violations.some(v => v.severity === 'warning') || warnings.length > 0
  
  let status: ValidationStatus = 'valid'
  if (hasErrors) {
    status = 'rejected'
  } else if (hasWarnings) {
    status = 'flagged'
  }
  
  return {
    valid: !hasErrors,
    status,
    violations,
    warnings,
  }
}

/**
 * Validate an entity before storage
 */
export function validateEntity(entity: Partial<ForensicEntity>): ValidationResult {
  const violations: ValidationViolation[] = []
  const warnings: string[] = []
  
  // Check if a redacted entity has a non-placeholder name
  if (entity.is_redacted && entity.name) {
    const isPlaceholder = /^REDACTED_0x[A-F0-9]+$/i.test(entity.name) ||
                          /^\[REDACTED\]$/i.test(entity.name) ||
                          /^UNKNOWN$/i.test(entity.name)
    
    if (!isPlaceholder) {
      // Check if name looks like a real name
      const looksLikeRealName = /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(entity.name)
      if (looksLikeRealName) {
        violations.push({
          rule: REDACTION_RULES.NEVER_IDENTIFY_REDACTED,
          severity: 'error',
          message: `Redacted entity has identifiable name: "${entity.name}"`,
        })
      }
    }
  }
  
  // Check description for identity inference
  if (entity.description) {
    violations.push(...checkProhibitedPatterns(entity.description))
  }
  
  const hasErrors = violations.some(v => v.severity === 'error')
  
  return {
    valid: !hasErrors,
    status: hasErrors ? 'rejected' : violations.length > 0 ? 'flagged' : 'valid',
    violations,
    warnings,
  }
}

/**
 * Validate a connection before storage
 */
export function validateConnection(
  connection: Partial<Connection>,
  sourceEntity?: ForensicEntity,
  targetEntity?: ForensicEntity
): ValidationResult {
  const violations: ValidationViolation[] = []
  const warnings: string[] = []
  
  // Check if connecting a redacted entity to a named entity in a way that implies identity
  if (sourceEntity && targetEntity) {
    if (sourceEntity.is_redacted !== targetEntity.is_redacted) {
      const relationshipType = (connection.relationship_type || '').toLowerCase()
      
      // These relationship types are dangerous for redacted-to-named connections
      const identityRelationships = ['is', 'same_as', 'identical_to', 'also_known_as', 'alias_of']
      
      if (identityRelationships.includes(relationshipType)) {
        violations.push({
          rule: REDACTION_RULES.NEVER_COLLAPSE_ENTITIES,
          severity: 'error',
          message: `Cannot create identity relationship between redacted and named entity`,
        })
      }
    }
  }
  
  // Check relationship label for prohibited patterns
  if (connection.relationship_label) {
    violations.push(...checkProhibitedPatterns(connection.relationship_label))
  }
  
  const hasErrors = violations.some(v => v.severity === 'error')
  
  return {
    valid: !hasErrors,
    status: hasErrors ? 'rejected' : violations.length > 0 ? 'flagged' : 'valid',
    violations,
    warnings,
  }
}

/**
 * Sanitize text by removing or flagging prohibited patterns
 * Use this for agent outputs that need cleaning before storage
 */
export function sanitizeText(text: string): { sanitized: string; removedPatterns: string[] } {
  let sanitized = text
  const removedPatterns: string[] = []
  
  for (const { pattern, rule } of IDENTITY_INFERENCE_PATTERNS) {
    const matches = text.match(new RegExp(pattern.source, 'gi'))
    if (matches) {
      for (const match of matches) {
        removedPatterns.push(match)
        sanitized = sanitized.replace(match, '[INFERENCE REMOVED]')
      }
    }
  }
  
  return { sanitized, removedPatterns }
}

/**
 * Create a validation log entry
 */
export function createValidationLogEntry(
  targetType: 'evidence_packet' | 'entity' | 'connection',
  targetId: string,
  result: ValidationResult,
  rawContent?: string
): {
  target_type: string
  target_id: string
  validation_result: 'passed' | 'flagged' | 'rejected'
  rule_violations: string[]
  validator_version: string
  raw_content?: string
} {
  let validationResult: 'passed' | 'flagged' | 'rejected' = 'passed'
  if (result.status === 'rejected') {
    validationResult = 'rejected'
  } else if (result.status === 'flagged' || result.status === 'pending') {
    validationResult = 'flagged'
  }
  
  return {
    target_type: targetType,
    target_id: targetId,
    validation_result: validationResult,
    rule_violations: result.violations.map(v => `[${v.severity}] ${v.rule}: ${v.message}`),
    validator_version: VALIDATOR_VERSION,
    raw_content: rawContent,
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  VALIDATOR_VERSION,
  checkProhibitedPatterns,
  checkCitations,
  checkEntityCollapse,
  checkUncertaintyHandling,
}
