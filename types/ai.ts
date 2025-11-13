export interface EmbeddingRequest {
  text: string
  messageId?: string
}

export interface EmbeddingResponse {
  data: number[] | null
  error: string | null
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  channelId: string
}

export interface SemanticSearchResult {
  id: string
  content: string
  similarity: number
  created_at: string
  user_id: string
}
