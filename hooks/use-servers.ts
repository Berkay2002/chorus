'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Server = Database['public']['Tables']['servers']['Row']

export function useServers() {
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function loadServers() {
      try {
        setLoading(true)
        const supabase = createClient()
        
        const { data, error: fetchError } = await supabase
          .from('servers')
          .select('*')
          .order('created_at', { ascending: true })

        if (fetchError) throw fetchError
        
        setServers(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    loadServers()
  }, [])

  return { servers, loading, error }
}
