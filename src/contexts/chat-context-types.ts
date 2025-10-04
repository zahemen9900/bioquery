import { createContext, useContext } from 'react'

// ChatSummary represents a persisted chat when id is a UUID from the backend.
// During optimistic creation (before the first user message) we may create a temporary record
// with an id shaped like `temp-<timestamp>` that exists only in the client cache.
type ChatSummary = {
  id: string
  user_id: string
  chat_name: string | null
  is_starred: boolean
  summary: string | null
  date_last_modified: string
  created_at: string
}

type ChatMessage = {
  id: number
  chat_id: string
  sender: 'user' | 'assistant' | 'system'
  content: string
  tool_calls: Record<string, unknown>[]
  tool_contents: Record<string, unknown>[]
  created_at: string
}

type ChatContextValue = {
  starredChats: ChatSummary[]
  recentChats: ChatSummary[]
  selectedChatId: string | null
  selectedChat: ChatSummary | null
  chatsLoading: boolean
  messagesLoading: boolean
  messages: ChatMessage[]
  selectChat: (chatId: string | null) => void
  createChat: (initialName?: string) => Promise<ChatSummary | null>
  refreshChats: () => Promise<void>
  refreshMessages: (chatId?: string) => Promise<void>
  sendMessage: (content: string, sender?: 'user' | 'assistant' | 'system', chatId?: string) => Promise<ChatMessage | null>
  reset: () => void
}

export const ChatContext = createContext<ChatContextValue | undefined>(undefined)

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChat must be used within a ChatProvider')
  return context
}

export type { ChatSummary, ChatMessage, ChatContextValue }
