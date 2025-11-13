'use client'

import { useTypingIndicator } from '@/lib/realtime/hooks'
import { useUserStore } from '@/store/use-user-store'

export function TypingIndicator({ channelId }: { channelId: string }) {
  const user = useUserStore((state) => state.user)
  const { typingUsers } = useTypingIndicator(channelId, user?.id || 'anonymous')

  if (typingUsers.length === 0) return null

  return (
    <div className="text-sm text-muted-foreground italic px-4">
      {typingUsers.length === 1 && `${typingUsers[0]} is typing...`}
      {typingUsers.length === 2 && `${typingUsers[0]} and ${typingUsers[1]} are typing...`}
      {typingUsers.length > 2 && `${typingUsers.length} people are typing...`}
    </div>
  )
}
