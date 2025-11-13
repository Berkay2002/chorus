import { MessageList } from '@/components/chat/message-list'
import { MessageInput } from '@/components/chat/message-input'

export default function ChannelPage({
  params,
}: {
  params: { serverId: string; channelId: string }
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <header className="h-12 border-b px-4 flex items-center">
        <h2 className="font-semibold"># channel-name</h2>
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
