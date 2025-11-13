import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/embeddings'

export interface SemanticSearchOptions {
  query: string
  channelId?: string
  limit?: number
  threshold?: number
}

export interface SemanticSearchResult {
  id: string
  content: string
  user_id: string
  channel_id: string
  created_at: string
  is_ai: boolean
  similarity: number
}

export async function semanticSearch({
  query,
  channelId,
  limit = 10,
  threshold = 0.7,
}: SemanticSearchOptions): Promise<SemanticSearchResult[]> {
  const supabase = await createClient()

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query)

  // Call match_messages function
  const { data, error } = await supabase.rpc('match_messages', {
    query_embedding: JSON.stringify(queryEmbedding),
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
