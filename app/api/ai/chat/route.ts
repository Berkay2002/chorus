import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { buildContext } from '@/lib/ai/context-builder'
import { gemini } from '@/lib/ai/gemini'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, channelId } = await req.json()

    // Build context with semantic search
    const context = await buildContext(channelId, messages)

    const result = await streamText({
      model: gemini('gemini-pro'),
      messages: [
        {
          role: 'system',
          content: `You are Chorus, a helpful AI assistant in a chat server. Context: ${context}`,
        },
        ...messages,
      ],
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('AI chat error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
