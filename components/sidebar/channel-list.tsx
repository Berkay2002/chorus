'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

export function ChannelList() {
  const params = useParams()
  const serverId = params?.serverId as string

  // TODO: Fetch channels for current server
  const channels = [
    { id: '1', name: 'general' },
    { id: '2', name: 'random' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="h-12 border-b px-4 flex items-center font-semibold">
        Server Name
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="text-xs font-semibold text-muted-foreground px-2 mb-2">
          TEXT CHANNELS
        </div>
        {channels.map((channel) => (
          <Link
            key={channel.id}
            href={`/servers/${serverId}/channels/${channel.id}`}
            className="block px-2 py-1.5 rounded hover:bg-muted/50"
          >
            # {channel.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
