/**
 * Chunk Extraction Service
 * Splits OCR text into addressable chunks with page/offset tracking
 */

import type { Chunk, ChunkExtractionResult, CitationString, StructuredCitation } from './forensic-types'
import crypto from 'crypto'

// Configuration for chunk extraction
const CHUNK_CONFIG = {
  // Target chunk size in characters (aim for semantic boundaries)
  TARGET_CHUNK_SIZE: 500,
  // Maximum chunk size (hard limit)
  MAX_CHUNK_SIZE: 1000,
  // Minimum chunk size (avoid tiny fragments)
  MIN_CHUNK_SIZE: 50,
  // Overlap between chunks for context continuity
  OVERLAP_SIZE: 50,
}

// Page break markers that might appear in OCR text
const PAGE_BREAK_PATTERNS = [
  /\n---\s*PAGE\s*(\d+)\s*---\n/gi,
  /\n\[PAGE\s*(\d+)\]\n/gi,
  /\n={3,}\s*(\d+)\s*={3,}\n/gi,
  /\f/g, // Form feed character
  /\n-{20,}\n/g, // Long dash lines often indicate page breaks
]

// Sentence boundary patterns for semantic chunking
const SENTENCE_BOUNDARIES = /(?<=[.!?])\s+(?=[A-Z])/g
const PARAGRAPH_BOUNDARIES = /\n\n+/g

/**
 * Compute SHA-256 hash of document content
 */
export function computeContentHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex')
}

/**
 * Detect and split text by page breaks
 */
export function splitByPages(text: string): { page: number; text: string; startOffset: number }[] {
  const pages: { page: number; text: string; startOffset: number }[] = []
  
  // Try to find explicit page markers
  let hasPageMarkers = false
  for (const pattern of PAGE_BREAK_PATTERNS) {
    if (pattern.test(text)) {
      hasPageMarkers = true
      break
    }
  }
  
  if (hasPageMarkers) {
    // Split by the most common page break pattern found
    const pagePattern = /\n(?:---\s*PAGE\s*(\d+)\s*---|\[PAGE\s*(\d+)\]|={3,}\s*(\d+)\s*={3,})\n/gi
    const parts = text.split(pagePattern)
    
    let currentOffset = 0
    let currentPage = 1
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!part) continue
      
      // Check if this part is a page number
      const pageNum = parseInt(part, 10)
      if (!isNaN(pageNum) && pageNum > 0 && pageNum < 10000) {
        currentPage = pageNum
        continue
      }
      
      if (part.trim()) {
        pages.push({
          page: currentPage,
          text: part,
          startOffset: currentOffset,
        })
        currentPage++
      }
      currentOffset += part.length
    }
  } else {
    // No page markers - treat as single page
    pages.push({
      page: 1,
      text: text,
      startOffset: 0,
    })
  }
  
  return pages.length > 0 ? pages : [{ page: 1, text, startOffset: 0 }]
}

/**
 * Find the best split point near target position
 */
function findBestSplitPoint(text: string, targetPos: number, maxLookback: number = 100): number {
  if (targetPos >= text.length) return text.length
  
  // Look for paragraph break first (strongest boundary)
  for (let i = targetPos; i > Math.max(0, targetPos - maxLookback); i--) {
    if (text.substring(i, i + 2) === '\n\n') {
      return i + 2
    }
  }
  
  // Look for sentence boundary
  for (let i = targetPos; i > Math.max(0, targetPos - maxLookback); i--) {
    if (/[.!?]\s/.test(text.substring(i, i + 2))) {
      return i + 2
    }
  }
  
  // Look for any whitespace
  for (let i = targetPos; i > Math.max(0, targetPos - maxLookback / 2); i--) {
    if (/\s/.test(text[i])) {
      return i + 1
    }
  }
  
  // Fall back to target position
  return targetPos
}

/**
 * Extract chunks from a single page of text
 */
function extractPageChunks(
  pageText: string,
  pageNumber: number,
  pageStartOffset: number,
  startingIndex: number
): Chunk[] {
  const chunks: Chunk[] = []
  
  if (pageText.length <= CHUNK_CONFIG.MAX_CHUNK_SIZE) {
    // Small page - single chunk
    chunks.push({
      id: '', // Will be assigned by database
      document_id: '', // Will be assigned by caller
      page: pageNumber,
      start_offset: pageStartOffset,
      end_offset: pageStartOffset + pageText.length,
      text: pageText,
      chunk_index: startingIndex,
      created_at: new Date().toISOString(),
    })
    return chunks
  }
  
  // Split into semantic chunks
  let currentPos = 0
  let chunkIndex = startingIndex
  
  while (currentPos < pageText.length) {
    const remainingLength = pageText.length - currentPos
    
    if (remainingLength <= CHUNK_CONFIG.MAX_CHUNK_SIZE) {
      // Last chunk - take everything remaining
      chunks.push({
        id: '',
        document_id: '',
        page: pageNumber,
        start_offset: pageStartOffset + currentPos,
        end_offset: pageStartOffset + pageText.length,
        text: pageText.substring(currentPos),
        chunk_index: chunkIndex,
        created_at: new Date().toISOString(),
      })
      break
    }
    
    // Find best split point near target size
    const targetEnd = currentPos + CHUNK_CONFIG.TARGET_CHUNK_SIZE
    const splitPoint = findBestSplitPoint(pageText, targetEnd)
    
    const chunkText = pageText.substring(currentPos, splitPoint)
    
    if (chunkText.trim().length >= CHUNK_CONFIG.MIN_CHUNK_SIZE) {
      chunks.push({
        id: '',
        document_id: '',
        page: pageNumber,
        start_offset: pageStartOffset + currentPos,
        end_offset: pageStartOffset + splitPoint,
        text: chunkText,
        chunk_index: chunkIndex,
        created_at: new Date().toISOString(),
      })
      chunkIndex++
    }
    
    currentPos = splitPoint
  }
  
  return chunks
}

