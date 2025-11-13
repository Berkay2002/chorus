import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Database } from '@/types/database'

type Message = Database['public']['Tables']['messages']['Row']

interface ChatStore {
  messages: Record<string, Message[]> // channelId -> messages
  addMessage: (channelId: string, message: Message) => void
  setMessages: (channelId: string, messages: Message[]) => void
  updateMessage: (channelId: string, messageId: string, updates: Partial<Message>) => void
  deleteMessage: (channelId: string, messageId: string) => void
  clearChannel: (channelId: string) => void
}

export const useChatStore = create<ChatStore>()(
  devtools(
    (set) => ({
      messages: {},

      addMessage: (channelId, message) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [channelId]: [...(state.messages[channelId] || []), message],
          },
        })),

      setMessages: (channelId, messages) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [channelId]: messages,
          },
        })),

      updateMessage: (channelId, messageId, updates) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [channelId]: state.messages[channelId]?.map((msg) =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
          },
        })),

      deleteMessage: (channelId, messageId) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [channelId]: state.messages[channelId]?.filter((msg) => msg.id !== messageId),
          },
        })),

      clearChannel: (channelId) =>
        set((state) => {
          const { [channelId]: _, ...rest } = state.messages
          return { messages: rest }
        }),
    }),
    { name: 'chat-store' }
  )
)
