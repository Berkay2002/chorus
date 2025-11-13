import { useEffect, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import {
  createBroadcastChannel,
  subscribeToBroadcast,
  sendBroadcast,
  cleanupChannel,
} from './broadcast'

/**
 * Hook to manage a broadcast channel
 */
export function useChannel(channelName: string) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    const newChannel = createBroadcastChannel(channelName)
    setChannel(newChannel)

    return () => {
      if (newChannel) {
        cleanupChannel(newChannel)
      }
    }
  }, [channelName])

  const subscribe = (event: string, callback: (payload: any) => void) => {
    if (!channel) return

    subscribeToBroadcast(channel, event, callback)
    setIsSubscribed(true)
  }

  const broadcast = (event: string, payload: any) => {
    if (!channel) return
    return sendBroadcast(channel, event, payload)
  }

  return {
    channel,
    isSubscribed,
    subscribe,
    broadcast,
  }
}

/**
 * Hook for typing indicators
 */
export function useTypingIndicator(channelId: string, userId: string) {
  const { channel, subscribe, broadcast } = useChannel(`channel:${channelId}:typing`)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!channel) return

    subscribe('typing', ({ userId: typingUserId, isTyping }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev)
        if (isTyping) {
          next.add(typingUserId)
        } else {
          next.delete(typingUserId)
        }
        return next
      })
    })
  }, [channel])

  const setTyping = (isTyping: boolean) => {
    broadcast('typing', { userId, isTyping })
  }

  return {
    typingUsers: Array.from(typingUsers).filter((id) => id !== userId),
    setTyping,
  }
}
