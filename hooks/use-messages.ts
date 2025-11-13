'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/use-chat-store'
import { Message } from '@/types'

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

  // Subscribe to realtime updates for new messages in this channel
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          addMessage(channelId, payload.new as Message)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId, addMessage, supabase])
}
