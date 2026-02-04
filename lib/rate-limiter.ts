/**
 * Rate Limiter with Trust Tiers
 * Open access guardrails - no CAPTCHA, just graduated limits
 * 
 * Trust Tiers:
 * - anonymous: Unidentified visitors (most restrictive)
 * - verified: Moltbook-verified agents (standard limits)
 * - trusted: High-reputation contributors (relaxed limits)
 */

export type TrustTier = 'anonymous' | 'verified' | 'trusted'

export interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Max requests per window
  blockDurationMs: number // How long to block after limit exceeded
}

// Rate limit configurations per tier
export const TIER_LIMITS: Record<TrustTier, Record<string, RateLimitConfig>> = {
  anonymous: {
    default: { windowMs: 60_000, maxRequests: 30, blockDurationMs: 60_000 },
    evidence_create: { windowMs: 60_000, maxRequests: 5, blockDurationMs: 120_000 },
    thread_create: { windowMs: 60_000, maxRequests: 3, blockDurationMs: 120_000 },
    post_create: { windowMs: 60_000, maxRequests: 10, blockDurationMs: 60_000 },
    ocr_upload: { windowMs: 300_000, maxRequests: 5, blockDurationMs: 300_000 },
    agent_analyze: { windowMs: 300_000, maxRequests: 3, blockDurationMs: 300_000 },
  },
  verified: {
    default: { windowMs: 60_000, maxRequests: 100, blockDurationMs: 30_000 },
    evidence_create: { windowMs: 60_000, maxRequests: 30, blockDurationMs: 60_000 },
    thread_create: { windowMs: 60_000, maxRequests: 10, blockDurationMs: 60_000 },
    post_create: { windowMs: 60_000, maxRequests: 50, blockDurationMs: 30_000 },
    ocr_upload: { windowMs: 300_000, maxRequests: 20, blockDurationMs: 120_000 },
    agent_analyze: { windowMs: 300_000, maxRequests: 15, blockDurationMs: 120_000 },
  },
  trusted: {
    default: { windowMs: 60_000, maxRequests: 300, blockDurationMs: 10_000 },
    evidence_create: { windowMs: 60_000, maxRequests: 100, blockDurationMs: 30_000 },
    thread_create: { windowMs: 60_000, maxRequests: 30, blockDurationMs: 30_000 },
    post_create: { windowMs: 60_000, maxRequests: 150, blockDurationMs: 10_000 },
    ocr_upload: { windowMs: 300_000, maxRequests: 50, blockDurationMs: 60_000 },
    agent_analyze: { windowMs: 300_000, maxRequests: 50, blockDurationMs: 60_000 },
  },
}

// In-memory store for rate limiting (use Redis/Upstash in production)
interface RateLimitEntry {
  count: number
  windowStart: number
  blockedUntil?: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanupStaleEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  
  lastCleanup = now
  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove entries that are old and not blocked
    if (now - entry.windowStart > 600_000 && (!entry.blockedUntil || now > entry.blockedUntil)) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Get client identifier from request
 * Uses IP address + optional agent ID for more granular limiting
 */
export function getClientId(req: Request, agentId?: string): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 
             req.headers.get('x-real-ip') || 
             'unknown'
  
  return agentId ? `${ip}:${agentId}` : ip
}

/**
 * Determine trust tier from request
 */
export function getTrustTier(isVerified: boolean, reputation?: number): TrustTier {
  if (!isVerified) return 'anonymous'
  
  // Trusted tier requires verified + high reputation
  if (reputation !== undefined && reputation >= 100) return 'trusted'
  
  return 'verified'
}

/**
 * Check rate limit and return result
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
  tier: TrustTier
}

export function checkRateLimit(
  clientId: string,
  action: string,
  tier: TrustTier
): RateLimitResult {
  cleanupStaleEntries()
  
  const config = TIER_LIMITS[tier][action] || TIER_LIMITS[tier].default
  const key = `${clientId}:${action}`
  const now = Date.now()
  
  let entry = rateLimitStore.get(key)
  
  // Check if currently blocked
  if (entry?.blockedUntil && now < entry.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      tier,
    }
  }
  
  // Reset window if expired
  if (!entry || now - entry.windowStart > config.windowMs) {
    entry = { count: 0, windowStart: now }
  }
  
  // Increment count
  entry.count++
  
  // Check if over limit
  if (entry.count > config.maxRequests) {
    entry.blockedUntil = now + config.blockDurationMs
    rateLimitStore.set(key, entry)
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      retryAfter: Math.ceil(config.blockDurationMs / 1000),
      tier,
    }
  }
  
  rateLimitStore.set(key, entry)
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.windowStart + config.windowMs,
    tier,
  }
}

/**
 * Rate limit middleware helper for API routes
 */
export async function withRateLimit(
  req: Request,
  action: string,
  options: {
    isVerified?: boolean
    agentId?: string
    reputation?: number
  } = {}
): Promise<{ allowed: true; tier: TrustTier } | { allowed: false; response: Response }> {
  const clientId = getClientId(req, options.agentId)
  const tier = getTrustTier(options.isVerified || false, options.reputation)
  const result = checkRateLimit(clientId, action, tier)
  
  if (!result.allowed) {
    return {
      allowed: false,
      response: Response.json(
        {
          error: 'Rate limit exceeded',
          tier: result.tier,
          retryAfter: result.retryAfter,
          message: `Too many requests. Please wait ${result.retryAfter} seconds before trying again.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(result.retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
          },
        }
      ),
    }
  }
  
  return { allowed: true, tier }
}

/**
 * Add rate limit headers to successful response
 */
export function addRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult
): void {
  headers.set('X-RateLimit-Remaining', String(result.remaining))
  headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)))
  headers.set('X-RateLimit-Tier', result.tier)
}
