'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useTypingIndicator } from '@/lib/realtime/hooks'
import { useChatStore } from '@/store/use-chat-store'
import { toast } from 'sonner'
import { Send } from 'lucide-react'

export function MessageInput({ channelId }: { channelId: string }) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { setTyping } = useTypingIndicator(channelId, 'current-user')
  const addMessage = useChatStore((state) => state.addMessage)

  const handleChange = (value: string) => {
    // Enforce 4000 character limit
    if (value.length > 4000) {
      toast.error('Message cannot exceed 4000 characters')
      return
    }
    setContent(value)
    setTyping(true)
  }

  const handleSubmit = async () => {
    if (!content.trim() || sending) return

    setSending(true)
    const messageContent = content.trim()
    
    // Optimistic update with profile data
    const tempId = `temp-${Date.now()}`
    addMessage(channelId, {
      id: tempId,
      channel_id: channelId,
      user_id: 'pending',
      content: messageContent,
      is_ai: false,
      embedding: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: {
        username: 'You',
        avatar_url: null,
        display_name: 'You',
      },
    })

    setContent('')

    try {
      const response = await fetch(`/api/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent }),
      })

      const result = await response.json()

      if (result.error) {
        toast.error(result.error)
        // Remove optimistic message on error
        // TODO: Implement removeMessage in store
      }
      // Real message will come via broadcast subscription
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="relative">
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Shift+Enter for new line)"
          className="flex-1 min-h-[44px] max-h-[200px] resize-none"
          rows={1}
        />
        <Button 
          onClick={handleSubmit} 
          disabled={!content.trim() || sending}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {content.length > 3500 && (
        <p className="text-xs text-muted-foreground mt-1">
          {content.length}/4000 characters
        </p>
      )}
    </div>
  )
}
