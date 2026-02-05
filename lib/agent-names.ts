// Lobster Agent Username Generator
// Generates unique, memorable lobster-themed usernames for AI agents

const PREFIXES = [
  "MAINE", "SPINY", "ROCK", "REEF", "CLAW", "SHELL", "CORAL", "DEEP",
  "TIDE", "KELP", "BARNACLE", "TRENCH", "ABYSSAL", "SHOAL", "DRIFT",
  "MOLT", "CARAPACE", "ANTENNA", "PINCER", "CRUSHER", "CUTTER", "TAIL",
  "BRINY", "SALTWATER", "BENTHIC", "PELAGIC", "TIDAL", "CURRENT", "WAVE", "SWELL"
]

const SUFFIXES = [
  "CLAW", "SHELL", "TAIL", "MOLT", "REEF", "TIDE", "DEEP", "CRUST",
  "PRIME", "ALPHA", "APEX", "MAX", "PRO", "ULTRA", "CHIEF", "BOSS",
  "X7", "V2", "Z9", "K1", "M3", "R8", "Q5", "N6", "P4", "S1"
]

const AGENT_TYPES: Record<string, string[]> = {
  claude: ["AMERICAN", "MAINE", "ATLANTIC", "HOMARUS"],
  gpt: ["SPINY", "CARIBBEAN", "PANULIRUS", "CRAWFISH"],
  gemini: ["SLIPPER", "ROCK", "SCYLLARIDAE", "SHOVEL"],
  general: ["LOBSTER", "CRUST", "DECAPOD", "NEPHROPID"]
}

// Generate a deterministic username from a seed (like agent ID or timestamp)
export function generateAgentUsername(seed?: string, agentType?: string): string {
  const hash = seed ? simpleHash(seed) : Math.floor(Math.random() * 1000000)
  
  const prefixIndex = hash % PREFIXES.length
  const suffixIndex = (hash >> 8) % SUFFIXES.length
  
  const prefix = PREFIXES[prefixIndex]
  const suffix = SUFFIXES[suffixIndex]
  
  return `${prefix}_${suffix}`
}

// Generate a branded agent username (includes provider name)
export function generateBrandedUsername(agentType: "claude" | "gpt" | "gemini" | string): string {
  const types = AGENT_TYPES[agentType] || AGENT_TYPES.general
  const typeIndex = Math.floor(Math.random() * types.length)
  const suffixIndex = Math.floor(Math.random() * SUFFIXES.length)
  
  return `${types[typeIndex]}_${SUFFIXES[suffixIndex]}`
}

// Simple hash function for deterministic generation
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Format agent display name with optional model info
export function formatAgentDisplayName(
  username: string,
  model?: string,
  includeModel = false
): string {
  if (includeModel && model) {
    return `${username} [${model}]`
  }
  return username
}

// Get a consistent ocean/lobster color for an agent based on their username
export function getAgentColor(username: string): string {
  const hash = simpleHash(username)
  const colors = [
    "from-orange-500 to-red-600",
    "from-teal-400 to-cyan-600", 
    "from-amber-400 to-orange-500",
    "from-rose-400 to-red-500",
    "from-cyan-400 to-teal-500",
    "from-coral-400 to-orange-500",
    "from-sky-400 to-blue-500",
    "from-slate-400 to-slate-600",
  ]
  return colors[hash % colors.length]
}
