import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.6"

export {}

const { serve } = await import("https://deno.land/std@0.224.0/http/server.ts")
const { GoogleGenAI } = await import("npm:@google/genai")
const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.47.6")

const getEnv = (key: string): string | undefined => {
  const deno = (globalThis as { Deno?: { env: { get(name: string): string | undefined } } }).Deno
  return deno?.env.get(key)
}

type ChatStreamRequestBody = {
  chatId?: string
  message?: string
  chatTitle?: string | null
}

type GeminiHistoryPart = {
  role: "user" | "model"
  parts: Array<{ text: string }>
}

type GeminiStreamPart = {
  text?: string
  thought?: boolean
}

type GeminiStreamContent = {
  parts?: GeminiStreamPart[]
}

type GeminiStreamCandidate = {
  content?: GeminiStreamContent
  groundingMetadata?: GroundingMetadata
  urlContextMetadata?: UrlContextMetadata
}

type GeminiStreamChunk = {
  candidates?: GeminiStreamCandidate[]
}

type GeminiChatSession = {
  sendMessageStream(options: {
    message: string
    config?: {
      tools?: Array<{ urlContext?: Record<string, never>; googleSearch?: Record<string, never> }>
      thinkingConfig?: {
        includeThoughts?: boolean
      }
    }
  }): Promise<AsyncIterable<GeminiStreamChunk>>
}

type GeminiClient = {
  chats: {
    create(options: { model: string; history?: GeminiHistoryPart[] }): GeminiChatSession
  }
}

type HistoryRow = {
  sender: "user" | "assistant" | "system"
  content: string | null
}

type PersistedChat = {
  id: string
  user_id: string
  chat_name: string | null
  is_starred: boolean
  summary: string | null
  date_last_modified: string
  created_at: string
}

type PersistedMessage = {
  id: number
  chat_id: string
  sender: "user" | "assistant" | "system"
  content: string
  thoughts: string | null
  tool_calls: unknown[]
  tool_contents: unknown[]
  created_at: string
}

type GroundingSegment = {
  startIndex?: number
  endIndex?: number
  text?: string
}

type GroundingSupport = {
  segment?: GroundingSegment
  groundingChunkIndices?: number[]
}

type GroundingChunk = {
  web?: {
    uri?: string
    title?: string
    favicon?: string
  }
}

type GroundingMetadata = {
  webSearchQueries?: string[]
  searchEntryPoint?: unknown
  groundingSupports?: GroundingSupport[]
  groundingChunks?: GroundingChunk[]
}

type UrlMetadataEntry = {
  retrieved_url?: string
  url_retrieval_status?: string
}

type UrlContextMetadata = {
  urlMetadata?: UrlMetadataEntry[]
}

type GroundingSupportSnapshot = {
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
  supports: GroundingSupportSnapshot[]
}

const GOOGLE_FAVICON_ENDPOINT = "https://www.google.com/s2/favicons?domain="

function normalizeUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null
  try {
    const parsed = new URL(url)
    parsed.hash = ""
    if (parsed.pathname === "/") parsed.pathname = ""
    return parsed.toString()
  } catch {
    return null
  }
}

