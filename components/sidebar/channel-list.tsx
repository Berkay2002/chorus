'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useChannels } from '@/hooks/use-channels'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateChannelModal } from '@/components/modals/create-channel-modal'

type Server = Database['public']['Tables']['servers']['Row']

export function ChannelList() {
  const params = useParams()
  const serverId = params?.serverId as string
  const activeChannelId = params?.channelId as string
  const { channels, loading } = useChannels(serverId)
  const [server, setServer] = useState<Server | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (!serverId) return
    
    async function loadServer() {
      const supabase = createClient()
      const { data } = await supabase
        .from('servers')
        .select('*')
        .eq('id', serverId)
        .single()
      
      if (data) setServer(data)
    }
    
    loadServer()
  }, [serverId])

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-12 border-b px-4 flex items-center">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex-1 p-2 space-y-2">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="h-12 border-b px-4 flex items-center font-semibold">
          {server?.name || 'Server'}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="text-xs font-semibold text-muted-foreground">
              TEXT CHANNELS
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {channels.map((channel) => {
            const isActive = channel.id === activeChannelId
            
            return (
              <Link
                key={channel.id}
                href={`/servers/${serverId}/channels/${channel.id}`}
                className={`block px-2 py-1.5 rounded hover:bg-muted/50 ${
                  isActive ? 'bg-muted' : ''
                }`}
              >
                # {channel.name}
              </Link>
            )
          })}
        </div>
      </div>
      
      {serverId && (
        <CreateChannelModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          serverId={serverId}
        />
      )}
    </>
  )
}
