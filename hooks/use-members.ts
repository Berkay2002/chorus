'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useMembers(serverId: string) {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadMembers() {
      const { data } = await supabase
        .from('server_members')
        .select('*, profiles(*)')
        .eq('server_id', serverId)

      if (data) {
        setMembers(data)
      }
      setLoading(false)
    }

    loadMembers()
  }, [serverId, supabase])

  return { members, loading }
}