function getDomainFromUrl(url?: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

function getFaviconUrl(url?: string | null): string | null {
  const domain = getDomainFromUrl(url)
  if (!domain) return null
  return `${GOOGLE_FAVICON_ENDPOINT}${encodeURIComponent(domain)}`
}

function mergeGroundingMetadata(
  existing: GroundingMetadata | undefined,
  incoming: GroundingMetadata,
): GroundingMetadata {
  if (!existing) return incoming

  const supportMap = new Map<string, GroundingSupport>()
  const chunkMap = new Map<number, GroundingChunk>()

  const recordSupports = (supports?: GroundingSupport[]) => {
    for (const support of supports ?? []) {
      const segment = support.segment ?? {}
      const key = JSON.stringify({
        start: segment.startIndex ?? null,
        end: segment.endIndex ?? null,
        text: segment.text ?? null,
        chunks: (support.groundingChunkIndices ?? []).join(","),
      })
      if (!supportMap.has(key)) {
        supportMap.set(key, support)
      }
    }
  }

  recordSupports(existing.groundingSupports)
  recordSupports(incoming.groundingSupports)

  const recordChunks = (chunks?: GroundingChunk[]) => {
    chunks?.forEach((chunk, index) => {
      if (!chunkMap.has(index) && chunk) {
        chunkMap.set(index, chunk)
      }
    })
  }

  recordChunks(existing.groundingChunks)
  recordChunks(incoming.groundingChunks)

  return {
    webSearchQueries: incoming.webSearchQueries ?? existing.webSearchQueries,
    searchEntryPoint: incoming.searchEntryPoint ?? existing.searchEntryPoint,
    groundingSupports: Array.from(supportMap.values()),
    groundingChunks:
      chunkMap.size > 0
        ? Array.from({ length: Math.max(...chunkMap.keys()) + 1 }, (_, key) => chunkMap.get(key)).filter(
            (chunk): chunk is GroundingChunk => Boolean(chunk),
          )
        : undefined,
  }
}

function mergeUrlContextMetadata(
  existing: UrlContextMetadata | undefined,
  incoming: UrlContextMetadata,
): UrlContextMetadata {
  if (!existing) return incoming

  const map = new Map<string, UrlMetadataEntry>()

  for (const entry of existing.urlMetadata ?? []) {
    const normalized = normalizeUrl(entry.retrieved_url ?? null)
    if (normalized) {
      map.set(normalized, entry)
    }
  }

  for (const entry of incoming.urlMetadata ?? []) {
    const normalized = normalizeUrl(entry.retrieved_url ?? null)
    if (normalized) {
      map.set(normalized, entry)
    }
  }

  return {
    urlMetadata: Array.from(map.values()),
  }
}

function applyGroundingArtifacts({
  text,
  groundingMetadata,
  urlContextMetadata,
}: {
  text: string
  groundingMetadata?: GroundingMetadata
  urlContextMetadata?: UrlContextMetadata
}): { text: string; sources: GroundingSource[] } {
  if (!groundingMetadata?.groundingSupports?.length || !groundingMetadata.groundingChunks?.length) {
    return { text, sources: [] }
  }

  const chunkList = groundingMetadata.groundingChunks
  const supports = groundingMetadata.groundingSupports.filter((support) => {
    const hasSegment = typeof support.segment?.endIndex === "number"
    return hasSegment && (support.groundingChunkIndices?.length ?? 0) > 0
  })

  if (!supports.length) {
    return { text, sources: [] }
  }

  const urlStatusMap = new Map<string, string | null>()
  for (const entry of urlContextMetadata?.urlMetadata ?? []) {
    const normalized = normalizeUrl(entry.retrieved_url ?? null)
    if (normalized) {
      urlStatusMap.set(normalized, entry.url_retrieval_status ?? null)
    }
  }

  const citationMap = new Map<number, GroundingSource>()
  let workingText = text

  const sortedSupports = [...supports].sort(
    (a, b) => (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0),
  )

  for (const support of sortedSupports) {
    const segment = support.segment
    if (!segment) continue

    const endIndex = segment.endIndex ?? 0
    if (endIndex <= 0 || endIndex > workingText.length) continue

    const chunkIndices = (support.groundingChunkIndices ?? []).filter((index) =>
      Number.isFinite(index) && index >= 0 && index < chunkList.length,
    )

    if (!chunkIndices.length) continue

    const citationLinks: string[] = []

    for (const chunkIndex of chunkIndices) {
      const chunk = chunkList[chunkIndex]
      if (!chunk?.web?.uri) continue

      const uri = chunk.web.uri
      const normalizedUri = normalizeUrl(uri)
      const displayId = chunkIndex + 1

      const existing = citationMap.get(chunkIndex)
      const supportSnapshot: GroundingSupportSnapshot = {
        text: segment.text ?? null,
        startIndex: typeof segment.startIndex === "number" ? segment.startIndex : null,
        endIndex: typeof segment.endIndex === "number" ? segment.endIndex : null,
      }

      if (existing) {
        const hasText = supportSnapshot.text?.trim().length
        if (hasText && !existing.supports.some((entry) => entry.text === supportSnapshot.text)) {
          existing.supports.push(supportSnapshot)
        }
      } else {
        citationMap.set(chunkIndex, {
          id: displayId,
          title: chunk.web.title ?? getDomainFromUrl(uri) ?? uri,
          url: uri,
          domain: getDomainFromUrl(uri),
          favicon: getFaviconUrl(uri),
          retrievalStatus: normalizedUri ? urlStatusMap.get(normalizedUri) ?? null : null,
          supports: supportSnapshot.text?.trim().length ? [supportSnapshot] : [],
        })
      }

      citationLinks.push(`[[${displayId}]](${uri})`)
    }

    if (!citationLinks.length) continue

    const citationString = citationLinks.join(" ")
    workingText = `${workingText.slice(0, endIndex)}${citationString}${workingText.slice(endIndex)}`
  }

  const sources = Array.from(citationMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, value]) => ({
      ...value,
      supports: value.supports.sort((a, b) => (a.startIndex ?? 0) - (b.startIndex ?? 0)),
    }))

  return {
    text: workingText,
    sources,
  }
}

