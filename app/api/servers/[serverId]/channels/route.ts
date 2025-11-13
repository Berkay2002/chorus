import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/servers/[serverId]/channels - List all channels in a server
export async function GET(
  request: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a member of the server
    const { data: member } = await supabase
      .from('server_members')
      .select('*')
      .eq('server_id', serverId)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this server' },
        { status: 403 }
      )
    }

    // Get channels ordered by position
    const { data: channels, error } = await supabase
      .from('channels')
      .select('*')
      .eq('server_id', serverId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching channels:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: channels || [],
      error: null,
    })
  } catch (error) {
    console.error('Channel list request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/servers/[serverId]/channels - Create a new channel
export async function POST(
  request: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await params
    const { name, description } = await request.json()

    // Validate inputs
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Channel name must be 100 characters or less' },
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

    // Verify user is a member of the server
    const { data: member } = await supabase
      .from('server_members')
      .select('*')
      .eq('server_id', serverId)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this server' },
        { status: 403 }
      )
    }

    // Create channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .insert({
        server_id: serverId,
        name: name.trim(),
        agents_md: description?.trim() || null,
      })
      .select()
      .single()

    if (channelError) {
      console.error('Error creating channel:', channelError)
      return NextResponse.json(
        { error: channelError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: channel,
      error: null,
    })
  } catch (error) {
    console.error('Channel creation request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
