'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/use-chat-store'
import { useChannel } from '@/lib/realtime/hooks'

export function useMessages(channelId: string) {
  const { setMessages, addMessage } = useChatStore()
  const supabase = createClient()

  // Load initial messages
  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(channelId, data)
      }
    }

    loadMessages()
  }, [channelId, setMessages, supabase])

  // Subscribe to realtime updates
  useChannel(channelId, {
    onMessage: (message) => {
      addMessage(channelId, message)
    },
  })
}
