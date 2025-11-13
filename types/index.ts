// Type helpers and re-exports
export type { Database, Tables, TablesInsert, TablesUpdate } from './database'

// Convenience type aliases
import { Tables } from './database'

export type Message = Tables<'messages'>
export type Channel = Tables<'channels'>
export type Profile = Tables<'profiles'>
export type Server = Tables<'servers'>
export type ServerMember = Tables<'server_members'>

// Extended types with relations
export type MessageWithProfile = Message & {
  profiles: {
    username: string
    avatar_url: string | null
    display_name: string | null
  } | null
}
