import { createContext, useContext } from 'react'

import type { ChatMessage, ChatSummary } from '@/services/chats'

export interface ChatContextValue {
  chats: ChatSummary[]
  starredChats: ChatSummary[]
  recentChats: ChatSummary[]
  selectedChatId: string | null
  selectedChat: ChatSummary | null
  chatsLoading: boolean
  messages: ChatMessage[]
  messagesLoading: boolean
  createChat: (chatName?: string | null) => Promise<ChatSummary | null>
  selectChat: (chatId: string | null) => void
  renameChat: (chatId: string, chatName: string) => Promise<void>
  toggleStarChat: (chatId: string, isStarred: boolean) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  sendUserMessage: (chatId: string, content: string, attachments?: string[]) => Promise<void>
  refreshChats: () => Promise<void>
  reset: () => void
}

export const ChatContext = createContext<ChatContextValue | undefined>(undefined)

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
