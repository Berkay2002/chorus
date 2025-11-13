import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { semanticSearch } from '@/lib/search/semantic'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query, channelId, limit = 10 } = await req.json()

    const results = await semanticSearch({
      query,
      channelId,
      limit,
      threshold: 0.7,
    })

    return NextResponse.json({ data: results, error: null })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { data: null, error: 'Search failed' },
      { status: 500 }
    )
  }
}
