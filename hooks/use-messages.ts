'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/use-chat-store'
import { MessageWithProfile } from '@/types'

export function useMessages(channelId: string) {
  const { setMessages, addMessage } = useChatStore()
  const supabase = createClient()

  // Load initial messages (last 50) with profile data
  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(username, avatar_url, display_name)')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) {
        // Reverse to show oldest first
        setMessages(channelId, data.reverse() as MessageWithProfile[])
      }
    }

    loadMessages()
  }, [channelId, setMessages, supabase])

  // Subscribe to Broadcast channel for realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`broadcast:channel:${channelId}`)
      .on(
        'broadcast',
        { event: 'message' },
        async (payload) => {
          // Fetch the full message with profile data
          const { data: message } = await supabase
            .from('messages')
            .select('*, profiles(username, avatar_url, display_name)')
            .eq('id', payload.payload.messageId)
            .single()
          
          if (message) {
            addMessage(channelId, message as MessageWithProfile)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId, addMessage, supabase])
}
