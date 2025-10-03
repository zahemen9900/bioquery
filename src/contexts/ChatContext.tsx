import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/contexts/auth-context-types'
import {
  appendChatMessage,
  createChat as createChatRecord,
  deleteChat as deleteChatRecord,
  fetchChatMessages,
  fetchChats,
  renameChat as renameChatRecord,
  toggleStarChat as toggleStarChatRecord,
  touchChat,
  type ChatMessage,
  type ChatSummary,
} from '@/services/chats'

import { ChatContext, type ChatContextValue } from './chat-context-types'

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [chatsLoading, setChatsLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  const reset = useCallback(() => {
    setChats([])
    setSelectedChatId(null)
    setMessages([])
    setChatsLoading(false)
    setMessagesLoading(false)
  }, [])

  const refreshChats = useCallback(async () => {
    if (!user?.id) return

    setChatsLoading(true)
    try {
      const data = await fetchChats(user.id)
      setChats(data)

      if (data.length === 0) {
        setSelectedChatId(null)
        return
      }

      if (!selectedChatId) {
        setSelectedChatId(data[0].id)
        return
      }

      const stillSelected = data.some((chat) => chat.id === selectedChatId)
      if (!stillSelected) {
        setSelectedChatId(data[0].id)
      }
    } finally {
      setChatsLoading(false)
    }
  }, [selectedChatId, user?.id])

  useEffect(() => {
    if (!user?.id) {
      reset()
      return
    }

    refreshChats().catch(console.error)
  }, [refreshChats, reset, user?.id])

  const selectedChat = useMemo(() => chats.find((chat) => chat.id === selectedChatId) ?? null, [chats, selectedChatId])

  const loadMessages = useCallback(
    async (chatId: string | null) => {
      if (!chatId) {
        setMessages([])
        return
      }

      setMessagesLoading(true)
      try {
        const data = await fetchChatMessages(chatId)
        setMessages(data)
      } finally {
        setMessagesLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    loadMessages(selectedChatId).catch(console.error)
  }, [loadMessages, selectedChatId])

  const createChat = useCallback(
    async (chatName: string | null = null) => {
      if (!user?.id) return null

      const newChat = await createChatRecord(user.id, chatName)
      setChats((prev) => [newChat, ...prev])
      setSelectedChatId(newChat.id)
      setMessages([])
      return newChat
    },
    [user?.id],
  )

  const selectChat = useCallback((chatId: string | null) => {
    setSelectedChatId(chatId)
  }, [])

  const renameChat = useCallback(async (chatId: string, chatName: string) => {
    const updated = await renameChatRecord(chatId, chatName)
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? updated : chat)))
  }, [])

  const toggleStarChat = useCallback(async (chatId: string, isStarred: boolean) => {
    const updated = await toggleStarChatRecord(chatId, isStarred)
    setChats((prev) => {
      const next = prev.map((chat) => (chat.id === chatId ? updated : chat))
      return next.sort((a, b) => {
        const starA = a.is_starred ? 1 : 0
        const starB = b.is_starred ? 1 : 0
        if (starA !== starB) return starB - starA
        return new Date(b.date_last_modified).getTime() - new Date(a.date_last_modified).getTime()
      })
    })
  }, [])

  const deleteChat = useCallback(
    async (chatId: string) => {
      await deleteChatRecord(chatId)
      setChats((prev) => prev.filter((chat) => chat.id !== chatId))

      if (selectedChatId === chatId) {
        setSelectedChatId(null)
        setMessages([])
      }
    },
    [selectedChatId],
  )

  const sendUserMessage = useCallback(
    async (chatId: string, content: string, attachments: string[] = []) => {
      const message = await appendChatMessage(chatId, {
        chat_id: chatId,
        sender: 'user',
        content,
        tool_calls: [],
        tool_contents: [],
        attached_files: attachments,
      })

      setMessages((prev) => [...prev, message])
      await touchChat(chatId)
      setChats((prev) =>
        prev
          .map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  date_last_modified: message.created_at,
                }
              : chat,
          )
          .sort((a, b) => {
            const starA = a.is_starred ? 1 : 0
            const starB = b.is_starred ? 1 : 0
            if (starA !== starB) return starB - starA
            return new Date(b.date_last_modified).getTime() - new Date(a.date_last_modified).getTime()
          }),
      )
    },
    [],
  )

  const starredChats = useMemo(() => chats.filter((chat) => chat.is_starred), [chats])
  const recentChats = useMemo(() => chats.filter((chat) => !chat.is_starred), [chats])

  const value: ChatContextValue = {
    chats,
    starredChats,
    recentChats,
    selectedChatId,
    selectedChat,
    chatsLoading,
    messages,
    messagesLoading,
    createChat,
    selectChat,
    renameChat,
    toggleStarChat,
    deleteChat,
    sendUserMessage,
    refreshChats,
    reset,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export default ChatProvider
