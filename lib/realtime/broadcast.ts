import { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export interface BroadcastMessage {
  event: string
  payload: any
  [key: string]: any
}

/**
 * Create a private broadcast channel
 */
export function createBroadcastChannel(channelName: string) {
  const supabase = createClient()

  return supabase.channel(channelName, {
    config: {
      broadcast: { self: false }, // Don't receive own messages
      private: true, // Requires RLS authorization
    },
  })
}

/**
 * Subscribe to broadcast messages on a channel
 */
export function subscribeToBroadcast(
  channel: RealtimeChannel,
  event: string,
  callback: (payload: any) => void
) {
  return channel
    .on('broadcast', { event }, (payload) => {
      callback(payload.payload)
    })
    .subscribe()
}

/**
 * Send a broadcast message
 */
export async function sendBroadcast(
  channel: RealtimeChannel,
  event: string,
  payload: any
) {
  return channel.send({
    type: 'broadcast',
    event,
    payload,
  })
}

/**
 * Unsubscribe and remove a channel
 */
export async function cleanupChannel(channel: RealtimeChannel) {
  const supabase = createClient()
  await supabase.removeChannel(channel)
}
