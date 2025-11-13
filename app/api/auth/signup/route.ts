import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json()

    // Validate inputs
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Email, password, and username are required' },
        { status: 400 }
      )
    }

    // Validate username format (3-30 chars, alphanumeric + underscore)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-30 characters, alphanumeric and underscores only' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (authError) {
      console.error('Signup error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create profile (if trigger doesn't handle it)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        username,
        avatar_url: null,
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't fail the request - profile trigger should handle this
    }

    return NextResponse.json({
      data: {
        user: authData.user,
        session: authData.session,
      },
      error: null,
    })
  } catch (error) {
    console.error('Signup request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
