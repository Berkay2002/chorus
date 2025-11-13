'use client'

import { useState } from 'react'
import { useServers } from '@/hooks/use-servers'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CreateServerModal } from '@/components/modals/create-server-modal'

export function ServerList() {
  const { servers, loading } = useServers()
  const params = useParams()
  const activeServerId = params?.serverId as string
  const [showCreateModal, setShowCreateModal] = useState(false)

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2 p-3">
        <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2 p-3">
        {servers.map((server) => {
          const isActive = server.id === activeServerId
          const initial = server.name.charAt(0).toUpperCase()
          
          return (
            <Link
              key={server.id}
              href={`/servers/${server.id}`}
            >
              <Button
                variant="ghost"
                className={`h-12 w-12 rounded-full ${
                  isActive ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                {initial}
              </Button>
            </Link>
          )
        })}
        <Button 
          variant="ghost" 
          className="h-12 w-12 rounded-full"
          onClick={() => setShowCreateModal(true)}
        >
          +
        </Button>
      </div>
      
      <CreateServerModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </>
  )
}
