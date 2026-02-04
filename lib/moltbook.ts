export interface MoltbookOwner {
  x_handle?: string
  x_name?: string
  x_avatar?: string
  x_verified?: boolean
  x_follower_count?: number
}

export interface MoltbookAgentStats {
  posts?: number
  comments?: number
}

export interface MoltbookAgent {
  id: string
  name: string
  description?: string
  karma?: number
  avatar_url?: string
  is_claimed?: boolean
  created_at?: string
  follower_count?: number
  following_count?: number
  stats?: MoltbookAgentStats
  owner?: MoltbookOwner
}

export interface MoltbookVerificationResponse {
  success?: boolean
  valid?: boolean
  error?: string
  hint?: string
  agent?: MoltbookAgent
}

export interface MoltbookIdentityResult {
  status: "none" | "verified" | "invalid" | "error"
  error?: string
  hint?: string
  agent?: MoltbookAgent
}

const MOLTBOOK_VERIFY_URL = "https://www.moltbook.com/api/v1/agents/verify-identity"

export async function verifyMoltbookIdentity(token: string): Promise<MoltbookVerificationResponse> {
  const appKey = process.env.MOLTBOOK_APP_KEY

  if (!appKey) {
    return {
      success: false,
      valid: false,
      error: "MOLTBOOK_APP_KEY is not configured",
    }
  }

  const audience = process.env.MOLTBOOK_AUDIENCE
  const body = audience ? { token, audience } : { token }

  try {
    const response = await fetch(MOLTBOOK_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Moltbook-App-Key": appKey,
      },
      body: JSON.stringify(body),
    })

    const data = (await response.json()) as MoltbookVerificationResponse

    if (!response.ok) {
      return {
        success: false,
        valid: false,
        error: data?.error || "Failed to verify Moltbook identity",
        hint: data?.hint,
      }
    }

    return data
  } catch (error) {
    return {
      success: false,
      valid: false,
      error: error instanceof Error ? error.message : "Unknown Moltbook verification error",
    }
  }
}

export async function resolveMoltbookIdentity(request: Request): Promise<MoltbookIdentityResult> {
  const identityToken = request.headers.get("x-moltbook-identity")

  if (!identityToken) {
    return { status: "none" }
  }

  const result = await verifyMoltbookIdentity(identityToken)

  if (!result?.valid || !result.agent) {
    return {
      status: "invalid",
      error: result?.error || "Invalid Moltbook identity token",
      hint: result?.hint,
    }
  }

  return {
    status: "verified",
    agent: result.agent,
  }
}
