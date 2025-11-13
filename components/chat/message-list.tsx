'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageItem } from './message-item'
import { TypingIndicator } from './typing-indicator'
import { useChatStore } from '@/store/use-chat-store'
import { useMessages } from '@/hooks/use-messages'
import { createClient } from '@/lib/supabase/client'
import { MessageWithProfile } from '@/types'
import { Spinner } from '@/components/ui/spinner'

export function MessageList({ channelId }: { channelId: string }) {
  const messages = useChatStore((state) => state.messages[channelId] || [])
  const { setMessages } = useChatStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<HTMLDivElement>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const supabase = createClient()

  // Load messages and subscribe to realtime updates
  useMessages(channelId)

  // Load more messages (pagination)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return

    setIsLoadingMore(true)
    const oldestMessage = messages[0]
    
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(username, avatar_url, display_name)')
      .eq('channel_id', channelId)
      .lt('created_at', oldestMessage.created_at)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      if (data.length < 50) {
        setHasMore(false)
      }
      // Prepend older messages
      setMessages(channelId, [...(data.reverse() as MessageWithProfile[]), ...messages])
      
      // Maintain scroll position
      if (containerRef.current) {
        const scrollHeight = containerRef.current.scrollHeight
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight - scrollHeight
          }
        })
      }
    }
    
    setIsLoadingMore(false)
  }, [channelId, messages, hasMore, isLoadingMore, setMessages, supabase])

  // Intersection Observer for pagination
  useEffect(() => {
    if (!observerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 1.0 }
    )

    observer.observe(observerRef.current)

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, loadMore])

  // Check if user is at bottom
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
      setShouldAutoScroll(isAtBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll to bottom on new messages (only if already at bottom)
  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, shouldAutoScroll])

  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {/* Intersection Observer trigger */}
      <div ref={observerRef} className="h-1">
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Spinner className="h-4 w-4" />
          </div>
        )}
        {!hasMore && messages.length > 0 && (
          <div className="text-center text-sm text-muted-foreground py-2">
            Beginning of channel history
          </div>
        )}
      </div>
      
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      <TypingIndicator channelId={channelId} />
      <div ref={scrollRef} />
    </div>
  )
}
