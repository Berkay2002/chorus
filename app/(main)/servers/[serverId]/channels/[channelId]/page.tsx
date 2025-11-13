import { MessageList } from '@/components/chat/message-list'
import { MessageInput } from '@/components/chat/message-input'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function ChannelPage({
  params,
}: {
  params: { serverId: string; channelId: string }
}) {
  const supabase = await createClient()
  
  // Fetch channel details
  const { data: channel } = await supabase
    .from('channels')
    .select('name')
    .eq('id', params.channelId)
    .single()
  
  if (!channel) {
    notFound()
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <header className="h-12 border-b px-4 flex items-center">
        <h2 className="font-semibold"># {channel.name}</h2>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList channelId={params.channelId} />
      </div>

      {/* Message input */}
      <div className="p-4">
        <MessageInput channelId={params.channelId} />
      </div>
    </div>
  )
}