const SUPABASE_URL = getEnv("SUPABASE_URL")
const SUPABASE_ANON_KEY = getEnv("SUPABASE_ANON_KEY")
const GEMINI_API_KEY = getEnv("GEMINI_API_KEY")

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase configuration")
}

if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY environment variable")
}

const encoder = new TextEncoder()

const MAX_HISTORY_MESSAGES = 20

const createSupabaseClient = createClient as unknown as (
  url: string,
  key: string,
  options?: {
    global?: {
      headers?: Record<string, string>
    }
  },
) => SupabaseClient

const GeminiClientCtor = GoogleGenAI as unknown as new (options: { apiKey: string }) => GeminiClient

async function fetchChatHistory(client: SupabaseClient, chatId: string): Promise<GeminiHistoryPart[]> {
  const { data, error } = await client
    .from("chat_messages")
    .select("sender, content")
    .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
    .limit(MAX_HISTORY_MESSAGES)

  if (error) {
    console.error("Failed to load chat history", error)
    throw error
  }

  const rows = ((data ?? []) as HistoryRow[]).reverse()

  return rows
    .map((row) => {
      const role: "user" | "model" = row.sender === "assistant" ? "model" : "user"
      return {
        role,
        parts: [{ text: row.content ?? "" }],
      }
    })
    .filter((entry) => entry.parts[0].text.trim().length > 0)
}

