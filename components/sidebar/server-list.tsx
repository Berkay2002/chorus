'use client'

import { Button } from '@/components/ui/button'

export function ServerList() {
  // TODO: Fetch user's servers
  const servers = [{ id: '1', name: 'General', icon: 'G' }]

  return (
    <div className="flex flex-col items-center gap-2 p-3">
      {servers.map((server) => (
        <Button
          key={server.id}
          variant="ghost"
          className="h-12 w-12 rounded-full"
        >
          {server.icon}
        </Button>
      ))}
      <Button variant="ghost" className="h-12 w-12 rounded-full">
        +
      </Button>
    </div>
  )
}
