import { Tables } from './database'

export type BroadcastEvent = 'message' | 'typing' | 'presence'

export interface MessageBroadcast {
  type: 'message'
  payload: Tables<'messages'>
}

export interface TypingBroadcast {
  type: 'typing'
  payload: {
    userId: string
    username: string
    isTyping: boolean
  }
}

export interface PresenceBroadcast {
  type: 'presence'
  payload: {
    userId: string
    username: string
    status: 'online' | 'offline' | 'away'
  }
}

export type Broadcast = MessageBroadcast | TypingBroadcast | PresenceBroadcast
