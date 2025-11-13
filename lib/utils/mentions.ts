const MENTION_REGEX = /@(\w+)/g
const AI_MENTION_PATTERNS = ['@chorus', '@ai', '@assistant']

export interface Mention {
  username: string
  startIndex: number
  endIndex: number
}

/**
 * Extract all @mentions from a message
 */
export function extractMentions(content: string): Mention[] {
  const mentions: Mention[] = []
  let match: RegExpExecArray | null

  while ((match = MENTION_REGEX.exec(content)) !== null) {
    mentions.push({
      username: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  return mentions
}

/**
 * Check if message mentions the AI
 */
export function mentionsAI(content: string): boolean {
  const lowerContent = content.toLowerCase()
  return AI_MENTION_PATTERNS.some((pattern) => lowerContent.includes(pattern))
}

/**
 * Remove @mentions from content (useful for AI processing)
 */
export function stripMentions(content: string): string {
  return content.replace(MENTION_REGEX, '').trim()
}

/**
 * Replace @mentions with formatted links (for rendering)
 */
export function formatMentions(
  content: string,
  formatter: (username: string) => string
): string {
  return content.replace(MENTION_REGEX, (match, username) => formatter(username))
}
