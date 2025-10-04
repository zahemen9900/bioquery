import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import supabase from '@/lib/supabase-client'
import { useAuth } from './auth-context-types'
import { ChatContext, type ChatContextValue, type ChatMessage, type ChatSummary } from './chat-context-types'

interface ChatProviderProps {
  children: React.ReactNode
}

const mapChat = (entry: ChatSummary): ChatSummary => ({
  ...entry,
  chat_name: entry.chat_name?.trim() || null,
})

export function ChatProvider({ children }: ChatProviderProps) {
  const { user } = useAuth()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  // Local optimistic state for messages per chat id
  const optimisticMessagesRef = useRef<Record<string, ChatMessage[]>>({})
  const queryClient = useQueryClient()

  const chatsKey = useMemo(() => ['chats', user?.id], [user?.id])
  const messagesKey = (chatId: string | null) => ['messages', chatId]

  const fetchChats = useCallback(async (): Promise<ChatSummary[]> => {
    if (!user) return []
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('is_starred', { ascending: false })
      .order('date_last_modified', { ascending: false })
    if (error) {
      console.error('Failed to load chats', error)
      return []
    }
    return (data ?? []).map(mapChat)
  }, [user])

  const { data: chatSummaries = [], isLoading: chatsLoading } = useQuery({
    queryKey: chatsKey,
    queryFn: fetchChats,
    enabled: !!user,
  })

  const fetchMessages = useCallback(async (): Promise<ChatMessage[]> => {
    if (!user || !selectedChatId) return []
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', selectedChatId)
      .order('created_at', { ascending: true })
    if (error) {
      console.error('Failed to load messages', error)
      return []
    }
    return data ?? []
  }, [selectedChatId, user])

  const {
    data: messages = [],
    isLoading: messagesLoading,
  } = useQuery({
    queryKey: messagesKey(selectedChatId),
    queryFn: fetchMessages,
    enabled: !!user && !!selectedChatId,
  })

  const reset = useCallback(() => {
    setSelectedChatId(null)
    optimisticMessagesRef.current = {}
    queryClient.removeQueries({ queryKey: chatsKey })
  }, [chatsKey, queryClient])

  const refreshChats = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: chatsKey })
  }, [chatsKey, queryClient])

  const refreshMessages = useCallback(
    async (chatIdParam?: string) => {
      const chatId = chatIdParam ?? selectedChatId
      if (!chatId) return
      await queryClient.invalidateQueries({ queryKey: messagesKey(chatId) })
    },
    [queryClient, selectedChatId],
  )

  const selectChat = useCallback((chatId: string | null) => {
    setSelectedChatId(chatId)
  }, [])

  // We defer actual DB creation until first user message is sent.
  const createChat = useCallback(async (initialName?: string) => {
    // Create a temporary local ID (client-only) until first message persists it.
    const tempId = `temp-${Date.now()}`
    const tempChat: ChatSummary = {
      id: tempId,
      user_id: user?.id || 'anonymous',
      chat_name: initialName?.trim() || null,
      is_starred: false,
      summary: null,
      date_last_modified: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    // Optimistically add to cache
    queryClient.setQueryData<ChatSummary[]>(chatsKey, (old = []) => [tempChat, ...old])
    setSelectedChatId(tempId)
    return tempChat
  }, [chatsKey, queryClient, user?.id])

  const sendMessage = useCallback<ChatContextValue['sendMessage']>(
    async (content, sender = 'user', chatIdParam) => {
      if (!user) return null
      let chatId = chatIdParam ?? selectedChatId

      // If chatId is a temp id or missing, persist a new chat first (only once we have a user message)
      if (!chatId || chatId.startsWith('temp-')) {
        const { data: persisted, error: chatErr } = await supabase
          .from('chats')
          .insert({ user_id: user.id, chat_name: null })
          .select('*')
          .single<ChatSummary>()
        if (chatErr || !persisted) {
          console.error('Failed to create chat for first message', chatErr)
          return null
        }
        const mapped = mapChat(persisted)
        chatId = mapped.id
        // Replace temp chat in cache
        queryClient.setQueryData<ChatSummary[]>(chatsKey, (old = []) => {
          return [mapped, ...old.filter((c) => !c.id.startsWith('temp-'))]
        })
        setSelectedChatId(chatId)
      }

      const optimisticMessage: ChatMessage = {
        id: Date.now(),
        chat_id: chatId,
        sender,
        content,
        tool_calls: [],
        tool_contents: [],
        created_at: new Date().toISOString(),
      }
      optimisticMessagesRef.current[chatId] = [...(optimisticMessagesRef.current[chatId] || []), optimisticMessage]
      queryClient.setQueryData<ChatMessage[]>(messagesKey(chatId), (old = []) => [...old, optimisticMessage])

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ chat_id: chatId, sender, content })
        .select('*')
        .single<ChatMessage>()

      if (error || !data) {
        console.error('Failed to send message', error)
        // rollback optimistic
        queryClient.setQueryData<ChatMessage[]>(messagesKey(chatId), (old = []) => old.filter((m) => m.id !== optimisticMessage.id))
        return null
      }

      // Replace optimistic with real
      queryClient.setQueryData<ChatMessage[]>(messagesKey(chatId), (old = []) =>
        old.map((m) => (m.id === optimisticMessage.id ? data : m)),
      )

      await supabase
        .from('chats')
        .update({ date_last_modified: new Date().toISOString() })
        .eq('id', chatId)

      await refreshChats()
      return data
    },
    [chatsKey, queryClient, refreshChats, selectedChatId, user],
  )

  useEffect(() => {
    if (!user) reset()
  }, [reset, user])

  const starredChats = useMemo(() => chatSummaries.filter((chat) => chat.is_starred), [chatSummaries])
  const recentChats = useMemo(() => chatSummaries.filter((chat) => !chat.is_starred), [chatSummaries])
  const selectedChat = useMemo(
    () => chatSummaries.find((chat) => chat.id === selectedChatId) ?? null,
    [chatSummaries, selectedChatId],
  )

  const value: ChatContextValue = useMemo(
    () => ({
      starredChats,
      recentChats,
      selectedChatId,
      selectedChat,
      chatsLoading,
      messagesLoading,
      messages,
      selectChat,
      createChat,
      refreshChats,
      refreshMessages,
      sendMessage,
      reset,
    }),
    [
      chatsLoading,
      createChat,
      messages,
      messagesLoading,
      recentChats,
      refreshChats,
      refreshMessages,
      reset,
      selectChat,
      sendMessage,
      selectedChat,
      selectedChatId,
      starredChats,
    ],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export default ChatProvider
