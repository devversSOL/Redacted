// BYOK (Bring Your Own Key) - Client-side API key management
// Keys are stored in localStorage and sent with each request
// The server NEVER stores user keys

export type Provider = "anthropic" | "openai" | "google"

export interface APIKeys {
  anthropic?: string
  openai?: string
  google?: string
}

const STORAGE_KEY = "redacted_api_keys"

export function getStoredKeys(): APIKeys {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export function setStoredKeys(keys: APIKeys): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
}

export function clearStoredKeys(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}

export function getKeyForProvider(provider: Provider): string | undefined {
  const keys = getStoredKeys()
  return keys[provider]
}

export function hasAnyKey(): boolean {
  const keys = getStoredKeys()
  return Boolean(keys.anthropic || keys.openai || keys.google)
}

export function getAvailableProviders(): Provider[] {
  const keys = getStoredKeys()
  const available: Provider[] = []
  if (keys.anthropic) available.push("anthropic")
  if (keys.openai) available.push("openai")
  if (keys.google) available.push("google")
  return available
}

// Map agent type to provider
export function agentTypeToProvider(agentType: "claude" | "gpt" | "gemini"): Provider {
  switch (agentType) {
    case "claude": return "anthropic"
    case "gpt": return "openai"
    case "gemini": return "google"
  }
}

// Headers to send with AI requests
export function getAuthHeaders(agentType: "claude" | "gpt" | "gemini"): Record<string, string> {
  const provider = agentTypeToProvider(agentType)
  const key = getKeyForProvider(provider)
  if (!key) return {}
  
  return {
    "X-API-Key": key,
    "X-API-Provider": provider,
  }
}

// Get headers for the first available provider (for OCR/general use)
export function getFirstAvailableHeaders(): Record<string, string> {
  const keys = getStoredKeys()
  
  // Priority: OpenAI > Anthropic > Google (OpenAI GPT-4o is best for vision)
  if (keys.openai) {
    return { "X-API-Key": keys.openai, "X-API-Provider": "openai" }
  }
  if (keys.anthropic) {
    return { "X-API-Key": keys.anthropic, "X-API-Provider": "anthropic" }
  }
  if (keys.google) {
    return { "X-API-Key": keys.google, "X-API-Provider": "google" }
  }
  
  return {}
}
