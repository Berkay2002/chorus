'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InvitePage({
  params,
}: {
  params: Promise<{ inviteCode: string }>
}) {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => setInviteCode(p.inviteCode))
  }, [params])

  useEffect(() => {
    if (!inviteCode) return

    async function handleInvite() {
      const supabase = createClient()

      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        // Redirect to signup with invite code
        router.push(`/signup?invite=${inviteCode}`)
        return
      }

      // User is logged in, try to join the server
      try {
        const response = await fetch(`/api/servers/join/${inviteCode}`, {
          method: 'POST',
        })

        const result = await response.json()

        if (result.error) {
          setError(result.error)
          setLoading(false)
          return
        }

        // Successfully joined, redirect to server
        if (result.data?.server) {
          router.push(`/servers/${result.data.server.id}`)
        }
      } catch (err) {
        console.error('Error joining server:', err)
        setError('Failed to join server')
        setLoading(false)
      }
    }

    handleInvite()
  }, [inviteCode, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Processing invite...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => router.push('/servers')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Servers
          </button>
        </div>
      </div>
    )
  }

  return null
}
