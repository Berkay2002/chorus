import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/servers/join/[inviteCode] - Join server via invite code
export async function POST(
  request: Request,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  try {
    const { inviteCode } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find server by invite code
    const { data: server, error: serverError } = await supabase
      .from('servers')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()

    if (serverError || !server) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('server_members')
      .select('*')
      .eq('server_id', server.id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json({
        data: {
          server,
          member: existingMember,
        },
        error: null,
      })
    }

    // Create server membership
    const { data: member, error: memberError } = await supabase
      .from('server_members')
      .insert({
        server_id: server.id,
        user_id: user.id,
      })
      .select()
      .single()

    if (memberError) {
      console.error('Error creating membership:', memberError)
      return NextResponse.json(
        { error: memberError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        server,
        member,
      },
      error: null,
    })
  } catch (error) {
    console.error('Server join request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
