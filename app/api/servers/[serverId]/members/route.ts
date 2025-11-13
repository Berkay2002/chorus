import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/servers/[serverId]/members - List all members of a server
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

    // Get all members with their profiles
    const { data: members, error } = await supabase
      .from('server_members')
      .select('*, profiles(id, username, avatar_url)')
      .eq('server_id', serverId)
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('Error fetching members:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: members || [],
      error: null,
    })
  } catch (error) {
    console.error('Member list request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
