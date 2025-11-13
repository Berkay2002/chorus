'use client'

import { useState } from 'react'
import { Message } from '@/types/database'

export function useSemanticSearch() {
  const [results, setResults] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  const search = async (query: string, channelId?: string) => {
    setLoading(true)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, channelId }),
      })

      const { data } = await response.json()
      setResults(data || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return { results, loading, search }
}