/**
 * Main extraction function - process full document text into chunks
 */
export function extractChunks(
  documentId: string,
  ocrText: string
): ChunkExtractionResult {
  const pages = splitByPages(ocrText)
  const allChunks: Chunk[] = []
  let chunkIndex = 0
  
  for (const page of pages) {
    const pageChunks = extractPageChunks(
      page.text,
      page.page,
      page.startOffset,
      chunkIndex
    )
    
    for (const chunk of pageChunks) {
      chunk.document_id = documentId
      allChunks.push(chunk)
      chunkIndex++
    }
  }
  
  return {
    document_id: documentId,
    chunks: allChunks,
    page_count: pages.length,
    total_characters: ocrText.length,
  }
}

/**
 * Format a citation in canonical string format: "DOC_ID.PAGE.START-END"
 */
export function formatCitation(citation: StructuredCitation): CitationString {
  return `${citation.document_id}.${citation.page}.${citation.start_offset}-${citation.end_offset}` as CitationString
}

/**
 * Parse a citation string back into structured format
 */
export function parseCitation(citationString: CitationString): StructuredCitation | null {
  const match = citationString.match(/^(.+)\.(\d+)\.(\d+)-(\d+)$/)
  if (!match) return null
  
  return {
    document_id: match[1],
    page: parseInt(match[2], 10),
    start_offset: parseInt(match[3], 10),
    end_offset: parseInt(match[4], 10),
    excerpt: '', // Would need to be fetched from chunk
  }
}

/**
 * Find chunks that contain a specific text excerpt
 */
export function findChunksContaining(
  chunks: Chunk[],
  searchText: string,
  fuzzyMatch: boolean = false
): Chunk[] {
  const normalizedSearch = searchText.toLowerCase().trim()
  
  return chunks.filter(chunk => {
    const normalizedChunk = chunk.text.toLowerCase()
    
    if (fuzzyMatch) {
      // Check if most words from search appear in chunk
      const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 2)
      const matchedWords = searchWords.filter(word => normalizedChunk.includes(word))
      return matchedWords.length >= searchWords.length * 0.7
    }
    
    return normalizedChunk.includes(normalizedSearch)
  })
}

/**
 * Create a citation from a text excerpt by finding the best matching chunk
 */
export function createCitationFromExcerpt(
  chunks: Chunk[],
  excerpt: string,
  documentId: string
): StructuredCitation | null {
  const matchingChunks = findChunksContaining(chunks, excerpt, true)
  
  if (matchingChunks.length === 0) return null
  
  // Use the first (best) matching chunk
  const chunk = matchingChunks[0]
  
  // Try to find exact position within chunk
  const excerptLower = excerpt.toLowerCase().trim()
  const chunkLower = chunk.text.toLowerCase()
  const excerptPos = chunkLower.indexOf(excerptLower)
  
  let startOffset = chunk.start_offset
  let endOffset = chunk.end_offset
  
  if (excerptPos !== -1) {
    // Found exact match - narrow down the citation
    startOffset = chunk.start_offset + excerptPos
    endOffset = startOffset + excerpt.length
  }
  
  return {
    document_id: documentId,
    page: chunk.page,
    start_offset: startOffset,
    end_offset: endOffset,
    excerpt: excerpt.substring(0, 200), // Truncate long excerpts
    chunk_id: chunk.id,
  }
}

/**
 * Detect redaction markers in text
 */
export function detectRedactions(text: string): { start: number; end: number; marker: string }[] {
  const redactions: { start: number; end: number; marker: string }[] = []
  
  const patterns = [
    /\[REDACTED\]/gi,
    /\[REDACTED_\w+\]/gi,
    /\[█+\]/g,
    /█+/g,
    /\*{3,}/g,
    /X{3,}/g,
    /_{5,}/g,
    /\[CLASSIFIED\]/gi,
    /\[WITHHELD\]/gi,
  ]
  
  for (const pattern of patterns) {
    let match
    const regex = new RegExp(pattern.source, pattern.flags)
    while ((match = regex.exec(text)) !== null) {
      redactions.push({
        start: match.index,
        end: match.index + match[0].length,
        marker: match[0],
      })
    }
  }
  
  // Sort by position and deduplicate overlapping
  redactions.sort((a, b) => a.start - b.start)
  
  const deduped: typeof redactions = []
  for (const r of redactions) {
    const last = deduped[deduped.length - 1]
    if (!last || r.start >= last.end) {
      deduped.push(r)
    }
  }
  
  return deduped
}

/**
 * Generate a unique redaction placeholder ID
 */
export function generateRedactionId(): string {
  const hex = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `REDACTED_0x${hex}`
}
