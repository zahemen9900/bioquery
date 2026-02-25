import { useId, useMemo } from 'react'


type ToolCallEntry = {
	id: number
	name: string
	status: 'pending' | 'success' | 'error'
	error: string | null
	summary?: Record<string, unknown> | null
}

type DocumentReference = {
	id: string
	title: string | null
	documentType: string | null
	tags: string[]
	preview: string | null
	body: string | null
	imagePrompt: string | null
	imageLink: string | null
}

type ArtifactReference = {
	id: string
	type: string
	title: string | null
	summary: string | null
	tags: string[]
	metrics: Record<string, unknown> | null
	data: Record<string, unknown> | null
}

type ImageAssetReference = {
	url: string
	prompt: string | null
	expiresAt: string | null
	showToUser: boolean
	tags: string[]
	bucket: string | null
	path: string | null
	contentType: string | null
	sourceUrl: string | null
}


type TimelineSection = {
	title: string
	description: string
	imagePrompt?: string | null
	imageLink?: string | null
}

export type TimelineData = {
	title: string
	sections: TimelineSection[]
	tags: string[]
}

type ChartDataPoint = {
	label: string
	value: number
}

export type VisualChartData = {
	title: string
	chartType: string
	dataPoints: ChartDataPoint[]
	tags: string[]
}

export type KnowledgeGraphNode = {
	id: string
	label: string
	type?: string | null
}

export type KnowledgeGraphEdge = {
	source: string
	target: string
	relation: string
}

export type KnowledgeGraphData = {
	nodes: KnowledgeGraphNode[]
	edges: KnowledgeGraphEdge[]
	context: string | null
	tags: string[]
}

type ContextualSearchResultEntry = {
	pmcid: string | null
	title: string | null
	url: string | null
	chunkIndex: number | null
	text: string
	similarityScore: number | null
}

type ContextualSearchData = {
	query: string
	topK: number
	results: ContextualSearchResultEntry[]
}

type AnswerWithSourcesData = {
	query: string
	answer: string
	sources: ContextualSearchResultEntry[]
}






export const parseStringArray = (value: unknown, limit = 16): string[] => {
	if (!Array.isArray(value)) return []
	const results: string[] = []
	for (const entry of value) {
		if (typeof entry !== 'string') continue
		const trimmed = entry.trim()
		if (!trimmed) continue
		results.push(trimmed)
		if (results.length >= limit) break
	}
	return results
}

const coerceNumber = (value: unknown): number | null => {
	if (typeof value === 'number' && Number.isFinite(value)) return value
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : null
}

const ensureString = (value: unknown): string | null => {
	if (typeof value !== 'string') return null
	const trimmed = value.trim()
	return trimmed.length > 0 ? trimmed : null
}

export const ensureRecord = (value: unknown): Record<string, unknown> | null => {
	if (!value) return null
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value)
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				return parsed as Record<string, unknown>
			}
		} catch {
			return null
		}
	}
	if (typeof value !== 'object' || Array.isArray(value)) return null
	return value as Record<string, unknown>
}

const parseTimelineSectionsData = (value: unknown): TimelineSection[] => {
	if (!Array.isArray(value)) return []
	const sections: TimelineSection[] = []
	for (const entry of value) {
		if (!entry || typeof entry !== 'object') continue
		const record = entry as Record<string, unknown>
		const title = ensureString(record.title)
		const description = ensureString(record.description)
		if (!title || !description) continue
		const imagePrompt = ensureString(record.image_prompt) ?? ensureString(record.imagePrompt)
		const imageLink = ensureString(record.image_link) ?? ensureString(record.imageLink)
		sections.push({ title, description, imagePrompt, imageLink })
	}
	return sections
}

const parseChartDataPoints = (value: unknown): ChartDataPoint[] => {
	if (!Array.isArray(value)) return []
	const points: ChartDataPoint[] = []
	for (const entry of value) {
		if (!entry || typeof entry !== 'object') continue
		const record = entry as Record<string, unknown>
		const label = ensureString(record.label)
		const numeric = coerceNumber(record.value)
		if (!label || numeric === null) continue
		points.push({ label, value: numeric })
	}
	return points
}

