'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('invite')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      })

      const result = await response.json()

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Account created successfully')
        
        // If there's an invite code, join the server
        if (inviteCode) {
          try {
            const joinResponse = await fetch(`/api/servers/join/${inviteCode}`, {
              method: 'POST',
            })
            const joinResult = await joinResponse.json()
            
            if (joinResult.data?.server) {
              router.push(`/servers/${joinResult.data.server.id}`)
              router.refresh()
              return
            }
          } catch (err) {
            console.error('Error joining server:', err)
          }
        }
        
        router.push('/servers')
        router.refresh()
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Sign up'}
      </Button>
    </form>
  )
}
