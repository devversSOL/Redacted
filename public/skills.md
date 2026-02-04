# ARCHIVEX SYSTEM SKILLS & CAPABILITIES

> **This document is machine-readable for AI agents and human-readable for investigators.**
> Access via: `/skills.md` or `/api/skills`

---

## SYSTEM IDENTITY

**Name:** ARCHIVEX  
**Purpose:** Forensic-grade evidence processing with redaction safety  
**Mode:** Human-Agent Hybrid Cooperation  
**Version:** 1.0.0

---

## AVAILABLE API ENDPOINTS

### Core Operations

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/investigations` | GET, POST | List/create investigations |
| `/api/documents` | GET, POST | List/upload documents |
| `/api/ocr` | POST | OCR processing with chunk extraction |
| `/api/evidence` | GET, POST | Evidence packets with validation |
| `/api/entities` | GET, POST | Named entities and redacted references |
| `/api/chunks` | GET, POST | Addressable text chunks |
| `/api/events` | GET, POST | Timeline events |
| `/api/connections` | GET, POST | Entity relationships |
| `/api/export` | GET, POST | Audit-grade structured export |
| `/api/agents/chat` | POST | Agent conversation interface |
| `/api/agents/analyze` | POST | Document analysis |

### Agent-Specific

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/skills` | GET | This capability document (JSON) |
| `/api/agents/background` | POST | Batch document processing |

---

## HARD RULES - REDACTION SAFETY

**These rules are ENFORCED by the validation layer. Violations are REJECTED.**

### RULE 1: No Identity Inference
```
FORBIDDEN: Inferring, suggesting, or implying who a redacted person might be.
FORBIDDEN: "This could be...", "This suggests...", "Aligns with..."
REQUIRED: Treat [REDACTED] as completely unknown.
```

### RULE 2: No Entity Collapse
```
FORBIDDEN: Treating a redacted entity as the same as a named entity.
FORBIDDEN: Merging [REDACTED] with "John Smith" in any relationship.
REQUIRED: Maintain strict separation between redacted and named.
```

### RULE 3: No Probabilistic Identity Language
```
FORBIDDEN: "likely", "probably", "possibly" when referring to identity.
FORBIDDEN: "may be", "could be", "appears to be" for redacted persons.
REQUIRED: State only what is explicitly documented.
```

### RULE 4: Citation Required
```
REQUIRED: Every claim must cite source chunks.
FORMAT: DOC_ID.PAGE.START-END
EXAMPLE: "abc123.1.450-520"
```

### RULE 5: Explicit Unknowns
```
REQUIRED: Mark uncertain information explicitly.
FORMAT: Use uncertainty_notes field for gaps.
FORBIDDEN: Hiding uncertainty in confident-sounding language.
```

### RULE 6: No Exclusivity Reasoning
```
FORBIDDEN: "Only person present", "Must have been"
FORBIDDEN: Process of elimination on redacted identities.
REQUIRED: Accept that redacted = unknown.
```

---

## EVIDENCE PACKET SCHEMA

```json
{
  "investigationId": "uuid",
  "claim": "Factual statement from source",
  "claimType": "observed | corroborated | unknown",
  "confidence": 0.0-1.0,
  "citations": [
    {
      "document_id": "uuid",
      "page": 1,
      "start_offset": 450,
      "end_offset": 520,
      "excerpt": "Exact quoted text"
    }
  ],
  "uncertaintyNotes": ["What is unknown or unclear"],
  "supportingChunkIds": ["chunk-uuid-1", "chunk-uuid-2"]
}
```

---

## ENTITY SCHEMA

```json
{
  "investigationId": "uuid",
  "name": "Entity name or [REDACTED]",
  "entityType": "person | organization | location | document | event | other",
  "isRedacted": true|false,
  "aliases": ["Known aliases"],
  "description": "Factual description only",
  "firstMentionDocId": "uuid",
  "metadata": {}
}
```

---

## CONNECTION SCHEMA

```json
{
  "investigationId": "uuid",
  "sourceEntityId": "uuid",
  "targetEntityId": "uuid",
  "relationshipType": "works_with | reports_to | located_at | mentioned_in | etc",
  "relationshipLabel": "Human-readable description",
  "strength": "verified | strong | moderate | weak | unverified",
  "supportingPacketIds": ["evidence-uuid"],
  "supportingChunkIds": ["chunk-uuid"]
}
```

---

## EVENT SCHEMA

```json
{
  "investigationId": "uuid",
  "timeStart": "ISO timestamp or null",
  "timeEnd": "ISO timestamp or null",
  "timePrecision": "exact | day | week | month | year | unknown",
  "timeRaw": "Original text mentioning time",
  "location": "Place name or null",
  "locationType": "address | city | region | unknown",
  "description": "What happened",
  "eventType": "meeting | transaction | communication | observation | other",
  "supportingChunkIds": ["chunk-uuid"],
  "confidence": 0.0-1.0
}
```

---

## VALIDATION STATUS VALUES

| Status | Meaning |
|--------|---------|
| `valid` | Passed all HARD RULES |
| `flagged` | Minor warnings, review recommended |
| `pending` | Not yet validated |
| `rejected` | Violated HARD RULES, not stored |

---

## AGENT COOPERATION PROTOCOL

### For AI Agents Accessing This System:

1. **Read this document first** at `/api/skills`
2. **Never violate HARD RULES** - your submissions will be rejected
3. **Always cite chunks** using the canonical format
4. **Mark uncertainty explicitly** in the uncertainty_notes field
5. **Treat redactions as absolute** - no inference, no speculation

### Recommended Workflow:

```
1. GET /api/skills → Understand capabilities
2. GET /api/investigations → Find or create investigation
3. POST /api/ocr → Upload and process documents
4. GET /api/chunks?documentId=X → Review extracted chunks
5. POST /api/entities → Create entities (respecting redaction rules)
6. POST /api/evidence → Submit evidence packets (with citations)
7. POST /api/connections → Link entities (validation enforced)
8. GET /api/export → Generate audit-grade output
```

---

## CONTACT POINTS

- **Human Oversight:** Evidence feed requires human review
- **Agent Chat:** `/api/agents/chat` for conversational analysis
- **Bulk Processing:** `/api/agents/background` for batch operations

---

## COMPLIANCE STATEMENT

This system is designed for forensic-grade evidence processing. All outputs must be:
- Verifiable against source documents
- Compliant with redaction safety rules
- Suitable for independent audit review

**An independent auditor must be able to reconstruct every statement from source text without interpretation.**

---

*Last Updated: 2026-02-03*
*System Version: ARCHIVEX 1.0.0*
