import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import supabase from '@/lib/supabase-client'
import { useAuth } from './auth-context-types'
import {
  ChatContext,
  type ActiveStreamState,
  type ChatContextValue,
  type ChatMessage,
  type ChatSummary,
  type GroundingSource,
  type GroundingSupportSnippet,
  type ToolMode,
} from './chat-context-types'
import { generateChatTitle, streamChatResponse } from '@/services/chat-service'

interface ChatProviderProps {
  children: React.ReactNode
}

const mapChat = (entry: ChatSummary): ChatSummary => ({
  ...entry,
  chat_name: entry.chat_name?.trim() || null,
})

const sortMessages = (entries: ChatMessage[]): ChatMessage[] =>
  [...entries].sort((a, b) => {
    const createdDelta = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (createdDelta !== 0) return createdDelta
    return Number(a.id) - Number(b.id)
  })

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const parseSupportSnippets = (value: unknown): GroundingSupportSnippet[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (!isRecord(entry)) return null
      const text = typeof entry.text === 'string' ? entry.text : null
      const startIndex = typeof entry.startIndex === 'number' ? entry.startIndex : null
      const endIndex = typeof entry.endIndex === 'number' ? entry.endIndex : null
      if (!text && startIndex === null && endIndex === null) return null
      return {
        text,
        startIndex,
        endIndex,
      }
    })
    .filter((entry): entry is GroundingSupportSnippet => Boolean(entry))
}

const parseGroundingSources = (toolContents: Record<string, unknown>[] | null | undefined): GroundingSource[] => {
  if (!Array.isArray(toolContents) || toolContents.length === 0) return []

  const entry = toolContents.find((item) => isRecord(item) && item.type === 'grounding_sources')
  if (!isRecord(entry)) return []

  const sourcesValue = entry.sources
  if (!Array.isArray(sourcesValue)) return []

  return sourcesValue
    .map((source) => {
      if (!isRecord(source)) return null

      const id = typeof source.id === 'number' ? source.id : Number(source.id)
      if (!Number.isFinite(id) || id <= 0) return null

      const title = typeof source.title === 'string' ? source.title : null
      const url = typeof source.url === 'string' ? source.url : null
      const domain = typeof source.domain === 'string' ? source.domain : null
      const favicon = typeof source.favicon === 'string' ? source.favicon : null
      const retrievalStatus = typeof source.retrievalStatus === 'string' ? source.retrievalStatus : null
      const supports = parseSupportSnippets(source.supports)

      return {
        id,
        title,
        url,
        domain,
        favicon,
        retrievalStatus,
        supports,
      }
    })
    .filter((source): source is GroundingSource => Boolean(source))
    .sort((a, b) => a.id - b.id)
}

const hydrateMessage = (entry: ChatMessage, overrides?: Partial<ChatMessage>): ChatMessage => ({
  ...entry,
  ...overrides,
  thoughts: entry.thoughts ?? null,
  feedback: entry.feedback ?? null,
  sources: Array.isArray(entry.sources) && entry.sources.length > 0 ? entry.sources : parseGroundingSources(entry.tool_contents),
  pending: overrides?.pending ?? entry.pending ?? false,
})

type OptimisticToolCall = {
  id: number
  name: string
  status: 'pending' | 'success' | 'error'
  args: Record<string, unknown> | null
  result: Record<string, unknown> | null
  error: string | null
}

const serializeToolCalls = (calls: OptimisticToolCall[]): Record<string, unknown>[] =>
  calls.map((call) => ({
    id: call.id,
    name: call.name,
    status: call.status,
    args: call.args,
    result: call.result,
    error: call.error,
  }))

const normalizeToolId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  if (Number.isFinite(parsed)) return parsed
  return null
}

