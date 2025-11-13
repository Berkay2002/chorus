'use client'

import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Message } from '@/types'
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer'
import { formatMessageTime } from '@/lib/utils/date'
import { Avatar } from '@/components/ui/avatar'

export function MessageItem({ message }: { message: Message }) {
  return (
    <div className="flex gap-3 group hover:bg-muted/50 px-4 py-2 -mx-4 rounded">
      <Avatar className="h-10 w-10">
        {/* Avatar will use profile data */}
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold">{message.user_id}</span>
          <span className="text-xs text-muted-foreground">
            {formatMessageTime(message.created_at)}
          </span>
          {message.is_ai && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
              AI
            </span>
          )}
        </div>
        <div className="text-sm">
          <MarkdownRenderer content={message.content} />
        </div>
      </div>
    </div>
  )
}
