'use client'

import { Avatar } from '@/components/ui/avatar'

export function MemberList() {
  // TODO: Fetch server members
  const members = [
    { id: '1', username: 'alice', status: 'online' },
    { id: '2', username: 'bob', status: 'offline' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="h-12 border-b px-4 flex items-center text-sm font-semibold">
        Members — {members.length}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">
            ONLINE — {members.filter((m) => m.status === 'online').length}
          </div>
          {members
            .filter((m) => m.status === 'online')
            .map((member) => (
              <div key={member.id} className="flex items-center gap-2">
                <Avatar className="h-8 w-8" />
                <span className="text-sm">{member.username}</span>
              </div>
            ))}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">
            OFFLINE — {members.filter((m) => m.status === 'offline').length}
          </div>
          {members
            .filter((m) => m.status === 'offline')
            .map((member) => (
              <div key={member.id} className="flex items-center gap-2 opacity-50">
                <Avatar className="h-8 w-8" />
                <span className="text-sm">{member.username}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
