'use client'

import { useEffect, useRef } from 'react'
import { MessageItem } from './message-item'
import { TypingIndicator } from './typing-indicator'
import { useChatStore } from '@/store/use-chat-store'
import { useMessages } from '@/hooks/use-messages'

export function MessageList({ channelId }: { channelId: string }) {
  const messages = useChatStore((state) => state.messages[channelId] || [])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load messages and subscribe to realtime updates
  useMessages(channelId)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      <TypingIndicator channelId={channelId} />
      <div ref={scrollRef} />
    </div>
  )
}
