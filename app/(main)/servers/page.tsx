import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ServersPage() {
  const supabase = await createClient()
  
  // Get user's first server
  const { data: servers } = await supabase
    .from('servers')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
  
  // Redirect to first server if exists
  if (servers && servers.length > 0) {
    redirect(`/servers/${servers[0].id}`)
  }
  
  // No servers - show welcome message
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Welcome to Chorus</h1>
        <p className="text-muted-foreground">
          You're not a member of any servers yet.
        </p>
        <p className="text-sm text-muted-foreground">
          Create a server or ask a friend for an invite link!
        </p>
      </div>
    </div>
  )
}
