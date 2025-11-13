import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UIStore {
  sidebarOpen: boolean
  memberListOpen: boolean
  activeServerId: string | null
  activeChannelId: string | null
  
  toggleSidebar: () => void
  toggleMemberList: () => void
  setActiveServer: (serverId: string | null) => void
  setActiveChannel: (channelId: string | null) => void
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        memberListOpen: true,
        activeServerId: null,
        activeChannelId: null,

        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        toggleMemberList: () => set((state) => ({ memberListOpen: !state.memberListOpen })),
        setActiveServer: (serverId) => set({ activeServerId: serverId }),
        setActiveChannel: (channelId) => set({ activeChannelId: channelId }),
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          memberListOpen: state.memberListOpen,
        }),
      }
    ),
    { name: 'ui-store' }
  )
)