async function persistConversation({
  client,
  chatId,
  userId,
  chatTitle,
  userMessage,
  assistantMessage,
  assistantThoughts,
  assistantToolContents,
}: {
  client: SupabaseClient
  chatId?: string
  userId: string
  chatTitle?: string | null
  userMessage: string
  assistantMessage: string
  assistantThoughts: string
  assistantToolContents?: unknown[]
}): Promise<{ chat: PersistedChat; messages: PersistedMessage[] }> {
  const trimmedTitle = chatTitle?.trim() || "Untitled chat"
  let targetChatId = chatId
    let wasNewlyCreated = false

  if (!targetChatId) {
    const { data, error } = await client
      .from("chats")
      .insert({
        user_id: userId,
        chat_name: trimmedTitle,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Failed to create chat row", error)
      throw error
    }

    const insertedId = data?.id

    if (typeof insertedId !== "string") {
      throw new Error("Chat creation did not return an id")
    }

    targetChatId = insertedId
      wasNewlyCreated = true
  }

  const messagePayloads = [
    {
      chat_id: targetChatId,
      sender: "user" as const,
      content: userMessage,
      thoughts: null,
      tool_calls: [],
      tool_contents: [],
    },
    {
      chat_id: targetChatId,
      sender: "assistant" as const,
      content: assistantMessage,
      thoughts: assistantThoughts || null,
      tool_calls: [],
      tool_contents: assistantToolContents ?? [],
    },
  ]

    const { data: insertedMessages, error: insertError } = await client
      .from("chat_messages")
      .insert(messagePayloads)
      .select("*")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })

  if (insertError) {
    console.error("Failed to insert chat messages", insertError)
      if (wasNewlyCreated && targetChatId) {
        await client.from("chats").delete().eq("id", targetChatId)
      }
    throw insertError
  }

  const messages = (insertedMessages ?? []) as PersistedMessage[]
    if (wasNewlyCreated && messages.length < 2 && targetChatId) {
      await client.from("chats").delete().eq("id", targetChatId)
      throw new Error("Chat requires at least one user and assistant message")
    }
  const latestTimestamp = messages[messages.length - 1]?.created_at ?? new Date().toISOString()

  const { data: updatedChat, error: updateError } = await client
    .from("chats")
    .update({
      date_last_modified: latestTimestamp,
    })
    .eq("id", targetChatId)
    .select("*")
    .single()

  if (updateError) {
    console.error("Failed to update chat metadata", updateError)
    throw updateError
  }

  return {
    chat: updatedChat as PersistedChat,
    messages,
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": req.headers.get("Origin") ?? "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Max-Age": "86400",
      },
    })
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 })
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: "Service misconfigured" }), { status: 500 })
  }

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing Gemini API key" }), { status: 500 })
  }

  let body: ChatStreamRequestBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 })
  }

  const { chatId, message, chatTitle } = body

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Message content is required" }), { status: 400 })
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: authHeader },
    },
  })

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser()

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  let existingChatId: string | undefined
  let history: GeminiHistoryPart[] = []

  if (chatId) {
    const { data: chatRow, error: chatLookupError } = await supabaseClient
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .maybeSingle()

    if (chatLookupError) {
      console.error("Failed to verify chat", chatLookupError)
      return new Response(JSON.stringify({ error: "Failed to verify chat" }), { status: 400 })
    }

    if (!chatRow) {
      return new Response(JSON.stringify({ error: "Chat not found" }), { status: 404 })
    }

    existingChatId = chatRow.id as string
    history = await fetchChatHistory(supabaseClient, existingChatId)
  }

  const ai = new GeminiClientCtor({ apiKey: GEMINI_API_KEY })

  const stream = new ReadableStream({
    async start(controller) {
      const safeMessage = message.trim()
      let assistantContent = ""
      let assistantThoughts = ""

      try {
        const chatSession = ai.chats.create({
          model: "gemini-2.5-flash",
          history,
        })

        let groundingMetadata: GroundingMetadata | undefined
        let urlContextMetadata: UrlContextMetadata | undefined
        const geminiStream = (await chatSession.sendMessageStream({
          message: safeMessage,
          config: {
            tools: [{ urlContext: {} }, { googleSearch: {} }],
            thinkingConfig: {
              includeThoughts: true,
            },
          },
        })) as AsyncIterable<GeminiStreamChunk>

        for await (const chunk of geminiStream) {
          const candidate = chunk.candidates?.[0]
          if (!candidate) continue

          if (candidate.groundingMetadata) {
            groundingMetadata = mergeGroundingMetadata(groundingMetadata, candidate.groundingMetadata)
          }

          if (candidate.urlContextMetadata) {
            urlContextMetadata = mergeUrlContextMetadata(urlContextMetadata, candidate.urlContextMetadata)
          }

          const parts = candidate.content?.parts ?? []

          for (const part of parts) {
            const text = typeof part.text === "string" ? part.text : ""
            if (!text) continue

            if (part.thought) {
              assistantThoughts += text
              controller.enqueue(encoder.encode(`${JSON.stringify({ type: "thought", delta: text })}\n`))
            } else {
              assistantContent += text
              controller.enqueue(encoder.encode(`${JSON.stringify({ type: "response", delta: text })}\n`))
            }
          }
        }

        if (!assistantContent.trim()) {
          throw new Error("The model did not return a response")
        }

        const { text: enrichedContent, sources } = applyGroundingArtifacts({
          text: assistantContent,
          groundingMetadata,
          urlContextMetadata,
        })
        assistantContent = enrichedContent

        const persistence = await persistConversation({
          client: supabaseClient,
          chatId: existingChatId,
          userId: user.id,
          chatTitle,
          userMessage: safeMessage,
          assistantMessage: assistantContent,
          assistantThoughts,
          assistantToolContents: sources.length
            ? [
                {
                  type: "grounding_sources",
                  sources,
                },
              ]
            : [],
        })

        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({
              type: "complete",
              chat: persistence.chat,
              messages: persistence.messages,
              thoughts: assistantThoughts,
              sources,
            })}\n`,
          ),
        )
        controller.close()
      } catch (error) {
        console.error("Streaming error", error)
        const message = error instanceof Error ? error.message : "Unexpected error"
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", message })}\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": req.headers.get("Origin") ?? "*",
    },
  })
})