const parseGraphNodesData = (value: unknown): KnowledgeGraphNode[] => {
	if (!Array.isArray(value)) return []
	const nodes: KnowledgeGraphNode[] = []
	for (const entry of value) {
		if (!entry || typeof entry !== 'object') continue
		const record = entry as Record<string, unknown>
		const id = ensureString(record.id)
		const label = ensureString(record.label)
		if (!id || !label) continue
		const type = ensureString(record.type)
		nodes.push({ id, label, type })
	}
	return nodes
}

const parseGraphEdgesData = (value: unknown): KnowledgeGraphEdge[] => {
	if (!Array.isArray(value)) return []
	const edges: KnowledgeGraphEdge[] = []
	for (const entry of value) {
		if (!entry || typeof entry !== 'object') continue
		const record = entry as Record<string, unknown>
		const source = ensureString(record.source)
		const target = ensureString(record.target)
		const relation = ensureString(record.relation)
		if (!source || !target || !relation) continue
		edges.push({ source, target, relation })
	}
	return edges
}

const truncateSnippet = (value: string, limit = 480): string => {
	if (value.length <= limit) return value
	return `${value.slice(0, limit)}…`
}


const parseContextualResultEntries = (value: unknown): ContextualSearchResultEntry[] => {
	if (!Array.isArray(value)) return []
	const results: ContextualSearchResultEntry[] = []
	for (const entry of value) {
		if (!entry || typeof entry !== 'object') continue
		const record = entry as Record<string, unknown>
		const text = ensureString(record.text)
		if (!text) continue
		const chunkIndexValue = coerceNumber(record.chunk_index)
		results.push({
			pmcid: ensureString(record.pmcid),
			title: ensureString(record.title),
			url: ensureString(record.url),
			chunkIndex: chunkIndexValue === null ? null : Math.trunc(chunkIndexValue),
			text: truncateSnippet(text),
			similarityScore: coerceNumber(record.similarity_score),
		})
	}
	return results
}

export const toTimelineData = (artifact: ArtifactReference): TimelineData | null => {
	const source = ensureRecord(artifact.data)
	if (!source) return null
	const sections = parseTimelineSectionsData(source.timeline_sections ?? source.sections)
	if (!sections.length) return null
	const title = ensureString(source.title) ?? artifact.title ?? 'Timeline overview'
	const tags = parseStringArray(source.tags ?? artifact.tags)
	return { title, sections, tags }
}

export const toVisualChartData = (artifact: ArtifactReference): VisualChartData | null => {
	const source = ensureRecord(artifact.data)
	if (!source) return null
	const dataPoints = parseChartDataPoints(source.data_points ?? source.points ?? source.values)
	if (!dataPoints.length) return null
	const chartType = (ensureString(source.chart_type) ?? ensureString(source.chartType) ?? artifact.type).toLowerCase()
	const title = ensureString(source.title) ?? artifact.title ?? 'Generated visualization'
	const tags = parseStringArray(source.tags ?? artifact.tags)
	return { title, chartType, dataPoints, tags }
}

export const toKnowledgeGraphData = (artifact: ArtifactReference): KnowledgeGraphData | null => {
	const source = ensureRecord(artifact.data)
	if (!source) return null
	const nodes = parseGraphNodesData(source.nodes)
	const edges = parseGraphEdgesData(source.edges)
	if (!nodes.length || !edges.length) return null
	const context = ensureString(source.context)
	const tags = parseStringArray(source.tags ?? artifact.tags)
	return { nodes, edges, context, tags }
}

export const CHART_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#f87171']








export type DocumentModalData = {
	title: string | null
	documentType: string | null
	tags: string[]
	imageLink: string | null
	body: string | null
}

export const toDocumentData = (data: unknown): DocumentModalData | null => {
	const source = ensureRecord(data)
	if (!source) return null
	return {
		title: source.title as string | null,
		documentType: (source.document_type || source.type) as string | null,
		tags: parseStringArray(source.tags),
		imageLink: (source.image_link || source.imageLink) as string | null,
		body: (source.body || source.content) as string | null,
	}
}
