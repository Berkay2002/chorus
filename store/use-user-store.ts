import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface UserStore {
  user: User | null
  profile: Profile | null
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  clear: () => void
}

export const useUserStore = create<UserStore>()(
  devtools(
    (set) => ({
      user: null,
      profile: null,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      clear: () => set({ user: null, profile: null }),
    }),
    { name: 'user-store' }
  )
)
