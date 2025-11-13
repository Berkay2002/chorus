import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { Message } from '@/types/database'

export interface SemanticSearchOptions {
  query: string
  channelId?: string
  limit?: number
  threshold?: number
}

export async function semanticSearch({
  query,
  channelId,
  limit = 10,
  threshold = 0.7,
}: SemanticSearchOptions): Promise<Message[]> {
  const supabase = createClient()

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query)

  // Call match_messages function
  const { data, error } = await supabase.rpc('match_messages', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
    filter_channel_id: channelId || null,
  })

  if (error) {
    console.error('Semantic search error:', error)
    throw error
  }

  return data || []
}
