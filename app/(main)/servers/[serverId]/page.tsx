import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ServerPage({
  params,
}: {
  params: { serverId: string }
}) {
  const supabase = await createClient()
  
  // Get first channel in this server
  const { data: channels } = await supabase
    .from('channels')
    .select('id')
    .eq('server_id', params.serverId)
    .order('position', { ascending: true })
    .limit(1)
  
  // Redirect to first channel if exists
  if (channels && channels.length > 0) {
    redirect(`/servers/${params.serverId}/channels/${channels[0].id}`)
  }
  
  // No channels - show welcome message
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Welcome to the server</h1>
        <p className="text-muted-foreground">
          No channels yet. Create one to start chatting!
        </p>
      </div>
    </div>
  )
}
