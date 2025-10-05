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
  thoughts: string | null
  tool_calls: Record<string, unknown>[]
  tool_contents: Record<string, unknown>[]
  created_at: string
  pending?: boolean
  feedback: 'like' | 'dislike' | null
  feedback_user_id?: string | null
  feedback_updated_at?: string | null
  sources?: GroundingSource[]
}

type GroundingSupportSnippet = {
  text: string | null
  startIndex: number | null
  endIndex: number | null
}

type GroundingSource = {
  id: number
  title: string | null
  url: string | null
  domain: string | null
  favicon: string | null
  retrievalStatus: string | null
  supports: GroundingSupportSnippet[]
}

type ActiveStreamState = {
  chatId: string
  messageId: number
  stage: 'pending' | 'thinking' | 'responding'
  thoughts: string
}

type ToolMode = 'research-tools' | 'web-search'

type ChatContextValue = {
  starredChats: ChatSummary[]
  recentChats: ChatSummary[]
  selectedChatId: string | null
  selectedChat: ChatSummary | null
  chatsLoading: boolean
  messagesLoading: boolean
  messages: ChatMessage[]
  activeStream: ActiveStreamState | null
  toolMode: ToolMode
  setToolMode: (mode: ToolMode) => void
  selectChat: (chatId: string | null) => void
  createChat: (initialName?: string) => Promise<ChatSummary | null>
  refreshChats: () => Promise<void>
  refreshMessages: (chatId?: string) => Promise<void>
  sendMessage: (content: string, sender?: 'user' | 'assistant' | 'system', chatId?: string) => Promise<ChatMessage | null>
  updateMessageFeedback: (messageId: number, chatId: string, feedback: 'like' | 'dislike' | null) => Promise<boolean>
  renameChat: (chatId: string, chatName: string | null) => Promise<ChatSummary | null>
  toggleStar: (chatId: string, isStarred: boolean) => Promise<ChatSummary | null>
  deleteChat: (chatId: string) => Promise<boolean>
  reset: () => void
}

export const ChatContext = createContext<ChatContextValue | undefined>(undefined)

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChat must be used within a ChatProvider')
  return context
}

export type {
  ChatSummary,
  ChatMessage,
  ChatContextValue,
  ActiveStreamState,
  GroundingSource,
  GroundingSupportSnippet,
  ToolMode,
}
