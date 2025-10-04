import supabase, { supabaseUrl } from '@/lib/supabase-client'
import type { ChatMessage, ChatSummary, GroundingSource } from '@/contexts/chat-context-types'

type StreamThoughtEvent = {
	type: 'thought'
	delta: string
}

type StreamResponseEvent = {
	type: 'response'
	delta: string
}

type StreamCompleteEvent = {
	type: 'complete'
	chat: ChatSummary
	messages: ChatMessage[]
	thoughts: string
	sources?: GroundingSource[]
}

type StreamErrorEvent = {
	type: 'error'
	message: string
}

export type ChatStreamEvent = StreamThoughtEvent | StreamResponseEvent | StreamCompleteEvent | StreamErrorEvent

const FUNCTIONS_BASE_URL = supabaseUrl ? `${supabaseUrl}/functions/v1` : null

const decoder = new TextDecoder()

async function getAccessToken(): Promise<string | null> {
	const { data } = await supabase.auth.getSession()
	return data.session?.access_token ?? null
}

export async function* streamChatResponse({
	chatId,
	message,
	chatTitle,
	signal,
}: {
	chatId?: string
	message: string
	chatTitle?: string | null
	signal?: AbortSignal
}): AsyncGenerator<ChatStreamEvent> {
	if (!FUNCTIONS_BASE_URL) {
		throw new Error('Supabase functions URL is not configured')
	}

	const accessToken = await getAccessToken()

	const response = await fetch(`${FUNCTIONS_BASE_URL}/chat-stream`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
		},
		body: JSON.stringify({ chatId, message, chatTitle }),
		signal,
	})

	if (!response.ok || !response.body) {
		const errorText = await response.text().catch(() => '')
		throw new Error(errorText || 'Failed to start chat stream')
	}

	const reader = response.body.getReader()
	let buffer = ''

	try {
		while (true) {
			const { done, value } = await reader.read()
			if (done) break

			buffer += decoder.decode(value, { stream: true })

			let newlineIndex = buffer.indexOf('\n')
			while (newlineIndex !== -1) {
				const chunk = buffer.slice(0, newlineIndex).trim()
				buffer = buffer.slice(newlineIndex + 1)

				if (chunk.length > 0) {
					const parsed = JSON.parse(chunk) as ChatStreamEvent
					yield parsed

					if (parsed.type === 'error') {
						return
					}
				}

				newlineIndex = buffer.indexOf('\n')
			}
		}

		if (buffer.trim().length > 0) {
			const parsed = JSON.parse(buffer.trim()) as ChatStreamEvent
			yield parsed
		}
	} finally {
		reader.releaseLock()
	}
}

export type ChatTitleResult = {
	title: string
	didFallback: boolean
}

export async function generateChatTitle(prompt: string, signal?: AbortSignal): Promise<ChatTitleResult> {
	if (!FUNCTIONS_BASE_URL) {
		return { title: 'Untitled chat', didFallback: true }
	}

	if (!prompt.trim()) {
		return { title: 'Untitled chat', didFallback: true }
	}

	const accessToken = await getAccessToken()

	const response = await fetch(`${FUNCTIONS_BASE_URL}/chat-title`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
		},
		body: JSON.stringify({ message: prompt }),
		signal,
	})

	if (!response.ok) {
		return { title: 'Untitled chat', didFallback: true }
	}

	const payload = (await response.json().catch(() => null)) as ChatTitleResult | null

	if (!payload) {
		return { title: 'Untitled chat', didFallback: true }
	}

	const cleanedTitle = payload.title?.trim() ?? ''
	return {
		title: cleanedTitle || 'Untitled chat',
		didFallback: payload.didFallback || cleanedTitle.length === 0,
	}
}
