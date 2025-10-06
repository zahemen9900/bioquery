import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.6"

export {}

const { serve } = await import("https://deno.land/std@0.224.0/http/server.ts")
const { GoogleGenAI } = await import("npm:@google/genai")
const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.47.6")

import { artifactCreationTools, buildArtifactToolboxGuidance } from "./tools.ts"

type ToolMode = "research-tools" | "web-search"

type ChatStreamRequestBody = {
  chatId?: string
  message?: string
  chatTitle?: string | null
  toolMode?: ToolMode
}

type GeminiHistoryPart = {
  role: "user" | "model"
  parts: Array<{ text: string }>
}

type GeminiStreamChunk = {
  text?: string
  functionCalls?: Array<{ name: string; args: Record<string, unknown> }>
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
        thought?: boolean
      }>
    }
    functionCalls?: Array<{ name: string; args: Record<string, unknown> }>
    groundingMetadata?: GroundingMetadata
    urlContextMetadata?: UrlContextMetadata
  }>
}

type ToolCallRecord = {
  id: number
  name: string
  status: "pending" | "success" | "error"
  args: Record<string, unknown> | null
  result: Record<string, unknown> | null
  error: string | null
}

type DocumentReferenceContent = {
  type: "document_reference"
  tool_id: number
  tool_name: string
  document: {
    id: string
    title: string | null
    document_type: string | null
    tags: string[]
    preview?: string | null
    body?: string | null
    image_prompt?: string | null
    image_link?: string | null
    metadata?: Record<string, unknown> | null
  }
}

type ArtifactReferenceContent = {
  type: "artifact_reference"
  tool_id: number
  tool_name: string
  artifact: {
    id: string
    artifact_type: string
    title: string | null
    tags: string[]
    summary?: string | null
    metrics?: Record<string, unknown> | null
    data?: Record<string, unknown> | null
  }
}

type ImageAssetContent = {
  type: "image_asset"
  tool_id: number
  tool_name: string
  image: {
    prompt: string | null
    image_url: string
    bucket: string
    path: string
    signed_url: string
    tags: string[]
    show_to_user: boolean
    expires_at: string | null
    content_type: string | null
    source_url?: string | null
  }
}

type ContextualSearchResult = {
  pmcid: string | null
  title: string | null
  url: string | null
  chunk_index: number | null
  text: string
  similarity_score: number | null
}

type ContextualSearchContent = {
  type: "contextual_search"
  tool_id: number
  tool_name: string
  search: {
    query: string
    top_k: number
    results: ContextualSearchResult[]
  }
}

type AnswerWithSourcesContent = {
  type: "answer_with_sources"
  tool_id: number
  tool_name: string
  answer: {
    query: string
    text: string
    sources: ContextualSearchResult[]
  }
}

type ToolContentEntry =
  | { type: "grounding_sources"; sources: GroundingSource[] }
  | DocumentReferenceContent
  | ArtifactReferenceContent
  | ImageAssetContent
  | ContextualSearchContent
  | AnswerWithSourcesContent

type ToolExecutionOutcome = {
  status: "success" | "error"
  result: Record<string, unknown>
  content?:
    | { kind: "document"; data: DocumentReferenceContent["document"] }
    | { kind: "chat_artifact"; data: ArtifactReferenceContent["artifact"] }
    | { kind: "image_asset"; data: ImageAssetContent["image"] }
    | { kind: "contextual_search"; data: ContextualSearchContent["search"] }
    | { kind: "answer_with_sources"; data: AnswerWithSourcesContent["answer"] }
  summary?: Record<string, unknown>
  error?: string
  artifactLink?: { table: "chat_artifacts"; id: string } | null
}

type ImageReference = {
  url?: string
  base64?: string
  mimeType?: string | null
}

type ResolvedImagePayload = {
  bytes: Uint8Array
  contentType: string
  sourceUrl?: string | null
}

type GeneratedImageAssetPayload = {
  bucket: string
  path: string
  signedUrl: string
  expiresAt: string
  contentType: string
  prompt: string
  tags: string[]
  showToUser: boolean
  sourceUrl?: string | null
}

type DocumentType = "document" | "translation" | "other"

type DocumentRow = {
  id: string
  title: string | null
  body: string | null
  tags: string[] | null
  document_type: string | null
  image_prompt: string | null
  image_link: string | null
  metadata: Record<string, unknown> | null
}

type ChatArtifactRow = {
  id: string
  artifact_type: string
  title: string | null
  tags: string[] | null
  content: Record<string, unknown>
  summary: string | null
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
const DEFAULT_MODEL = "gemini-2.5-flash"
const MAX_HISTORY_MESSAGES = 20
const IMAGE_STORAGE_BUCKET = "generated-artifacts"
const IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365
const DEFAULT_IMAGE_ASPECT_RATIO = "widescreen_16_9"
const COHERE_EMBED_ENDPOINT = "https://api.cohere.com/v1/embed"
const COHERE_EMBED_MODEL = "embed-v4.0"
const COHERE_EMBED_DIMENSION = 512
const MAX_SEARCH_TEXT_LENGTH = 1600
const RAG_ANSWER_SYSTEM_PROMPT =
  "You are BioQuery, a NASA bioscience assistant. Use only the provided sources to answer the question. Cite your sources inline using bracketed numbers like [1]. If the sources do not support an answer, say so explicitly."

const getEnv = (key: string): string | undefined => {
  const runtime = (globalThis as { Deno?: { env: { get(name: string): string | undefined } } }).Deno
  return runtime?.env.get(key)
}

const SUPABASE_URL = getEnv("SUPABASE_URL")
const SUPABASE_ANON_KEY = getEnv("SUPABASE_ANON_KEY")
const GEMINI_API_KEY = getEnv("GEMINI_API_KEY")
const FREEPIK_API_KEY = getEnv("FREEPIK_API_KEY")
const COHERE_API_KEY = getEnv("COHERE_API_KEY")

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase configuration")
}

if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY environment variable")
}

if (!FREEPIK_API_KEY) {
  console.warn("FREEPIK_API_KEY is not configured; image generation tools will be unavailable.")
}

if (!COHERE_API_KEY) {
  console.warn("COHERE_API_KEY is not configured; RAG retrieval tools will be unavailable.")
}

const encoder = new TextEncoder()

const createSupabaseClient = createClient as unknown as (
  url: string,
  key: string,
  options?: { global?: { headers?: Record<string, string> } },
) => SupabaseClient

const GeminiClientCtor = GoogleGenAI as unknown as new (options: { apiKey: string }) => {
  models: {
    generateContentStream(options: {
      model: string
      contents: Array<Record<string, unknown>>
      config?: Record<string, unknown>
    }): Promise<AsyncIterable<GeminiStreamChunk>>
    generateContent(options: {
      model: string
      contents: Array<Record<string, unknown>>
      config?: Record<string, unknown>
    }): Promise<{ text?: string; functionCalls?: Array<{ name: string; args: Record<string, unknown> }> }>
  }
}