const upsertToolContentEntry = (
  current: Record<string, unknown>[],
  entry: Record<string, unknown>,
): Record<string, unknown>[] => {
  if (entry?.type === 'grounding_sources') {
    const others = current.filter((item) => item?.type !== 'grounding_sources')
    return [...others, entry]
  }

  const toolId = normalizeToolId(entry?.tool_id)
  const entryType = typeof entry?.type === 'string' ? entry.type : null
  if (!toolId || !entryType) return current

  const others = current.filter((item) => {
    if (item?.type === 'grounding_sources') return true
    const existingToolId = normalizeToolId(item?.tool_id)
    return !(existingToolId === toolId && item?.type === entryType)
  })

  return [...others, { ...entry, tool_id: toolId }]
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { user } = useAuth()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [activeStream, setActiveStream] = useState<ActiveStreamState | null>(null)
  const [toolMode, setToolMode] = useState<ToolMode>('research-tools')
  const queryClient = useQueryClient()

  const chatsKey = useMemo(() => ['chats', user?.id], [user?.id])
  const messagesKey = useCallback((chatId: string | null) => ['messages', chatId] as const, [])

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
    if (!user || !selectedChatId || selectedChatId.startsWith('temp-')) return []
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', selectedChatId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
    if (error) {
      console.error('Failed to load messages', error)
      return []
    }
    return sortMessages((data ?? []).map((entry) => hydrateMessage(entry as ChatMessage, { pending: false })))
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
    setActiveStream(null)
    setToolMode('research-tools')
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
    [messagesKey, queryClient, selectedChatId],
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

      const trimmed = content.trim()
      if (!trimmed) return null

      let activeChatId = chatIdParam ?? selectedChatId
      let isTemporary = false

      if (!activeChatId) {
        const tempChat = await createChat('Untitled chat')
        activeChatId = tempChat?.id ?? null
        isTemporary = !!(activeChatId && activeChatId.startsWith('temp-'))
      } else if (activeChatId.startsWith('temp-')) {
        isTemporary = true
      }

      if (!activeChatId) {
        console.error('No chat id available for message dispatch')
        return null
      }

      const messagesCacheKey = messagesKey(activeChatId)
      const nowIso = new Date().toISOString()

      const optimisticUser: ChatMessage = {
        id: Date.now(),
        chat_id: activeChatId,
        sender,
        content: trimmed,
        thoughts: null,
        tool_calls: [],
        tool_contents: [],
        created_at: nowIso,
        pending: true,
        feedback: null,
        sources: [],
      }

  const assistantPlaceholderId = -Date.now()
      let assistantContent = ''
      let assistantThoughts = ''

      let assistantOptimistic: ChatMessage = {
        id: assistantPlaceholderId,
        chat_id: activeChatId,
        sender: 'assistant',
        content: '',
        thoughts: '',
        tool_calls: [],
        tool_contents: [],
        created_at: nowIso,
        pending: true,
        feedback: null,
        sources: [],
      }

      queryClient.setQueryData<ChatMessage[]>(messagesCacheKey, (old = []) => [...old, optimisticUser, assistantOptimistic])

      setActiveStream({
        chatId: activeChatId,
        messageId: assistantPlaceholderId,
        stage: 'pending',
        thoughts: '',
      })

      const titlePromise = isTemporary
        ? generateChatTitle(trimmed).catch(() => ({ title: 'Untitled chat', didFallback: true }))
        : Promise.resolve({ title: '', didFallback: true })

      try {
        const stream = streamChatResponse({
          chatId: isTemporary ? undefined : activeChatId,
          message: trimmed,
          chatTitle: isTemporary ? 'Untitled chat' : undefined,
          toolMode,
        })

        let finalChat: ChatSummary | null = null
        let finalMessages: ChatMessage[] = []
        let toolCallState: OptimisticToolCall[] = []
        let toolContentState: Record<string, unknown>[] = []

        const syncAssistant = () => {
          assistantOptimistic = {
            ...assistantOptimistic,
            content: assistantContent,
            thoughts: assistantThoughts,
            tool_calls: serializeToolCalls(toolCallState),
            tool_contents: [...toolContentState],
          }

          queryClient.setQueryData<ChatMessage[]>(messagesCacheKey, (old = []) =>
            old.map((message) => (message.id === assistantPlaceholderId ? assistantOptimistic : message)),
          )
        }

        for await (const event of stream) {
          if (event.type === 'thought') {
            assistantThoughts += event.delta
            assistantOptimistic = {
              ...assistantOptimistic,
              thoughts: assistantThoughts,
            }
            setActiveStream((current) =>
              current && current.chatId === activeChatId && current.messageId === assistantPlaceholderId
                ? { ...current, stage: 'thinking', thoughts: assistantThoughts }
                : current,
            )
            syncAssistant()
          } else if (event.type === 'response') {
            assistantContent += event.delta
            assistantOptimistic = {
              ...assistantOptimistic,
              content: assistantContent,
              thoughts: assistantThoughts,
            }
            setActiveStream((current) =>
              current && current.chatId === activeChatId && current.messageId === assistantPlaceholderId
                ? { ...current, stage: 'responding', thoughts: assistantThoughts }
                : current,
            )
            syncAssistant()
          } else if (event.type === 'tool_start') {
            const existingIndex = toolCallState.findIndex((call) => call.id === event.tool.id)
            const baseEntry: OptimisticToolCall = {
              id: event.tool.id,
              name: event.tool.name,
              status: 'pending',
              args: null,
              result: null,
              error: null,
            }

            if (existingIndex >= 0) {
              toolCallState = toolCallState.map((call, index) => (index === existingIndex ? baseEntry : call))
            } else {
              toolCallState = [...toolCallState, baseEntry]
            }

            syncAssistant()
          } else if (event.type === 'tool_result') {
            const hasExisting = toolCallState.some((call) => call.id === event.tool.id)
            if (!hasExisting) {
              toolCallState = [
                ...toolCallState,
                {
                  id: event.tool.id,
                  name: event.tool.name,
                  status: event.status,
                  args: null,
                  result: event.summary ? { summary: event.summary } : null,
                  error: event.status === 'error' ? event.error ?? 'Tool execution failed' : null,
                },
              ]
            } else {
              toolCallState = toolCallState.map((call) =>
                call.id === event.tool.id
                  ? {
                      ...call,
                      name: event.tool.name,
                      status: event.status,
                      result: event.summary ? { summary: event.summary } : call.result,
                      error: event.status === 'error' ? event.error ?? 'Tool execution failed' : null,
                    }
                  : call,
              )
            }

            if (event.content && typeof event.content === 'object' && !Array.isArray(event.content)) {
              toolContentState = upsertToolContentEntry(toolContentState, event.content as Record<string, unknown>)
            }

            syncAssistant()
          } else if (event.type === 'complete') {
            finalChat = mapChat(event.chat)
            finalMessages = sortMessages(
              (event.messages ?? []).map((message) => hydrateMessage(message, { pending: false })),
            )
          } else if (event.type === 'error') {
            throw new Error(event.message || 'Streaming request failed')
          }
        }

        if (!finalChat) {
          throw new Error('Chat stream did not return completion payload')
        }

        const resolvedChatId = finalChat.id

        if (isTemporary) {
          queryClient.setQueryData<ChatSummary[]>(chatsKey, (old = []) => {
            const filtered = old.filter((chat) => chat.id !== activeChatId)
            return [finalChat!, ...filtered]
          })

          queryClient.removeQueries({ queryKey: messagesKey(activeChatId) })
          queryClient.setQueryData<ChatMessage[]>(messagesKey(resolvedChatId), () => sortMessages(finalMessages))
          setSelectedChatId(resolvedChatId)
        } else {
          queryClient.setQueryData<ChatSummary[]>(chatsKey, (old = []) =>
            old.map((chat) => (chat.id === resolvedChatId ? finalChat! : chat)),
          )

          queryClient.setQueryData<ChatMessage[]>(messagesKey(resolvedChatId), (old = []) => {
            const preserved = old.filter(
              (message) => message.id !== optimisticUser.id && message.id !== assistantPlaceholderId,
            )
            return sortMessages([...preserved, ...finalMessages])
          })
        }

        setActiveStream(null)
        await refreshChats()
        await refreshMessages(resolvedChatId)

        if (isTemporary) {
          const titleResult = await titlePromise
          const finalTitle = titleResult.title.trim()

          if (!titleResult.didFallback && finalTitle) {
            const { data: updatedChat, error: updateError } = await supabase
              .from('chats')
              .update({ chat_name: finalTitle })
              .eq('id', resolvedChatId)
              .select('*')
              .single<ChatSummary>()

            if (!updateError && updatedChat) {
              const mapped = mapChat(updatedChat)
              queryClient.setQueryData<ChatSummary[]>(chatsKey, (old = []) =>
                old.map((chat) => (chat.id === mapped.id ? mapped : chat)),
              )
              await refreshChats()
            }
          }
        }

        return finalMessages.at(-1) ?? null
      } catch (error) {
        console.error('Failed to stream chat message', error)
        queryClient.setQueryData<ChatMessage[]>(messagesCacheKey, (old = []) =>
          old.filter((message) => message.id !== assistantPlaceholderId && message.id !== optimisticUser.id),
        )

        if (isTemporary) {
          queryClient.setQueryData<ChatSummary[]>(chatsKey, (old = []) => old.filter((chat) => chat.id !== activeChatId))
          setSelectedChatId(null)
        }

        setActiveStream(null)
        return null
      }
    },
    [chatsKey, createChat, messagesKey, queryClient, refreshChats, refreshMessages, selectedChatId, toolMode, user],
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

  const renameChat = useCallback<ChatContextValue['renameChat']>(
    async (chatId, chatName) => {
      if (!user || !chatId || chatId.startsWith('temp-')) return null

      const trimmed = chatName?.trim() ?? ''
      const { data, error } = await supabase
        .from('chats')
        .update({ chat_name: trimmed.length > 0 ? trimmed : null })
        .eq('id', chatId)
        .eq('user_id', user.id)
        .select('*')
        .single<ChatSummary>()

      if (error || !data) {
        console.error('Failed to rename chat', error)
        return null
      }

      const mapped = mapChat(data)

      queryClient.setQueryData<ChatSummary[]>(chatsKey, (old = []) =>
        old.map((chat) => (chat.id === chatId ? mapped : chat)),
      )

      await refreshChats()
      return mapped
    },
    [chatsKey, queryClient, refreshChats, user],
  )

  const toggleStar = useCallback<ChatContextValue['toggleStar']>(
    async (chatId, isStarred) => {
      if (!user || !chatId || chatId.startsWith('temp-')) return null

      const { data, error } = await supabase
        .from('chats')
        .update({ is_starred: isStarred })
        .eq('id', chatId)
        .eq('user_id', user.id)
        .select('*')
        .single<ChatSummary>()

      if (error || !data) {
        console.error('Failed to toggle star', error)
        return null
      }

      const mapped = mapChat(data)

      queryClient.setQueryData<ChatSummary[]>(chatsKey, (old = []) =>
        old.map((chat) => (chat.id === chatId ? mapped : chat)),
      )

      await refreshChats()
      return mapped
    },
    [chatsKey, queryClient, refreshChats, user],
  )

  const deleteChat = useCallback<ChatContextValue['deleteChat']>(
    async (chatId) => {
      if (!user || !chatId || chatId.startsWith('temp-')) return false

      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Failed to delete chat', error)
        return false
      }

      queryClient.setQueryData<ChatSummary[]>(chatsKey, (old = []) =>
        old.filter((chat) => chat.id !== chatId),
      )
      queryClient.removeQueries({ queryKey: messagesKey(chatId) })

      if (selectedChatId === chatId) {
        setSelectedChatId(null)
        setActiveStream((current) => (current?.chatId === chatId ? null : current))
      }

      await refreshChats()
      return true
    },
    [chatsKey, messagesKey, queryClient, refreshChats, selectedChatId, user],
  )

  const updateMessageFeedback = useCallback<ChatContextValue['updateMessageFeedback']>(
    async (messageId, chatId, feedback) => {
      if (!user || !chatId || chatId.startsWith('temp-')) return false

      const updates = feedback
        ? {
            feedback,
            feedback_user_id: user.id,
            feedback_updated_at: new Date().toISOString(),
          }
        : {
            feedback: null,
            feedback_user_id: null,
            feedback_updated_at: null,
          }

      const { data, error } = await supabase
        .from('chat_messages')
        .update(updates)
        .eq('id', messageId)
        .eq('chat_id', chatId)
        .select('*')
        .single<ChatMessage>()

      if (error || !data) {
        console.error('Failed to update message feedback', error)
        return false
      }

      const normalized = hydrateMessage(data, { pending: false })

      queryClient.setQueryData<ChatMessage[]>(messagesKey(chatId), (old = []) =>
        sortMessages(old.map((message) => (message.id === messageId ? normalized : message))),
      )

      await refreshMessages(chatId)
      return true
    },
    [messagesKey, queryClient, refreshMessages, user],
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
      activeStream,
      toolMode,
      setToolMode,
      selectChat,
      createChat,
      refreshChats,
      refreshMessages,
      sendMessage,
      updateMessageFeedback,
      renameChat,
      toggleStar,
      deleteChat,
      reset,
    }),
    [
      activeStream,
      chatsLoading,
      createChat,
      deleteChat,
      messages,
      messagesLoading,
      recentChats,
      refreshChats,
      refreshMessages,
      renameChat,
      reset,
      selectChat,
      sendMessage,
      selectedChat,
      selectedChatId,
      starredChats,
      toggleStar,
      updateMessageFeedback,
      toolMode,
      setToolMode,
    ],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export default ChatProvider
