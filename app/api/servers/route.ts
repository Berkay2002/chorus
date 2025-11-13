import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/servers - List all servers user is a member of
export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get servers where user is a member (RLS handles filtering)
    const { data: servers, error } = await supabase
      .from('servers')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching servers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: servers || [],
      error: null,
    })
  } catch (error) {
    console.error('Server list request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/servers - Create a new server
export async function POST(request: Request) {
  try {
    const { name, description } = await request.json()

    // Validate inputs
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Server name is required' },
        { status: 400 }
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Server name must be 100 characters or less' },
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

    // Generate invite code (7-char alphanumeric)
    const inviteCode = generateInviteCode()

    // Create server
    const { data: server, error: serverError } = await supabase
      .from('servers')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        owner_id: user.id,
        invite_code: inviteCode,
      })
      .select()
      .single()

    if (serverError) {
      console.error('Error creating server:', serverError)
      return NextResponse.json(
        { error: serverError.message },
        { status: 500 }
      )
    }

    // Create server_members entry for owner
    const { error: memberError } = await supabase
      .from('server_members')
      .insert({
        server_id: server.id,
        user_id: user.id,
      })

    if (memberError) {
      console.error('Error creating server membership:', memberError)
      // Don't fail - database trigger should handle this
    }

    return NextResponse.json({
      data: server,
      error: null,
    })
  } catch (error) {
    console.error('Server creation request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate 7-character alphanumeric invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
