import type { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js'

import supabase from '@/lib/supabase-client'

export interface ChatSummary {
  id: string
  user_id: string
  chat_name: string | null
  created_at: string
  date_last_modified: string
  is_starred: boolean
}

export interface ChatMessage {
  id: number
  chat_id: string
  sender: 'user' | 'assistant' | 'system'
  content: string
  tool_calls: Record<string, unknown>[]
  tool_contents: Record<string, unknown>[]
  attached_files: string[]
  created_at: string
}

type RawChatSummary = Omit<ChatSummary, 'is_starred'> & { is_starred: boolean | null }
type RawChatMessage = Omit<ChatMessage, 'tool_calls' | 'tool_contents' | 'attached_files'> & {
  tool_calls: Record<string, unknown>[] | null
  tool_contents: Record<string, unknown>[] | null
  attached_files: string[] | null
}

const CHAT_FIELDS = 'id, user_id, chat_name, created_at, date_last_modified, is_starred'
const MESSAGE_FIELDS =
  'id, chat_id, sender, content, tool_calls, tool_contents, attached_files, created_at'

function normalizeChatSummary(chat: RawChatSummary): ChatSummary {
  return {
    ...chat,
    is_starred: Boolean(chat.is_starred),
  }
}

function normalizeChatMessage(message: RawChatMessage): ChatMessage {
  return {
    ...message,
    tool_calls: message.tool_calls ?? [],
    tool_contents: message.tool_contents ?? [],
    attached_files: message.attached_files ?? [],
  }
}

export async function fetchChats(userId: string) {
  const { data, error }: PostgrestResponse<RawChatSummary> = await supabase
    .from('chats')
    .select(CHAT_FIELDS)
    .eq('user_id', userId)
    .order('is_starred', { ascending: false })
    .order('date_last_modified', { ascending: false })

  if (error) throw error
  return (data ?? []).map(normalizeChatSummary)
}

export async function createChat(userId: string, chatName: string | null = null) {
  const { data, error }: PostgrestSingleResponse<RawChatSummary> = await supabase
    .from('chats')
    .insert({ user_id: userId, chat_name: chatName })
    .select(CHAT_FIELDS)
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to create chat')
  return normalizeChatSummary(data)
}

export async function renameChat(chatId: string, chatName: string) {
  const { data, error }: PostgrestSingleResponse<RawChatSummary> = await supabase
    .from('chats')
    .update({ chat_name: chatName, date_last_modified: new Date().toISOString() })
    .eq('id', chatId)
    .select(CHAT_FIELDS)
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to rename chat')
  return normalizeChatSummary(data)
}

export async function toggleStarChat(chatId: string, isStarred: boolean) {
  const { data, error }: PostgrestSingleResponse<RawChatSummary> = await supabase
    .from('chats')
    .update({ is_starred: isStarred })
    .eq('id', chatId)
    .select(CHAT_FIELDS)
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to toggle chat star state')
  return normalizeChatSummary(data)
}

export async function deleteChat(chatId: string) {
  const { error } = await supabase.from('chats').delete().eq('id', chatId)
  if (error) throw error
}

export async function fetchChatMessages(chatId: string) {
  const { data, error }: PostgrestResponse<RawChatMessage> = await supabase
    .from('chat_messages')
    .select(MESSAGE_FIELDS)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(normalizeChatMessage)
}

export async function appendChatMessage(chatId: string, payload: Omit<ChatMessage, 'id' | 'created_at'>) {
  const { data, error }: PostgrestSingleResponse<RawChatMessage> = await supabase
    .from('chat_messages')
    .insert({
      chat_id: chatId,
      sender: payload.sender,
      content: payload.content,
      tool_calls: payload.tool_calls ?? [],
      tool_contents: payload.tool_contents ?? [],
      attached_files: payload.attached_files ?? [],
    })
    .select(MESSAGE_FIELDS)
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to append chat message')
  return normalizeChatMessage(data)
}

export async function touchChat(chatId: string) {
  const { error } = await supabase
    .from('chats')
    .update({ date_last_modified: new Date().toISOString() })
    .eq('id', chatId)

  if (error) throw error
}