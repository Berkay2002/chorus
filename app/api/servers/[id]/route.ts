import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/servers/[id] - Get server details
export async function GET(
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

    // Get server (RLS ensures user is a member)
    const { data: server, error } = await supabase
      .from('servers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching server:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({
      data: server,
      error: null,
    })
  } catch (error) {
    console.error('Server fetch request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/servers/[id] - Update server
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, description, icon_url } = await request.json()

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is owner
    const { data: server, error: fetchError } = await supabase
      .from('servers')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (fetchError || !server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    if (server.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only server owner can update server' },
        { status: 403 }
      )
    }

    // Validate name if provided
    if (name && (name.length === 0 || name.length > 100)) {
      return NextResponse.json(
        { error: 'Server name must be 1-100 characters' },
        { status: 400 }
      )
    }

    // Update server
    const updates: {
      name?: string
      description?: string | null
      icon_url?: string | null
    } = {}
    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description?.trim() || null
    if (icon_url !== undefined) updates.icon_url = icon_url

    const { data: updatedServer, error: updateError } = await supabase
      .from('servers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating server:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: updatedServer,
      error: null,
    })
  } catch (error) {
    console.error('Server update request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/servers/[id] - Delete server
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

    // Check if user is owner
    const { data: server, error: fetchError } = await supabase
      .from('servers')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (fetchError || !server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    if (server.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only server owner can delete server' },
        { status: 403 }
      )
    }

    // Delete server (cascades to channels, messages, members)
    const { error: deleteError } = await supabase
      .from('servers')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting server:', deleteError)
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
    console.error('Server delete request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
