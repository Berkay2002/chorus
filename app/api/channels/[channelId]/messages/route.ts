import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/channels/[channelId]/messages - Get messages with pagination
export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const before = searchParams.get('before') // Message ID cursor

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a member of the channel's server
    const { data: channel } = await supabase
      .from('channels')
      .select('server_id')
      .eq('id', channelId)
      .single()

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const { data: member } = await supabase
      .from('server_members')
      .select('*')
      .eq('server_id', channel.server_id)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this server' },
        { status: 403 }
      )
    }

    // Build query
    let query = supabase
      .from('messages')
      .select('*, profiles(username, avatar_url)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply cursor pagination if 'before' is provided
    if (before) {
      const { data: beforeMessage } = await supabase
        .from('messages')
        .select('created_at')
        .eq('id', before)
        .single()

      if (beforeMessage) {
        query = query.lt('created_at', beforeMessage.created_at)
      }
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: messages || [],
      error: null,
    })
  } catch (error) {
    console.error('Message fetch request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/channels/[channelId]/messages - Create a message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params
    const { content } = await request.json()

    // Validate input
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    if (content.length > 4000) {
      return NextResponse.json(
        { error: 'Message content must be 4000 characters or less' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a member of the channel's server
    const { data: channel } = await supabase
      .from('channels')
      .select('server_id')
      .eq('id', channelId)
      .single()

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const { data: member } = await supabase
      .from('server_members')
      .select('*')
      .eq('server_id', channel.server_id)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this server' },
        { status: 403 }
      )
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        user_id: user.id,
        content: content.trim(),
        is_ai: false,
      })
      .select('*, profiles(username, avatar_url)')
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      return NextResponse.json(
        { error: messageError.message },
        { status: 500 }
      )
    }

    // Broadcast message via Realtime
    const channel_name = `broadcast:channel:${channelId}`
    const messageWithProfile = message as typeof message & {
      profiles: { username: string; avatar_url: string | null } | null
    }
    await supabase.channel(channel_name).send({
      type: 'broadcast',
      event: 'message',
      payload: {
        messageId: message.id,
        content: message.content,
        userId: message.user_id,
        username: messageWithProfile.profiles?.username || 'Unknown',
        createdAt: message.created_at,
      },
    })

    return NextResponse.json({
      data: message,
      error: null,
    })
  } catch (error) {
    console.error('Message creation request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
