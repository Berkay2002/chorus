'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Channel } from '@/types/database'

export function useChannels(serverId: string) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadChannels() {
      const { data } = await supabase
        .from('channels')
        .select('*')
        .eq('server_id', serverId)
        .order('position', { ascending: true })

      if (data) {
        setChannels(data)
      }
      setLoading(false)
    }

    loadChannels()
  }, [serverId, supabase])

  return { channels, loading }
}