const sanitizeArgs = (value: unknown): Record<string, unknown> | null => {
  try {
    const json = JSON.stringify(
      value,
      (_key, current) => (typeof current === "string" && current.length > 500 ? `${current.slice(0, 500)}...` : current),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const asOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const asOptionalNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed.length) return null
    const parsed = Number(trimmed)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

const asOptionalInteger = (value: unknown): number | null => {
  const numeric = asOptionalNumber(value)
  if (numeric === null) return null
  const truncated = Math.trunc(numeric)
  return Number.isFinite(truncated) ? truncated : null
}

const toStringArray = (value: unknown, limit = 16): string[] => {
  if (!Array.isArray(value)) return []
  const results: string[] = []
  for (const entry of value) {
    if (typeof entry !== "string") continue
    const trimmed = entry.trim()
    if (!trimmed) continue
    results.push(trimmed)
    if (results.length >= limit) break
  }
  return results
}

const DOCUMENT_TYPES = new Set<DocumentType>(["document", "translation", "other"])

const normalizeDocumentType = (value: unknown): DocumentType | null => {
  if (typeof value !== "string") return null
  const normalized = value.trim().toLowerCase()
  if (!normalized || !DOCUMENT_TYPES.has(normalized as DocumentType)) return null
  return normalized as DocumentType
}

const sanitizeMetadata = (value: unknown): Record<string, unknown> | null => {
  if (value === undefined || value === null) return {}
  if (typeof value !== "object" || Array.isArray(value)) return null
  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
  } catch {
    return null
  }
}

const snippetOf = (text: string | null | undefined, length = 280): string | null => {
  if (!text) return null
  if (text.length <= length) return text
  return `${text.slice(0, length)}...`
}

const parseDataPoints = (value: unknown, limit = 20): Array<{ label: string; value: number }> => {
  if (!Array.isArray(value)) return []
  const results: Array<{ label: string; value: number }> = []
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue
    const label = asNonEmptyString((entry as Record<string, unknown>).label)
    const rawValue = (entry as Record<string, unknown>).value
    const numeric = typeof rawValue === "number" ? rawValue : Number(rawValue)
    if (!label || !Number.isFinite(numeric)) continue
    results.push({ label, value: numeric })
    if (results.length >= limit) break
  }
  return results
}

const parseNodes = (value: unknown, limit = 40): Array<{ id: string; label: string; type?: string | null }> => {
  if (!Array.isArray(value)) return []
  const nodes: Array<{ id: string; label: string; type?: string | null }> = []
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue
    const id = asNonEmptyString((entry as Record<string, unknown>).id)
    const label = asNonEmptyString((entry as Record<string, unknown>).label)
    const type = asOptionalString((entry as Record<string, unknown>).type)
    if (!id || !label) continue
    nodes.push({ id, label, type })
    if (nodes.length >= limit) break
  }
  return nodes
}

const parseEdges = (value: unknown, limit = 80): Array<{ source: string; target: string; relation: string }> => {
  if (!Array.isArray(value)) return []
  const edges: Array<{ source: string; target: string; relation: string }> = []
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue
    const source = asNonEmptyString((entry as Record<string, unknown>).source)
    const target = asNonEmptyString((entry as Record<string, unknown>).target)
    const relation = asNonEmptyString((entry as Record<string, unknown>).relation)
    if (!source || !target || !relation) continue
    edges.push({ source, target, relation })
    if (edges.length >= limit) break
  }
  return edges
}

const parseTimelineSections = (
  value: unknown,
  limit = 20,
): Array<{ title: string; description: string; image_prompt?: string | null }> => {
  if (!Array.isArray(value)) return []
  const sections: Array<{ title: string; description: string; image_prompt?: string | null }> = []
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue
    const title = asNonEmptyString((entry as Record<string, unknown>).title)
    const description = asNonEmptyString((entry as Record<string, unknown>).description)
    const imagePrompt = asOptionalString((entry as Record<string, unknown>).image_prompt)
    if (!title || !description) continue
    sections.push({ title, description, image_prompt: imagePrompt })
    if (sections.length >= limit) break
  }
  return sections
}

const clampTopK = (value: unknown, fallback = 5): number => {
  const numeric = asOptionalNumber(value)
  if (numeric === null) return fallback
  const bounded = Math.min(20, Math.max(1, Math.floor(numeric)))
  return bounded
}

const normalizeSimilarityScore = (value: unknown): number | null => {
  const numeric = asOptionalNumber(value)
  if (numeric === null) return null
  if (!Number.isFinite(numeric)) return null
  return Math.max(-1, Math.min(1, numeric))
}

const mapRowToSearchResult = (row: Record<string, unknown>): ContextualSearchResult | null => {
  const rawText = asOptionalString(row.chunk) ?? asOptionalString(row.text)
  if (!rawText) return null
  const chunkIndex = asOptionalInteger(row.chunk_index)
  return {
    pmcid: asOptionalString(row.pmcid),
    title: asOptionalString(row.title),
    url: asOptionalString(row.url),
    chunk_index: chunkIndex,
    text: rawText.length > MAX_SEARCH_TEXT_LENGTH ? `${rawText.slice(0, MAX_SEARCH_TEXT_LENGTH)}…` : rawText,
    similarity_score: normalizeSimilarityScore(row.similarity),
  }
}

const parseContextualResultsInput = (value: unknown): ContextualSearchResult[] => {
  if (!Array.isArray(value)) return []
  const results: ContextualSearchResult[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue
    const mapped = mapRowToSearchResult(entry as Record<string, unknown>)
    if (mapped) {
      results.push(mapped)
    }
  }
  return results
}

