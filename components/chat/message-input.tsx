'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTypingIndicator } from '@/lib/realtime/hooks'

export function MessageInput({ channelId }: { channelId: string }) {
  const [content, setContent] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { setTyping } = useTypingIndicator(channelId, 'current-user')

  const handleChange = (value: string) => {
    setContent(value)
    setTyping(true)
  }

  const handleSubmit = async () => {
    if (!content.trim()) return

    // TODO: Send message to API

    setContent('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... Use @chorus to mention AI"
          className="flex-1"
        />
        <Button onClick={handleSubmit}>Send</Button>
      </div>
    </div>
  )
}
