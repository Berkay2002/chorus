import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/embeddings'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { text, messageId } = await req.json()

    // Generate embedding
    const embedding = await generateEmbedding(text)

    // Update message with embedding (convert to string for pgvector)
    if (messageId) {
      await supabase
        .from('messages')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', messageId)
    }

    return NextResponse.json({ data: embedding, error: null })
  } catch (error) {
    console.error('Embedding error:', error)
    return NextResponse.json(
      { data: null, error: 'Failed to generate embedding' },
      { status: 500 }
    )
  }
}
