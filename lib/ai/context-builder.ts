import { semanticSearch } from '@/lib/search/semantic'
import { Message } from '@/types/database'

const SHORT_TERM_MEMORY_SIZE = 10
const MID_TERM_MEMORY_SIZE = 5

export async function buildContext(
  channelId: string,
  recentMessages: Message[]
): Promise<string> {
  // Short-term memory: last N messages
  const shortTerm = recentMessages.slice(-SHORT_TERM_MEMORY_SIZE)

  // Mid-term memory: semantic search on last message
  const lastMessage = recentMessages[recentMessages.length - 1]
  const semanticResults = lastMessage
    ? await semanticSearch({
        query: lastMessage.content,
        channelId,
        limit: MID_TERM_MEMORY_SIZE,
        threshold: 0.7,
      })
    : []

  // Build context string
  let context = 'Recent conversation:\n'
  shortTerm.forEach((msg) => {
    context += `${msg.user_id}: ${msg.content}\n`
  })

  if (semanticResults.length > 0) {
    context += '\nRelevant past messages:\n'
    semanticResults.forEach((msg) => {
      context += `${msg.user_id} (${new Date(msg.created_at).toLocaleDateString()}): ${msg.content}\n`
    })
  }

  return context
}
