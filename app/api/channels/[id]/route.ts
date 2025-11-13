import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PUT /api/channels/[id] - Update channel
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, description } = await request.json()

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get channel and verify membership
    const { data: channel, error: fetchError } = await supabase
      .from('channels')
      .select('*, servers!inner(owner_id)')
      .eq('id', id)
      .single()

    if (fetchError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Verify user is a member
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

    // Validate name if provided
    if (name && (name.length === 0 || name.length > 100)) {
      return NextResponse.json(
        { error: 'Channel name must be 1-100 characters' },
        { status: 400 }
      )
    }

    // Update channel
    const updates: {
      name?: string
      agents_md?: string | null
    } = {}
    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.agents_md = description?.trim() || null

    const { data: updatedChannel, error: updateError } = await supabase
      .from('channels')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating channel:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: updatedChannel,
      error: null,
    })
  } catch (error) {
    console.error('Channel update request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/channels/[id] - Delete channel
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get channel and check server ownership
    const { data: channel, error: fetchError } = await supabase
      .from('channels')
      .select('server_id, servers!inner(owner_id)')
      .eq('id', id)
      .single()

    if (fetchError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Only server owner can delete channels
    const server = (channel as unknown as { servers: { owner_id: string } }).servers
    if (server.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only server owner can delete channels' },
        { status: 403 }
      )
    }

    // Delete channel (cascades to messages)
    const { error: deleteError } = await supabase
      .from('channels')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting channel:', deleteError)
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: null,
      error: null,
    })
  } catch (error) {
    console.error('Channel delete request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
