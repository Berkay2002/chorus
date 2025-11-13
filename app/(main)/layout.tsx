import { ServerList } from '@/components/sidebar/server-list'
import { ChannelList } from '@/components/sidebar/channel-list'
import { MemberList } from '@/components/sidebar/member-list'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      {/* Server sidebar */}
      <aside className="w-20 bg-background border-r">
        <ServerList />
      </aside>

      {/* Channel sidebar */}
      <aside className="w-60 bg-muted/30 border-r">
        <ChannelList />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Member sidebar */}
      <aside className="w-60 bg-muted/30 border-l">
        <MemberList />
      </aside>
    </div>
  )
}
