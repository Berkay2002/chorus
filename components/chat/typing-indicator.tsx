'use client'

import { useTypingIndicator } from '@/lib/realtime/hooks'

export function TypingIndicator({ channelId }: { channelId: string }) {
  const { typingUsers } = useTypingIndicator(channelId)

  if (typingUsers.length === 0) return null

  return (
    <div className="text-sm text-muted-foreground italic px-4">
      {typingUsers.length === 1 && `${typingUsers[0]} is typing...`}
      {typingUsers.length === 2 && `${typingUsers[0]} and ${typingUsers[1]} are typing...`}
      {typingUsers.length > 2 && `${typingUsers.length} people are typing...`}
    </div>
  )
}