const fetchQueryEmbedding = async (text: string): Promise<number[]> => {
  if (!COHERE_API_KEY) {
    throw new Error("COHERE_API_KEY is not configured for contextual search.")
  }

  const trimmed = text.trim()
  if (!trimmed.length) {
    throw new Error("Query text must not be empty.")
  }

  const response = await fetch(COHERE_EMBED_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${COHERE_API_KEY}`,
    },
    body: JSON.stringify({
      model: COHERE_EMBED_MODEL,
      texts: [trimmed],
      input_type: "search_query",
      embedding_types: ["float"],
      dimensions: COHERE_EMBED_DIMENSION,
      output_dimensionality: COHERE_EMBED_DIMENSION,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`Failed to embed query (${response.status}): ${errorText.slice(0, 240)}`)
  }

  const payload = await response.json().catch(() => null)
  if (!payload) {
    throw new Error("Embedding response was not JSON.")
  }

  let vector: unknown
  const embeddingsObject = payload.embeddings

  if (Array.isArray(embeddingsObject)) {
    vector = embeddingsObject[0]
  } else if (embeddingsObject && typeof embeddingsObject === "object") {
    if (Array.isArray(embeddingsObject.float)) {
      vector = embeddingsObject.float[0]
    } else if (Array.isArray(embeddingsObject.data)) {
      vector = embeddingsObject.data[0]
    }
  }

  if (!Array.isArray(vector)) {
    throw new Error("Embedding response did not include a float vector.")
  }

  const result: number[] = []
  for (const value of vector) {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) {
      throw new Error("Embedding vector contained a non-numeric value.")
    }
    result.push(numeric)
  }

  if (result.length === COHERE_EMBED_DIMENSION) {
    return result
  }

  if (result.length > COHERE_EMBED_DIMENSION) {
    console.warn(
      `Received embedding with dimension ${result.length}; trimming to ${COHERE_EMBED_DIMENSION}. ` +
        "Update the Cohere API request if this persists.",
    )
    return result.slice(0, COHERE_EMBED_DIMENSION)
  }

  throw new Error(`Embedding dimension mismatch (expected ${COHERE_EMBED_DIMENSION}, received ${result.length}).`)
}

const performContextualSearch = async ({
  supabase,
  query,
  topK,
}: {
  supabase: SupabaseClient
  query: string
  topK: number
}): Promise<ContextualSearchResult[]> => {
  const embedding = await fetchQueryEmbedding(query)

  const { data, error } = await supabase.rpc("match_publication_chunks", {
    query_embedding: embedding,
    match_count: topK,
  })

  if (error) {
    console.error("contextual_search failed", error)
    throw new Error(error.message ?? "Failed to run contextual search.")
  }

  const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : []
  const mapped: ContextualSearchResult[] = []
  for (const row of rows) {
    const result = mapRowToSearchResult(row)
    if (result) {
      mapped.push(result)
    }
  }

  return mapped
}

const upsertToolContent = (list: ToolContentEntry[], entry: ToolContentEntry): ToolContentEntry[] => {
  if (entry.type === "grounding_sources") {
    const others = list.filter((item) => item.type !== "grounding_sources")
    return [...others, entry]
  }

  const others = list.filter((item) => {
    if (item.type === "grounding_sources") return true
    return !(item.tool_id === entry.tool_id && item.type === entry.type)
  })

  return [...others, entry]
}

const serializeToolCalls = (calls: ToolCallRecord[]): Record<string, unknown>[] =>
  calls.map((call) => ({
    id: call.id,
    name: call.name,
    status: call.status,
    args: call.args,
    result: call.result,
    error: call.error,
  }))

const serializeToolContents = (contents: ToolContentEntry[]): Record<string, unknown>[] =>
  contents.map((entry) => {
    if (entry.type === "grounding_sources") {
      return {
        type: entry.type,
        sources: entry.sources,
      }
    }
    if (entry.type === "document_reference") {
      return {
        type: entry.type,
        tool_id: entry.tool_id,
        tool_name: entry.tool_name,
        document: entry.document,
      }
    }
    if (entry.type === "artifact_reference") {
      return {
        type: entry.type,
        tool_id: entry.tool_id,
        tool_name: entry.tool_name,
        artifact: entry.artifact,
      }
    }
    if (entry.type === "image_asset") {
      return {
        type: entry.type,
        tool_id: entry.tool_id,
        tool_name: entry.tool_name,
        image: entry.image,
      }
    }
    if (entry.type === "contextual_search") {
      return {
        type: entry.type,
        tool_id: entry.tool_id,
        tool_name: entry.tool_name,
        search: entry.search,
      }
    }
    if (entry.type === "answer_with_sources") {
      return {
        type: entry.type,
        tool_id: entry.tool_id,
        tool_name: entry.tool_name,
        answer: entry.answer,
      }
    }
    return entry as unknown as Record<string, unknown>
  })

const normalizeUrl = (url?: string | null): string | null => {
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

const getDomainFromUrl = (url?: string | null): string | null => {
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

const getFaviconUrl = (url?: string | null): string | null => {
  const domain = getDomainFromUrl(url)
  if (!domain) return null
  return `${GOOGLE_FAVICON_ENDPOINT}${encodeURIComponent(domain)}`
}

const mergeGroundingMetadata = (
  existing: GroundingMetadata | undefined,
  incoming: GroundingMetadata,
): GroundingMetadata => {
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

const mergeUrlContextMetadata = (
  existing: UrlContextMetadata | undefined,
  incoming: UrlContextMetadata,
): UrlContextMetadata => {
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

const looksLikeHttpUrl = (value: string): boolean => {
  if (typeof value !== "string" || value.length < 8) return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

const parseDataUri = (value: string): { mimeType: string; data: string } | null => {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  const match = /^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/i.exec(trimmed)
  if (!match) return null
  return { mimeType: match[1], data: match[2] }
}

const looksLikeBase64Image = (value: string): boolean => {
  if (typeof value !== "string") return false
  const sanitized = value.replace(/\s+/g, "")
  if (sanitized.length < 40 || sanitized.length % 4 !== 0) return false
  return /^[A-Za-z0-9+/]+=*$/.test(sanitized)
}

const extractImageReferenceFromPayload = (payload: unknown): ImageReference | null => {
  const queue: unknown[] = [payload]
  const fallbackBase64: Array<{ data: string; mimeType: string | null }> = []

  while (queue.length) {
    const current = queue.shift()

    if (typeof current === "string") {
      const dataUri = parseDataUri(current)
      if (dataUri) {
        return { base64: dataUri.data, mimeType: dataUri.mimeType }
      }
      if (looksLikeHttpUrl(current)) {
        return { url: current }
      }
      if (looksLikeBase64Image(current)) {
        fallbackBase64.push({ data: current, mimeType: null })
      }
      continue
    }

    if (Array.isArray(current)) {
      queue.push(...current)
      continue
    }

    if (current && typeof current === "object") {
      for (const value of Object.values(current as Record<string, unknown>)) {
        if (value !== undefined && value !== null) {
          queue.push(value)
        }
      }
    }
  }

  if (fallbackBase64.length) {
    const first = fallbackBase64[0]
    return { base64: first.data, mimeType: first.mimeType }
  }

  return null
}

const decodeBase64ToUint8 = (value: string): Uint8Array => {
  const sanitized = value.replace(/\s+/g, "")
  const binary = atob(sanitized)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

const resolveImageReference = async (reference: ImageReference): Promise<ResolvedImagePayload> => {
  if (reference.url) {
    const response = await fetch(reference.url)
    if (!response.ok) {
      throw new Error(`Failed to download generated image (${response.status})`)
    }
    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") ?? reference.mimeType ?? "image/png"
    return { bytes: new Uint8Array(buffer), contentType, sourceUrl: reference.url }
  }

  if (reference.base64) {
    return {
      bytes: decodeBase64ToUint8(reference.base64),
      contentType: reference.mimeType ?? "image/png",
      sourceUrl: reference.url ?? null,
    }
  }

  throw new Error("Image reference was empty.")
}

const extensionFromMime = (mime: string): string => {
  const normalized = (mime ?? "").toLowerCase()
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg"
  if (normalized.includes("webp")) return "webp"
  if (normalized.includes("gif")) return "gif"
  return "png"
}

const normalizePathSegment = (value: string): string => {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48)
  return sanitized.length ? sanitized : "segment"
}

const isStorageConflictError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false
  const statusCode = (error as { statusCode?: number }).statusCode
  const message = ((error as { message?: string }).message ?? "").toLowerCase()
  if (typeof statusCode === "number" && statusCode === 409) return true
  return message.includes("already exists") || message.includes("duplicate")
}

const generateImageAsset = async ({
  supabase,
  prompt,
  tags,
  showToUser,
  userId,
  chatId,
  aspectRatio,
}: {
  supabase: SupabaseClient
  prompt: string
  tags: string[]
  showToUser: boolean
  userId: string
  chatId?: string | null
  aspectRatio?: string | null
}): Promise<GeneratedImageAssetPayload> => {
  if (!FREEPIK_API_KEY) {
    throw new Error("Image generation is not configured (missing FREEPIK_API_KEY).")
  }

  const requestBody: Record<string, unknown> = {
    prompt,
    aspect_ratio: aspectRatio ?? DEFAULT_IMAGE_ASPECT_RATIO,
  }

  const response = await fetch("https://api.freepik.com/v1/ai/text-to-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-freepik-api-key": FREEPIK_API_KEY,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`Image generation failed (${response.status}): ${errorText.slice(0, 240)}`)
  }

  const payload = await response.json().catch(() => null)
  if (!payload) {
    throw new Error("Image generation response was not JSON.")
  }

  const reference = extractImageReferenceFromPayload(payload)
  if (!reference) {
    throw new Error("Freepik response did not include an image reference.")
  }

  const resolved = await resolveImageReference(reference)

  const extension = extensionFromMime(resolved.contentType)
  const baseDirectory = `${normalizePathSegment(userId)}/${normalizePathSegment(chatId ?? "standalone")}`
  let targetPath: string | undefined

  const arrayBuffer = resolved.bytes.buffer.slice(
    resolved.bytes.byteOffset,
    resolved.bytes.byteOffset + resolved.bytes.byteLength,
  ) as ArrayBuffer
  const blob = new Blob([arrayBuffer], { type: resolved.contentType })
  const metadata = {
    prompt: prompt.slice(0, 255),
    source: "freepik",
    show_to_user: showToUser ? "true" : "false",
    tags: tags.slice(0, 16).join(","),
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`
    const candidatePath = `${baseDirectory}/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from(IMAGE_STORAGE_BUCKET)
      .upload(candidatePath, blob, {
        contentType: resolved.contentType,
        cacheControl: "3600",
        metadata,
        upsert: false,
      })

    if (!uploadError) {
      targetPath = candidatePath
      break
    }

    if (!isStorageConflictError(uploadError)) {
      throw new Error(uploadError.message ?? "Failed to upload generated image.")
    }
  }

  if (!targetPath) {
    throw new Error("Failed to upload generated image after multiple attempts.")
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(IMAGE_STORAGE_BUCKET)
    .createSignedUrl(targetPath, IMAGE_SIGNED_URL_TTL_SECONDS)

  if (signedError || !signedData?.signedUrl) {
    throw new Error(signedError?.message ?? "Failed to create signed image URL.")
  }

  const expiresAt = new Date(Date.now() + IMAGE_SIGNED_URL_TTL_SECONDS * 1000).toISOString()

  return {
    bucket: IMAGE_STORAGE_BUCKET,
    path: targetPath,
    signedUrl: signedData.signedUrl,
    expiresAt,
    contentType: resolved.contentType,
    prompt,
    tags,
    showToUser,
    sourceUrl: resolved.sourceUrl ?? reference.url ?? null,
  }
}

const applyGroundingArtifacts = ({
  text,
  groundingMetadata,
  urlContextMetadata,
}: {
  text: string
  groundingMetadata?: GroundingMetadata
  urlContextMetadata?: UrlContextMetadata
}): { text: string; sources: GroundingSource[] } => {
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

const fetchChatHistory = async (client: SupabaseClient, chatId: string): Promise<GeminiHistoryPart[]> => {
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

  const rows = ((data ?? []) as Array<{ sender: "user" | "assistant" | "system"; content: string | null }>).reverse()

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

const ensureChat = async ({
  client,
  userId,
  chatTitle,
}: {
  client: SupabaseClient
  userId: string
  chatTitle?: string | null
}): Promise<{ id: string; wasCreated: boolean }> => {
  const trimmedTitle = chatTitle?.trim() || "Untitled chat"
  const { data, error } = await client
    .from("chats")
    .insert({ user_id: userId, chat_name: trimmedTitle })
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

  return { id: insertedId, wasCreated: true }
}

const executeArtifactTool = async ({
  name,
  args,
  userId,
  chatId,
  supabase,
  toolCallId,
}: {
  name: string
  args: Record<string, unknown>
  userId: string
  chatId: string
  supabase: SupabaseClient
  toolCallId?: number
}): Promise<ToolExecutionOutcome> => {
  try {
    switch (name) {
      case "create_document": {
        const title = asNonEmptyString(args.title)
        const body = asNonEmptyString(args.body)
        if (!title || !body) {
          const message = "Both title and body are required to create a document."
          return { status: "error", result: { status: "error", message }, error: message }
        }
        const tags = toStringArray(args.tags)
        const imagePrompt = asOptionalString(args.image_prompt)
        const imageAspectRatio = asOptionalString((args as Record<string, unknown>).image_aspect_ratio)
        const typeProvided = Object.prototype.hasOwnProperty.call(args, "document_type")
        const normalizedDocumentType = normalizeDocumentType(args.document_type)
        if (typeProvided && !normalizedDocumentType) {
          const message = "document_type must be one of document, translation, or other."
          return { status: "error", result: { status: "error", message }, error: message }
        }
        const documentType = normalizedDocumentType ?? "document"

        const metadata = sanitizeMetadata(args.metadata)
        if (metadata === null) {
          const message = "metadata must be a JSON object when provided."
          return { status: "error", result: { status: "error", message }, error: message }
        }
        if (typeof metadata.tool_name !== "string") {
          metadata.tool_name = name
        }
        const toolCallRef = typeof toolCallId === "number" ? String(toolCallId) : null

        let generatedImage: GeneratedImageAssetPayload | null = null

        let imageLink: string | null = null
        if (Object.prototype.hasOwnProperty.call(args, "image_link")) {
          const raw = args.image_link
          if (raw === null) {
            imageLink = null
          } else if (typeof raw === "string") {
            const trimmed = raw.trim()
            imageLink = trimmed.length > 0 ? trimmed : null
          } else {
            const message = "image_link must be a string when provided."
            return { status: "error", result: { status: "error", message }, error: message }
          }
        }
        if (!imageLink && imagePrompt) {
          try {
            generatedImage = await generateImageAsset({
              supabase,
              prompt: imagePrompt,
              tags,
              showToUser: false,
              userId,
              chatId,
              aspectRatio: imageAspectRatio,
            })
            imageLink = generatedImage.signedUrl
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to generate image."
            return { status: "error", result: { status: "error", message }, error: message }
          }
        }

        if (generatedImage) {
          metadata.generated_image = {
            bucket: generatedImage.bucket,
            path: generatedImage.path,
            signed_url: generatedImage.signedUrl,
            expires_at: generatedImage.expiresAt,
            content_type: generatedImage.contentType,
            source_url: generatedImage.sourceUrl ?? null,
          }
        }

        const insertPayload = {
          user_id: userId,
          chat_id: chatId,
          tool_name: name,
          tool_call_id: toolCallRef,
          document_type: documentType,
          title,
          body,
          image_prompt: imagePrompt,
          tags,
          image_link: imageLink,
          metadata,
        }

        const { data, error } = await supabase
          .from("documents")
          .insert(insertPayload)
          .select("id,title,body,tags,document_type,image_prompt,image_link,metadata")
          .single()

        if (error) {
          console.error("create_document failed", error)
          const message = error instanceof Error ? error.message : "Unable to create document."
          return { status: "error", result: { status: "error", message }, error: message }
        }

        const row = data as DocumentRow
        const document = {
          id: row.id,
          title: row.title,
          document_type: row.document_type ?? "document",
          tags: row.tags ?? [],
          preview: snippetOf(row.body),
          body: row.body,
          image_prompt: row.image_prompt,
          image_link: row.image_link,
          metadata: row.metadata ?? {},
        }

        return {
          status: "success",
          result: {
            status: "success",
            doc_id: row.id,
            title: row.title,
            tags: document.tags,
            document_type: document.document_type,
            image_link: document.image_link,
            image_prompt: document.image_prompt,
          },
          summary: {
            doc_id: row.id,
            title: row.title,
          },
          content: {
            kind: "document",
            data: document,
          },
        }
      }
      case "update_document": {
        const docId = asNonEmptyString(args.doc_id)
        if (!docId) {
          const message = "doc_id is required to update a document."
          return { status: "error", result: { status: "error", message }, error: message }
        }

        const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
        let hasChanges = false
        const imageAspectRatio = asOptionalString((args as Record<string, unknown>).image_aspect_ratio)
        let generatedImage: GeneratedImageAssetPayload | null = null

        if (Object.prototype.hasOwnProperty.call(args, "title")) {
          const nextTitle = asNonEmptyString(args.title)
          if (!nextTitle) {
            const message = "title must be a non-empty string."
            return { status: "error", result: { status: "error", message }, error: message }
          }
          payload.title = nextTitle
          hasChanges = true
        }

        if (Object.prototype.hasOwnProperty.call(args, "body")) {
          const nextBody = asNonEmptyString(args.body)
          if (!nextBody) {
            const message = "body must be a non-empty string."
            return { status: "error", result: { status: "error", message }, error: message }
          }
          payload.body = nextBody
          hasChanges = true
        }

        if (Object.prototype.hasOwnProperty.call(args, "tags")) {
          if (!Array.isArray(args.tags)) {
            const message = "tags must be an array of strings."
            return { status: "error", result: { status: "error", message }, error: message }
          }
          payload.tags = toStringArray(args.tags)
          hasChanges = true
        }

        if (Object.prototype.hasOwnProperty.call(args, "image_prompt")) {
          const raw = args.image_prompt
          if (raw === null) {
            payload.image_prompt = null
          } else if (typeof raw === "string") {
            const trimmed = raw.trim()
            payload.image_prompt = trimmed.length > 0 ? trimmed : null
          } else {
            const message = "image_prompt must be a string when provided."
            return { status: "error", result: { status: "error", message }, error: message }
          }
          hasChanges = true
        }

        if (Object.prototype.hasOwnProperty.call(args, "image_link")) {
          const raw = args.image_link
          if (raw === null) {
            payload.image_link = null
          } else if (typeof raw === "string") {
            const trimmed = raw.trim()
            payload.image_link = trimmed.length > 0 ? trimmed : null
          } else {
            const message = "image_link must be a string when provided."
            return { status: "error", result: { status: "error", message }, error: message }
          }
          hasChanges = true
        }

        if (Object.prototype.hasOwnProperty.call(args, "document_type")) {
          const normalizedDocumentType = normalizeDocumentType(args.document_type)
          if (!normalizedDocumentType) {
            const message = "document_type must be one of document, translation, or other."
            return { status: "error", result: { status: "error", message }, error: message }
          }
          payload.document_type = normalizedDocumentType
          hasChanges = true
        }

        if (Object.prototype.hasOwnProperty.call(args, "metadata")) {
          const metadata = sanitizeMetadata(args.metadata)
          if (metadata === null) {
            const message = "metadata must be a JSON object when provided."
            return { status: "error", result: { status: "error", message }, error: message }
          }
          if (typeof metadata.tool_name !== "string") {
            metadata.tool_name = name
          }
          payload.metadata = metadata
          hasChanges = true
        }

        if (!hasChanges) {
          const message = "Provide at least one field to update."
          return { status: "error", result: { status: "error", message }, error: message }
        }

        const tagsForImage = Array.isArray(payload.tags)
          ? (payload.tags as string[])
          : Array.isArray(args.tags)
            ? toStringArray(args.tags)
            : []
        const promptForGeneration =
          typeof payload.image_prompt === "string" && (payload.image_prompt as string).length > 0
            ? (payload.image_prompt as string)
            : null
        const explicitImageLinkProvided =
          Object.prototype.hasOwnProperty.call(args, "image_link") &&
          typeof payload.image_link === "string" &&
          (payload.image_link as string).trim().length > 0

        if (promptForGeneration && !explicitImageLinkProvided) {
          try {
            generatedImage = await generateImageAsset({
              supabase,
              prompt: promptForGeneration,
              tags: tagsForImage,
              showToUser: false,
              userId,
              chatId,
              aspectRatio: imageAspectRatio,
            })
            payload.image_link = generatedImage.signedUrl
            hasChanges = true
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to generate image."
            return { status: "error", result: { status: "error", message }, error: message }
          }
        }

        const updatePayload: Record<string, unknown> = { ...payload }

        if (generatedImage) {
          if (typeof updatePayload.metadata !== "object" || updatePayload.metadata === null) {
            updatePayload.metadata = { tool_name: name }
          }
          const metadataRecord = updatePayload.metadata as Record<string, unknown>
          if (typeof metadataRecord.tool_name !== "string") {
            metadataRecord.tool_name = name
          }
          metadataRecord.generated_image = {
            bucket: generatedImage.bucket,
            path: generatedImage.path,
            signed_url: generatedImage.signedUrl,
            expires_at: generatedImage.expiresAt,
            content_type: generatedImage.contentType,
            source_url: generatedImage.sourceUrl ?? null,
          }
        }

        const selection = "id,title,body,tags,document_type,image_prompt,image_link,metadata"

        const { data, error } = await supabase
          .from("documents")
          .update(updatePayload)
          .eq("id", docId)
          .eq("user_id", userId)
          .select(selection)
          .single()

        if (error) {
          console.error("update_document failed", error)
          const message = error instanceof Error ? error.message : "Unable to update document."
          return { status: "error", result: { status: "error", message }, error: message }
        }

        const row = data as DocumentRow
        const document = {
          id: row.id,
          title: row.title,
          document_type: row.document_type ?? "document",
          tags: row.tags ?? [],
          preview: snippetOf(row.body),
          body: row.body,
          image_prompt: row.image_prompt,
          image_link: row.image_link,
          metadata: row.metadata ?? {},
        }

        return {
          status: "success",
          result: {
            status: "updated",
            doc_id: row.id,
            title: row.title,
            tags: document.tags,
            document_type: document.document_type,
            image_link: document.image_link,
            image_prompt: document.image_prompt,
          },
          summary: {
            doc_id: row.id,
            title: row.title,
          },
          content: {
            kind: "document",
            data: document,
          },
        }
      }
      case "generate_image": {
        const prompt = asNonEmptyString(args.prompt)
        if (!prompt) {
          const message = "prompt is required to generate an image."
          return { status: "error", result: { status: "error", message }, error: message }
        }

        if (typeof args.show_to_user !== "boolean") {
          const message = "show_to_user must be provided as a boolean."
          return { status: "error", result: { status: "error", message }, error: message }
        }

        const showToUser = Boolean(args.show_to_user)
        const tags = toStringArray(args.tags)
        const aspectRatio = asOptionalString((args as Record<string, unknown>).aspect_ratio)

        let generatedImage: GeneratedImageAssetPayload
        try {
          generatedImage = await generateImageAsset({
            supabase,
            prompt,
            tags,
            showToUser,
            userId,
            chatId,
            aspectRatio,
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to generate image."
          return { status: "error", result: { status: "error", message }, error: message }
        }

        return {
          status: "success",
          result: {
            status: "success",
            image_uri: generatedImage.signedUrl,
            tags,
            show_to_user: showToUser,
          },
          summary: {
            image_uri: generatedImage.signedUrl,
            show_to_user: showToUser,
          },
          content: {
            kind: "image_asset",
            data: {
              prompt,
              image_url: generatedImage.signedUrl,
              bucket: generatedImage.bucket,
              path: generatedImage.path,
              signed_url: generatedImage.signedUrl,
              tags,
              show_to_user: showToUser,
              expires_at: generatedImage.expiresAt,
              content_type: generatedImage.contentType,
              source_url: generatedImage.sourceUrl ?? null,
            },
          },
        }
      }
      case "contextual_search": {
        const query = asNonEmptyString(args.query)
        if (!query) {
          const message = "query is required for contextual_search."
          return { status: "error", result: { status: "error", message }, error: message }
        }

        const topK = clampTopK((args as Record<string, unknown>).top_k)
        let results: ContextualSearchResult[]
        try {
          results = await performContextualSearch({ supabase, query, topK })
        } catch (error) {
          const message = error instanceof Error ? error.message : "Contextual search failed."
          return { status: "error", result: { status: "error", message }, error: message }
        }

        return {
          status: "success",
          result: {
            status: "success",
            query,
            top_k: topK,
            results,
          },
          summary: {
            query,
            matches: results.length,
          },
          content: {
            kind: "contextual_search",
            data: {
              query,
              top_k: topK,
              results,
            },
          },
        }
      }
      case "answer_with_sources": {
        const query = asNonEmptyString(args.query)
        if (!query) {
          const message = "query is required for answer_with_sources."
          return { status: "error", result: { status: "error", message }, error: message }
        }

        const topK = clampTopK((args as Record<string, unknown>).top_k)
        let contextualResults = parseContextualResultsInput((args as Record<string, unknown>).contextual_results)

        if (!contextualResults.length) {
          try {
            contextualResults = await performContextualSearch({ supabase, query, topK })
          } catch (error) {
            const message = error instanceof Error ? error.message : "Contextual search failed."
            return { status: "error", result: { status: "error", message }, error: message }
          }
        }

        const limitedResults = contextualResults.slice(0, topK)

        if (!limitedResults.length) {
          const fallbackAnswer = "I could not find relevant NASA bioscience publications for that question."
          return {
            status: "success",
            result: {
              status: "success",
              answer: fallbackAnswer,
              sources: [],
            },
            summary: {
              query,
              matches: 0,
            },
            content: {
              kind: "answer_with_sources",
              data: {
                query,
                text: fallbackAnswer,
                sources: [],
              },
            },
          }
        }

        if (!GEMINI_API_KEY) {
          const message = "answer_with_sources is unavailable because GEMINI_API_KEY is missing."
          return { status: "error", result: { status: "error", message }, error: message }
        }

        const sourcesBlock = limitedResults
          .map((result, index) => {
            const lines: string[] = [`Source [${index + 1}]`]
            if (result.title) lines.push(`Title: ${result.title}`)
            if (result.url) lines.push(`URL: ${result.url}`)
            lines.push(`Excerpt: ${result.text}`)
            return lines.join("\n")
          })
          .join("\n\n")

        const prompt = `Answer the question using only the sources below. Cite sources inline using bracketed numbers like [1].\n\nQuestion:\n${query}\n\nSources:\n${sourcesBlock}`

        let answerText = ""
        try {
          const ragClient = new GeminiClientCtor({ apiKey: GEMINI_API_KEY })
          const response = await ragClient.models.generateContent({
            model: DEFAULT_MODEL,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: { systemInstruction: RAG_ANSWER_SYSTEM_PROMPT },
          })
          answerText = (response.text ?? "").trim()
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to generate grounded answer."
          return { status: "error", result: { status: "error", message }, error: message }
        }

        if (!answerText) {
          answerText = "The provided sources did not contain enough information to answer that question confidently."
        }

        return {
          status: "success",
          result: {
            status: "success",
            answer: answerText,
            sources: limitedResults,
          },
          summary: {
            query,
            matches: limitedResults.length,
          },
          content: {
            kind: "answer_with_sources",
            data: {
              query,
              text: answerText,
              sources: limitedResults,
            },
          },
        }
      }
      case "create_visual_json": {
        const chartType = asNonEmptyString(args.chart_type)
        const title = asNonEmptyString(args.title)
        const dataPoints = parseDataPoints(args.data_points)
        if (!chartType || !title || !dataPoints.length) {
          const message = "chart_type, title, and at least one data point are required."
          return { status: "error", result: { status: "error", message }, error: message }
        }
        const tags = toStringArray(args.tags)
        const content = {
          chart_type: chartType,
          title,
          data_points: dataPoints,
        }
        const summary = `${chartType} chart with ${dataPoints.length} data point${dataPoints.length === 1 ? "" : "s"}`
        const { data, error } = await supabase
          .from("chat_artifacts")
          .insert({
            chat_id: chatId,
            artifact_type: "visual_json",
            title,
            content,
            tags,
            summary,
          })
          .select("id,artifact_type,title,tags,content,summary")
          .single()

        if (error) {
          console.error("create_visual_json failed", error)
          return { status: "error", result: { status: "error", message: error.message }, error: error.message }
        }

        const row = data as ChatArtifactRow
        const artifactType = row.artifact_type
        const artifact = {
          id: row.id,
          type: artifactType,
          artifact_type: artifactType,
          title: row.title,
          tags: row.tags ?? [],
          summary: row.summary,
          metrics: { data_points: dataPoints.length },
          data: {
            chart_type: chartType,
            title,
            data_points: dataPoints,
            tags,
          },
        }

        return {
          status: "success",
          result: {
            status: "success",
            artifact_id: row.id,
            chart_type: chartType,
            data_points: dataPoints,
          },
          summary: {
            artifact_id: row.id,
            chart_type: chartType,
            data_points: dataPoints.length,
          },
          content: {
            kind: "chat_artifact",
            data: artifact,
          },
          artifactLink: { table: "chat_artifacts", id: row.id },
        }
      }
      case "create_knowledge_graph_json": {
        const nodes = parseNodes(args.nodes)
        const edges = parseEdges(args.edges)
        if (!nodes.length || !edges.length) {
          const message = "Both nodes and edges are required to build a knowledge graph."
          return { status: "error", result: { status: "error", message }, error: message }
        }
        const context = asOptionalString(args.context)
        const tags = toStringArray(args.tags)
        const content = {
          nodes,
          edges,
          context,
        }
        const summary = `Knowledge graph with ${nodes.length} nodes and ${edges.length} edges`
        const { data, error } = await supabase
          .from("chat_artifacts")
          .insert({
            chat_id: chatId,
            artifact_type: "knowledge_graph",
            title: context ?? "Knowledge graph",
            content,
            tags,
            summary,
          })
          .select("id,artifact_type,title,tags,content,summary")
          .single()

        if (error) {
          console.error("create_knowledge_graph_json failed", error)
          return { status: "error", result: { status: "error", message: error.message }, error: error.message }
        }

        const row = data as ChatArtifactRow
        const artifactType = row.artifact_type
        const artifact = {
          id: row.id,
          type: artifactType,
          artifact_type: artifactType,
          title: row.title,
          tags: row.tags ?? [],
          summary: row.summary,
          metrics: { nodes: nodes.length, edges: edges.length },
          data: {
            nodes,
            edges,
            context,
            tags,
          },
        }

        return {
          status: "success",
          result: {
            status: "success",
            artifact_id: row.id,
            nodes,
            edges,
          },
          summary: {
            artifact_id: row.id,
            nodes: nodes.length,
            edges: edges.length,
          },
          content: {
            kind: "chat_artifact",
            data: artifact,
          },
          artifactLink: { table: "chat_artifacts", id: row.id },
        }
      }
      case "timeline_builder": {
        const title = asNonEmptyString(args.title)
        const sections = parseTimelineSections(args.timeline_sections)
        if (!title || !sections.length) {
          const message = "title and at least one timeline section are required."
          return { status: "error", result: { status: "error", message }, error: message }
        }
        const tags = toStringArray(args.tags)
        const enrichedSections: Array<{
          title: string
          description: string
          image_prompt?: string | null
          image_link?: string | null
        }> = []

        for (const section of sections) {
          let sectionImageLink: string | null = null
          if (section.image_prompt) {
            try {
              const generated = await generateImageAsset({
                supabase,
                prompt: section.image_prompt,
                tags,
                showToUser: false,
                userId,
                chatId,
              })
              sectionImageLink = generated.signedUrl
            } catch (error) {
              const message = error instanceof Error ? error.message : "Failed to generate timeline image."
              return { status: "error", result: { status: "error", message }, error: message }
            }
          }
          enrichedSections.push({ ...section, image_link: sectionImageLink })
        }

        const content = {
          title,
          timeline_sections: enrichedSections,
        }
        const summary = `Timeline with ${sections.length} section${sections.length === 1 ? "" : "s"}`
        const { data, error } = await supabase
          .from("chat_artifacts")
          .insert({
            chat_id: chatId,
            artifact_type: "timeline",
            title,
            content,
            tags,
            summary,
          })
          .select("id,artifact_type,title,tags,content,summary")
          .single()

        if (error) {
          console.error("timeline_builder failed", error)
          return { status: "error", result: { status: "error", message: error.message }, error: error.message }
        }

        const row = data as ChatArtifactRow
        const artifactType = row.artifact_type
        const imageCount = enrichedSections.filter((section) => section.image_link).length
        const artifact = {
          id: row.id,
          type: artifactType,
          artifact_type: artifactType,
          title: row.title,
          tags: row.tags ?? [],
          summary: row.summary,
          metrics: { sections: sections.length, images: imageCount },
          data: {
            title,
            timeline_sections: enrichedSections,
            tags,
          },
        }

        return {
          status: "success",
          result: {
            status: "success",
            artifact_id: row.id,
            timeline_sections: enrichedSections,
          },
          summary: {
            artifact_id: row.id,
            sections: sections.length,
          },
          content: {
            kind: "chat_artifact",
            data: artifact,
          },
          artifactLink: { table: "chat_artifacts", id: row.id },
        }
      }
      default: {
        const message = `Unknown tool: ${name}`
        return { status: "error", result: { status: "error", message }, error: message }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected tool execution failure"
    console.error(`Tool ${name} threw`, error)
    return { status: "error", result: { status: "error", message }, error: message }
  }
}

const persistConversation = async ({
  client,
  chatId,
  userId,
  chatTitle,
  userMessage,
  assistantMessage,
  assistantThoughts,
  assistantToolCalls,
  assistantToolContents,
}: {
  client: SupabaseClient
  chatId?: string
  userId: string
  chatTitle?: string | null
  userMessage: string
  assistantMessage: string
  assistantThoughts: string
  assistantToolCalls?: ToolCallRecord[]
  assistantToolContents?: ToolContentEntry[]
}): Promise<{ chat: Record<string, unknown>; messages: Array<Record<string, unknown>> }> => {
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

  const assistantToolCallsPayload = serializeToolCalls(assistantToolCalls ?? [])
  const assistantToolContentsPayload = serializeToolContents(assistantToolContents ?? [])

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
      tool_calls: assistantToolCallsPayload,
      tool_contents: assistantToolContentsPayload,
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

  const messages = (insertedMessages ?? []) as Array<Record<string, unknown>>
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
    chat: updatedChat as Record<string, unknown>,
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
  const toolMode: ToolMode = body.toolMode === "web-search" ? "web-search" : "research-tools"

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

  const ai = new GeminiClientCtor({ apiKey: GEMINI_API_KEY })

  let existingChatId = chatId
  let history: GeminiHistoryPart[] = []
  let createdChatIsNew = false

  if (existingChatId) {
    const { data: chatRow, error } = await supabaseClient
      .from("chats")
      .select("id,user_id")
      .eq("id", existingChatId)
      .maybeSingle()

    if (error) {
      console.error("Failed to verify chat", error)
      return new Response(JSON.stringify({ error: "Failed to verify chat" }), { status: 400 })
    }

    if (!chatRow || chatRow.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Chat not found" }), { status: 404 })
    }

    history = await fetchChatHistory(supabaseClient, existingChatId)
  } else {
    const ensured = await ensureChat({ client: supabaseClient, userId: user.id, chatTitle })
    existingChatId = ensured.id
    createdChatIsNew = ensured.wasCreated
    history = []
  }

  const functionTools = toolMode === "research-tools" ? artifactCreationTools : []
  const toolGuidance = functionTools.length ? buildArtifactToolboxGuidance(functionTools) : ""
  const modeGuidance =
    toolMode === "web-search"
      ? "Current mode: General web research. Use googleSearch to gather up-to-date public information and urlContext to inspect promising pages. Do not call internal artifact tools in this mode."
      : "Current mode: Research tools. Prioritize NASA technical documentation within the BioQuery knowledge base and call the available research tools when you can produce structured artifacts."
  const systemInstruction = `You are BioQuery a sophisticated research assistant on the BioQuery platform. Generate concise, well-structured answers for bio researchers. ${modeGuidance}${toolGuidance ? ` ${toolGuidance}` : ''}\n\nReturn short summaries of tool outputs before continuing. At the end of responses, you may occasionally ask the user a follow-up question, like asking them if you could provide the answer in another format (based on your available tools eg. generate an image, create a timeline, knowledge graph etc), or if they would like to explore a related topic.\n\nBe concise and avoid repetition. Always refer to a tool with its purpose when interacting with the user, but never the explicit name of the tool itself.`

  const toolsConfig: Array<Record<string, unknown>> = []
  if (toolMode === "web-search") {
    toolsConfig.push({ googleSearch: {} }, { urlContext: {} })
  } else if (functionTools.length) {
    toolsConfig.push({ functionDeclarations: functionTools })
  }

  const contents: Array<Record<string, unknown>> = history.length ? [...history] : []
  const safeMessage = message.trim()
  contents.push({ role: "user", parts: [{ text: safeMessage }] })

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (payload: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`))
      }

      let assistantContent = ""
      let assistantThoughts = ""
      let assistantToolCalls: ToolCallRecord[] = []
      let assistantToolContents: ToolContentEntry[] = []
      const artifactLinks: Array<{ table: "chat_artifacts"; id: string }> = []
      let hasPersisted = false
      let collectedGroundingMetadata: GroundingMetadata | undefined
      let collectedUrlContextMetadata: UrlContextMetadata | undefined

      try {
        while (true) {
          const pendingCalls: Array<{ name: string; args: Record<string, unknown>; id: number }> = []
          let toolIdCounter = assistantToolCalls.length + 1

          const handleCandidates = (candidates?: GeminiStreamChunk["candidates"]): boolean => {
            let producedCall = false

            for (const candidate of candidates ?? []) {
              if (!candidate) continue

              if (candidate.groundingMetadata) {
                collectedGroundingMetadata = collectedGroundingMetadata
                  ? mergeGroundingMetadata(collectedGroundingMetadata, candidate.groundingMetadata)
                  : candidate.groundingMetadata
              }

              if (candidate.urlContextMetadata) {
                collectedUrlContextMetadata = collectedUrlContextMetadata
                  ? mergeUrlContextMetadata(collectedUrlContextMetadata, candidate.urlContextMetadata)
                  : candidate.urlContextMetadata
              }

              const parts = candidate.content?.parts ?? []
              for (const part of parts) {
                if (part?.thought && typeof part.text === "string" && part.text.length > 0) {
                  assistantThoughts += part.text
                  emit({ type: "thought", delta: part.text })
                }
              }

              const candidateCalls = candidate.functionCalls ?? []
              if (candidateCalls.length > 0) {
                producedCall = true
                for (const call of candidateCalls) {
                  if (!call || typeof call.name !== "string") continue
                  const id = toolIdCounter++
                  pendingCalls.push({ name: call.name, args: call.args ?? {}, id })
                }
              }
            }

            return producedCall
          }

          const config: Record<string, unknown> = {
            systemInstruction,
            thinkingConfig: { includeThoughts: true },
          }
          if (toolsConfig.length) {
            config.tools = toolsConfig
          }

          const streamResp = await ai.models.generateContentStream({
            model: DEFAULT_MODEL,
            contents,
            config,
          })

          let receivedAny = false

          for await (const chunk of streamResp as AsyncIterable<GeminiStreamChunk>) {
            receivedAny = true
            const delta = chunk?.text
            if (delta && delta.length > 0) {
              assistantContent += delta
              emit({ type: "response", delta })
            }

            const producedCall = handleCandidates(chunk?.candidates)

            if (!producedCall) {
              const functionCalls = chunk?.functionCalls ?? []
              for (const call of functionCalls) {
                if (!call || typeof call.name !== "string") continue
                const id = toolIdCounter++
                pendingCalls.push({ name: call.name, args: call.args ?? {}, id })
              }
            }
          }

          if (!receivedAny) {
            const single = await ai.models.generateContent({
              model: DEFAULT_MODEL,
              contents,
              config,
            })

            const producedCall = handleCandidates((single as { candidates?: GeminiStreamChunk["candidates"] }).candidates)

            if (!producedCall) {
              const functionCalls = single.functionCalls ?? []
              if (functionCalls.length === 0) {
                const finalText = single.text ?? ""
                if (finalText) {
                  assistantContent += finalText
                  emit({ type: "response", delta: finalText })
                }
                break
              }

              for (const call of functionCalls) {
                if (!call || typeof call.name !== "string") continue
                const id = toolIdCounter++
                pendingCalls.push({ name: call.name, args: call.args ?? {}, id })
              }
            }
          }

          if (!pendingCalls.length) {
            break
          }

          for (const { name, args, id } of pendingCalls) {
            const sanitized = sanitizeArgs(args)
            assistantToolCalls = [
              ...assistantToolCalls,
              {
                id,
                name,
                status: "pending",
                args: sanitized,
                result: null,
                error: null,
              },
            ]

            emit({ type: "tool_start", tool: { id, name } })

            const marker = `\n\n[tool:${id}]\n\n`
            assistantContent += marker
            emit({ type: "response", delta: marker })

            const outcome = await executeArtifactTool({
              name,
              args,
              userId: user.id,
              chatId: existingChatId!,
              supabase: supabaseClient,
              toolCallId: id,
            })

            if (outcome.artifactLink) {
              artifactLinks.push(outcome.artifactLink)
            }

            const callRecord = assistantToolCalls.find((entry) => entry.id === id)
            if (callRecord) {
              callRecord.status = outcome.status
              callRecord.result = outcome.result ?? null
              callRecord.error = outcome.status === "error" ? outcome.error ?? "Tool execution failed" : null
            }

            let contentEntry: ToolContentEntry | undefined
            if (outcome.content?.kind === "document") {
              contentEntry = {
                type: "document_reference",
                tool_id: id,
                tool_name: name,
                document: outcome.content.data,
              }
            } else if (outcome.content?.kind === "chat_artifact") {
              contentEntry = {
                type: "artifact_reference",
                tool_id: id,
                tool_name: name,
                artifact: outcome.content.data,
              }
            } else if (outcome.content?.kind === "image_asset") {
              contentEntry = {
                type: "image_asset",
                tool_id: id,
                tool_name: name,
                image: outcome.content.data,
              }
            } else if (outcome.content?.kind === "contextual_search") {
              contentEntry = {
                type: "contextual_search",
                tool_id: id,
                tool_name: name,
                search: outcome.content.data,
              }
            } else if (outcome.content?.kind === "answer_with_sources") {
              contentEntry = {
                type: "answer_with_sources",
                tool_id: id,
                tool_name: name,
                answer: outcome.content.data,
              }
            }

            if (contentEntry) {
              assistantToolContents = upsertToolContent(assistantToolContents, contentEntry)
            }

            emit({
              type: "tool_result",
              tool: { id, name },
              status: outcome.status,
              summary: outcome.summary ?? null,
              error: outcome.status === "error" ? outcome.error ?? "Tool execution failed" : null,
              content: contentEntry ?? null,
            })

            contents.push({ role: "model", parts: [{ functionCall: { name, args } }] })
            contents.push({ role: "user", parts: [{ functionResponse: { name, response: outcome.result } }] })
          }
        }

        const { text: enrichedContent, sources } = applyGroundingArtifacts({
          text: assistantContent,
          groundingMetadata: collectedGroundingMetadata,
          urlContextMetadata: collectedUrlContextMetadata,
        })

        assistantContent = enrichedContent

        if (sources.length > 0) {
          assistantToolContents = upsertToolContent(assistantToolContents, {
            type: "grounding_sources",
            sources,
          })
        }

        const persistence = await persistConversation({
          client: supabaseClient,
          chatId: existingChatId,
          userId: user.id,
          chatTitle,
          userMessage: safeMessage,
          assistantMessage: assistantContent,
          assistantThoughts,
          assistantToolCalls,
          assistantToolContents,
        })

        hasPersisted = true

        const assistantMessageRow = persistence.messages.find((row) => row.sender === "assistant")

        if (assistantMessageRow && artifactLinks.length) {
          for (const link of artifactLinks) {
            if (link.table === "chat_artifacts") {
              try {
                await supabaseClient
                  .from("chat_artifacts")
                  .update({ message_id: assistantMessageRow.id, updated_at: assistantMessageRow.created_at })
                  .eq("id", link.id)
              } catch (error) {
                console.error("Failed to backfill artifact message_id", error)
              }
            }
          }
        }

        emit({
          type: "complete",
          chat: persistence.chat,
          messages: persistence.messages,
          thoughts: assistantThoughts,
          sources,
        })
        controller.close()
      } catch (error) {
        console.error("Streaming error", error)
        const message = error instanceof Error ? error.message : "Unexpected error"
        emit({ type: "error", message })

        if (createdChatIsNew && !hasPersisted && existingChatId) {
          try {
            await supabaseClient.from("chats").delete().eq("id", existingChatId)
          } catch (cleanupError) {
            console.error("Failed to clean up chat after error", cleanupError)
          }
        }

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
