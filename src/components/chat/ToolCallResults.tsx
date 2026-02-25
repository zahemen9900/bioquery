import { useId, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
	HiOutlineChartBarSquare,
	HiOutlineDocumentText,
	HiOutlineGlobeAlt,
	HiOutlinePhoto,
	HiOutlineQueueList,
	HiOutlineSparkles,
	HiOutlineXCircle,
	HiMiniChevronDown,
} from 'react-icons/hi2'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast/useToast'
import supabase from '@/lib/supabase-client'
import type { ChatMessage } from '@/contexts/chat-context-types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const openExternalLink = (url?: string | null) => {

	if (!url || typeof window === 'undefined') {
		return
	}

	try {
		const parsed = new URL(url)
		window.open(parsed.toString(), '_blank', 'noopener,noreferrer')
	} catch {
		window.open(url, '_blank', 'noopener,noreferrer')
	}
}

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

type ToolMetadata = {
	call: ToolCallEntry | null
	artifact: ArtifactReference | null
	document: DocumentReference | null
	image: ImageAssetReference | null
	search: ContextualSearchData | null
	answer: AnswerWithSourcesData | null
}

type TimelineSection = {
	title: string
	description: string
	imagePrompt?: string | null
	imageLink?: string | null
}

type TimelineData = {
	title: string
	sections: TimelineSection[]
	tags: string[]
}

type ChartDataPoint = {
	label: string
	value: number
}

type VisualChartData = {
	title: string
	chartType: string
	dataPoints: ChartDataPoint[]
	tags: string[]
}

type KnowledgeGraphNode = {
	id: string
	label: string
	type?: string | null
}

type KnowledgeGraphEdge = {
	source: string
	target: string
	relation: string
}

type KnowledgeGraphData = {
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

type TimelineModalState = {
	artifact: ArtifactReference
	call: ToolCallEntry | null
	data: TimelineData
}

type VisualModalState = {
	artifact: ArtifactReference
	data: VisualChartData
}

type GraphModalState = {
	artifact: ArtifactReference
	call: ToolCallEntry | null
	data: KnowledgeGraphData
}

type ToolCallResultsProps = {
	message: ChatMessage
	toolId?: number
}

const ARTIFACT_ICONS: Record<string, typeof HiOutlineSparkles> = {
	visual_json: HiOutlineChartBarSquare,
	knowledge_graph: HiOutlineGlobeAlt,
	timeline: HiOutlineQueueList,
}

const parseStringArray = (value: unknown, limit = 16): string[] => {
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

const ensureRecord = (value: unknown): Record<string, unknown> | null => {
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

const formatSimilarityScore = (value: number | null): string | null => {
	if (typeof value !== 'number' || Number.isNaN(value)) return null
	return value.toFixed(3)
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

const parseContextualSearchPayload = (record: Record<string, unknown> | null): ContextualSearchData | null => {
	if (!record) return null
	const query = ensureString(record.query)
	if (!query) return null
	const topKRaw = coerceNumber(record.top_k)
	const results = parseContextualResultEntries(record.results)
	const topK = topKRaw === null ? Math.max(1, results.length || 5) : Math.min(20, Math.max(1, Math.round(topKRaw)))
	return {
		query,
		topK,
		results,
	}
}

const parseAnswerWithSourcesPayload = (record: Record<string, unknown> | null): AnswerWithSourcesData | null => {
	if (!record) return null
	const answer = ensureString(record.text) ?? ensureString(record.answer)
	if (!answer) return null
	const query = ensureString(record.query) ?? 'User question'
	const sources = parseContextualResultEntries(record.sources)
	return {
		query,
		answer,
		sources,
	}
}

const toTimelineData = (artifact: ArtifactReference): TimelineData | null => {
	const source = ensureRecord(artifact.data)
	if (!source) return null
	const sections = parseTimelineSectionsData(source.timeline_sections ?? source.sections)
	if (!sections.length) return null
	const title = ensureString(source.title) ?? artifact.title ?? 'Timeline overview'
	const tags = parseStringArray(source.tags ?? artifact.tags)
	return { title, sections, tags }
}

const toVisualChartData = (artifact: ArtifactReference): VisualChartData | null => {
	const source = ensureRecord(artifact.data)
	if (!source) return null
	const dataPoints = parseChartDataPoints(source.data_points ?? source.points ?? source.values)
	if (!dataPoints.length) return null
	const chartType = (ensureString(source.chart_type) ?? ensureString(source.chartType) ?? artifact.type).toLowerCase()
	const title = ensureString(source.title) ?? artifact.title ?? 'Generated visualization'
	const tags = parseStringArray(source.tags ?? artifact.tags)
	return { title, chartType, dataPoints, tags }
}

const toKnowledgeGraphData = (artifact: ArtifactReference): KnowledgeGraphData | null => {
	const source = ensureRecord(artifact.data)
	if (!source) return null
	const nodes = parseGraphNodesData(source.nodes)
	const edges = parseGraphEdgesData(source.edges)
	if (!nodes.length || !edges.length) return null
	const context = ensureString(source.context)
	const tags = parseStringArray(source.tags ?? artifact.tags)
	return { nodes, edges, context, tags }
}

const CHART_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#f87171']

type GraphVisualizationProps = {
	nodes: KnowledgeGraphNode[]
	edges: KnowledgeGraphEdge[]
	selectedNodeId: string | null
	onSelect?: (nodeId: string) => void
}

const GraphVisualization = ({ nodes, edges, selectedNodeId, onSelect }: GraphVisualizationProps) => {
	const size = 800
	const center = size / 2
	const activeNodeId = selectedNodeId && nodes.some((node) => node.id === selectedNodeId) ? selectedNodeId : nodes[0]?.id ?? null
	const rawId = useId()
	const gradientId = useMemo(() => rawId.replace(/:/g, ''), [rawId])

	const layout = useMemo(() => {
		const positions = new Map<string, { x: number; y: number }>()
		if (!nodes.length) {
			return positions
		}

		const focusId = activeNodeId && nodes.some((node) => node.id === activeNodeId) ? activeNodeId : nodes[0]?.id
		if (!focusId) {
			return positions
		}

		const connectedIds = new Set<string>()
		for (const edge of edges) {
			if (edge.source === focusId) connectedIds.add(edge.target)
			if (edge.target === focusId) connectedIds.add(edge.source)
		}

		const centerPoint = { x: center, y: center }
		positions.set(focusId, centerPoint)

		const others = nodes.filter((node) => node.id !== focusId)
		const primary = others.filter((node) => connectedIds.has(node.id))
		const secondary = others.filter((node) => !connectedIds.has(node.id))

		const placeNodes = (list: KnowledgeGraphNode[], radius: number) => {
			if (!list.length) return
			const angleStep = (Math.PI * 2) / list.length
			list.forEach((node, index) => {
				const angle = -Math.PI / 2 + index * angleStep
				positions.set(node.id, {
					x: center + Math.cos(angle) * radius,
					y: center + Math.sin(angle) * radius,
				})
			})
		}

		placeNodes(primary, size * 0.32)
		placeNodes(secondary, size * 0.45)

		return positions
	}, [nodes, edges, activeNodeId, center])

	const neighborSet = useMemo(() => {
		const neighbors = new Set<string>()
		if (!activeNodeId) return neighbors
		for (const edge of edges) {
			if (edge.source === activeNodeId) neighbors.add(edge.target)
			if (edge.target === activeNodeId) neighbors.add(edge.source)
		}
		return neighbors
	}, [edges, activeNodeId])

	if (!nodes.length) {
		return (
			<div className="flex h-full items-center justify-center text-sm text-scheme-muted-text">
				No graph data available.
			</div>
		)
	}

	const handleSelect = (nodeId: string) => {
		if (onSelect) onSelect(nodeId)
	}

	return (
		<svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
			<defs>
				<radialGradient id={`${gradientId}-bg`} cx="50%" cy="50%" r="70%">
					<stop offset="0%" stopColor="rgba(59, 130, 246, 0.1)" />
					<stop offset="100%" stopColor="rgba(15, 23, 42, 0.05)" />
				</radialGradient>
			</defs>
			<rect width={size} height={size} fill={`url(#${gradientId}-bg)`} rx={38} ry={38} />
			{edges.map((edge, index) => {
				const source = layout.get(edge.source)
				const target = layout.get(edge.target)
				if (!source || !target) return null
				const isActive = activeNodeId ? edge.source === activeNodeId || edge.target === activeNodeId : false
				const midX = (source.x + target.x) / 2
				const midY = (source.y + target.y) / 2
				return (
					<g key={`edge-${edge.source}-${edge.target}-${index}`}>
						<line
							x1={source.x}
							y1={source.y}
							x2={target.x}
							y2={target.y}
							stroke={isActive ? 'rgba(96, 165, 250, 0.65)' : 'rgba(148, 163, 184, 0.35)'}
							strokeWidth={isActive ? 3 : 1.6}
							strokeLinecap="round"
						/>
						{edge.relation ? (
							<text
								x={midX}
								y={midY - 6}
								textAnchor="middle"
								fontSize={12}
								fill="rgba(226, 232, 240, 0.7)"
							>
								{edge.relation}
							</text>
						) : null}
					</g>
				)
			})}
			{nodes.map((node) => {
				const position = layout.get(node.id)
				if (!position) return null
				const isActive = node.id === activeNodeId
				const isNeighbor = neighborSet.has(node.id)
				const radius = isActive ? 26 : isNeighbor ? 20 : 16
				const fill = isActive
					? 'rgba(52, 211, 153, 0.9)'
					: isNeighbor
						? 'rgba(96, 165, 250, 0.85)'
						: 'rgba(148, 163, 184, 0.75)'
				return (
					<g
						key={node.id}
						transform={`translate(${position.x}, ${position.y})`}
						className="cursor-pointer transition-transform duration-200 hover:scale-105"
						onClick={() => handleSelect(node.id)}
					>
						{isActive ? (
							<circle r={radius + 8} fill="none" stroke="rgba(52, 211, 153, 0.4)" strokeWidth={3} />
						) : null}
						<circle r={radius} fill={fill} stroke="rgba(15, 23, 42, 0.9)" strokeWidth={isActive ? 3 : 2} />
						<text
							y={radius + 20}
							textAnchor="middle"
							fontSize={isActive ? 16 : 13}
							fill="rgba(226, 232, 240, 0.95)"
							style={{ pointerEvents: 'none' }}
						>
							{node.label}
						</text>
						{node.type ? (
							<text
								y={radius + 36}
								textAnchor="middle"
								fontSize={11}
								fill="rgba(148, 163, 184, 0.7)"
								style={{ pointerEvents: 'none' }}
							>
								{node.type.toUpperCase()}
							</text>
						) : null}
					</g>
				)
			})}
		</svg>
	)
}

const extractToolMetadata = (message: ChatMessage): { order: number[]; map: Map<number, ToolMetadata> } => {
	const map = new Map<number, ToolMetadata>()
	const order: number[] = []

	const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : []
	for (const entry of toolCalls) {
		if (!entry || typeof entry !== 'object') continue
		const id = coerceNumber((entry as Record<string, unknown>).id)
		const statusValue = (entry as Record<string, unknown>).status
		const status = statusValue === 'pending' || statusValue === 'success' || statusValue === 'error' ? statusValue : null
		if (!id || !status) continue
		const name = ensureString((entry as Record<string, unknown>).name) ?? 'Tool call'
		const error = ensureString((entry as Record<string, unknown>).error)
		const summaryField = (entry as Record<string, unknown>).result
		map.set(id, {
			call: {
				id,
				name,
				status,
				error,
				summary: summaryField && typeof summaryField === 'object' ? (summaryField as Record<string, unknown>) : null,
			},
			artifact: null,
			document: null,
			image: null,
			search: null,
			answer: null,
		})
		order.push(id)
	}

	const toolContents = Array.isArray(message.tool_contents) ? message.tool_contents : []
	for (const entry of toolContents) {
		if (!entry || typeof entry !== 'object') continue
		const type = (entry as Record<string, unknown>).type
		const rawToolId = (entry as Record<string, unknown>).tool_id
		const toolId = coerceNumber(rawToolId)
		if (!toolId) continue

		const slot =
			map.get(toolId) ?? {
				call: null,
				artifact: null,
				document: null,
				image: null,
				search: null,
				answer: null,
			}

		if (type === 'artifact_reference') {
			const payload = (entry as Record<string, unknown>).artifact
			if (payload && typeof payload === 'object') {
				const artifactRecord = payload as Record<string, unknown>
				const artifactId = ensureString(artifactRecord.id)
				if (artifactId) {
					slot.artifact = {
						id: artifactId,
						type: ensureString(artifactRecord.artifact_type) ?? 'artifact',
						title: ensureString(artifactRecord.title),
						summary: ensureString(artifactRecord.summary),
						tags: parseStringArray(artifactRecord.tags),
						metrics:
							typeof artifactRecord.metrics === 'object' && artifactRecord.metrics !== null
								? (artifactRecord.metrics as Record<string, unknown>)
								: null,
						data: ensureRecord(artifactRecord.data),
					}
				}
			}
		} else if (type === 'document_reference') {
			const payload = (entry as Record<string, unknown>).document
			if (payload && typeof payload === 'object') {
				const docRecord = payload as Record<string, unknown>
				const docId = ensureString(docRecord.id)
				if (docId) {
					slot.document = {
						id: docId,
						title: ensureString(docRecord.title),
						documentType: ensureString(docRecord.document_type),
						tags: parseStringArray(docRecord.tags),
						preview: ensureString(docRecord.preview),
						body: ensureString(docRecord.body),
						imagePrompt: ensureString(docRecord.image_prompt) ?? ensureString(docRecord.imagePrompt),
						imageLink: ensureString(docRecord.image_link) ?? ensureString(docRecord.imageLink),
					}
				}
			}
		} else if (type === 'image_asset') {
			const payload = (entry as Record<string, unknown>).image
			if (payload && typeof payload === 'object') {
				const imageRecord = payload as Record<string, unknown>
				const signedUrl = ensureString(imageRecord.signed_url) ?? ensureString(imageRecord.image_url)
				if (signedUrl) {
					slot.image = {
						url: signedUrl,
						prompt: ensureString(imageRecord.prompt),
						expiresAt: ensureString(imageRecord.expires_at),
						showToUser: Boolean(imageRecord.show_to_user),
						tags: parseStringArray(imageRecord.tags),
						bucket: ensureString(imageRecord.bucket),
						path: ensureString(imageRecord.path),
						contentType: ensureString(imageRecord.content_type),
						sourceUrl: ensureString(imageRecord.source_url),
					}
				}
			}
		} else if (type === 'contextual_search') {
			const payload = ensureRecord((entry as Record<string, unknown>).search)
			const parsedSearch = parseContextualSearchPayload(payload)
			if (parsedSearch) {
				slot.search = parsedSearch
			}
		} else if (type === 'answer_with_sources') {
			const payload = ensureRecord((entry as Record<string, unknown>).answer)
			const parsedAnswer = parseAnswerWithSourcesPayload(payload)
			if (parsedAnswer) {
				slot.answer = parsedAnswer
			}
		}

		if (!map.has(toolId)) {
			order.push(toolId)
		}

		map.set(toolId, slot)
	}

	return { order, map }
}

const renderMetrics = (metrics: Record<string, unknown> | null): string | null => {
	if (!metrics) return null
	const entries = Object.entries(metrics)
	if (!entries.length) return null
	return entries
		.filter(([, value]) => typeof value === 'number' || typeof value === 'string')
		.map(([key, value]) => `${key}: ${value}`)
		.join(' · ')
}

const formatExpiryLabel = (expiresAt: string | null): string => {
	if (!expiresAt) return 'Signed link active for 365 days'
	const parsed = new Date(expiresAt)
	if (Number.isNaN(parsed.getTime())) return 'Signed link active for 365 days'
	return `Signed link expires ${parsed.toLocaleDateString(undefined, { dateStyle: 'medium' })}`
}

export function ToolCallResults({ message, toolId }: ToolCallResultsProps) {
	const { showToast } = useToast()
	const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})
	const [savedMap, setSavedMap] = useState<Record<string, boolean>>({})
	const [artifactCache, setArtifactCache] = useState<Record<string, ArtifactReference>>({})
	const [documentCache, setDocumentCache] = useState<Record<string, DocumentReference>>({})
	const [loadingArtifacts, setLoadingArtifacts] = useState<Record<string, boolean>>({})
	const [loadingDocuments, setLoadingDocuments] = useState<Record<string, boolean>>({})
	const [documentModal, setDocumentModal] = useState<DocumentReference | null>(null)
	const [timelineModal, setTimelineModal] = useState<TimelineModalState | null>(null)
	const [timelineIndex, setTimelineIndex] = useState(0)
	const [visualModal, setVisualModal] = useState<VisualModalState | null>(null)
	const [graphModal, setGraphModal] = useState<GraphModalState | null>(null)
	const [graphSelection, setGraphSelection] = useState<string | null>(null)

	const metadata = useMemo(() => extractToolMetadata(message), [message])
	const canPersist = Boolean(message.chat_id) && !message.chat_id.startsWith('temp-') && !message.pending
	const openExternalLink = (url: string | null) => {
		if (!url) return
		try {
			window.open(url, '_blank', 'noopener,noreferrer')
		} catch (error) {
			console.error('Failed to open link', error)
		}
	}

	const getArtifactWithData = async (artifact: ArtifactReference): Promise<ArtifactReference | null> => {
		if (!artifact.id) return null
		setLoadingArtifacts((prev) => ({ ...prev, [artifact.id]: true }))
		try {
			const { data, error } = await supabase
				.from('chat_artifacts')
				.select('id, artifact_type, title, tags, summary, content')
				.eq('id', artifact.id)
				.maybeSingle()

			if (error) throw error
			if (!data) return null

			const contentRaw = (data as { content?: unknown }).content
			let contentRecord: Record<string, unknown> | null = null
			if (contentRaw && typeof contentRaw === 'object' && !Array.isArray(contentRaw)) {
				contentRecord = contentRaw as Record<string, unknown>
			} else if (typeof contentRaw === 'string') {
				try {
					const parsed = JSON.parse(contentRaw)
					if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
						contentRecord = parsed as Record<string, unknown>
					}
				} catch (parseError) {
					console.error('Failed to parse artifact content', parseError)
				}
			}

			const parsedTags = parseStringArray((data as Record<string, unknown>).tags)
			const nextArtifact: ArtifactReference = {
				...artifact,
				type: ensureString((data as Record<string, unknown>).artifact_type) ?? artifact.type,
				title: ensureString((data as Record<string, unknown>).title) ?? artifact.title,
				summary: ensureString((data as Record<string, unknown>).summary) ?? artifact.summary,
				tags: parsedTags.length ? parsedTags : artifact.tags,
				metrics: artifact.metrics,
				data: contentRecord ?? artifact.data,
			}

			setArtifactCache((prev) => ({ ...prev, [artifact.id]: nextArtifact }))
			return nextArtifact
		} catch (error) {
			console.error('Failed to load artifact', error)
			showToast('We could not load the full artifact. Try again shortly.')
			return null
		} finally {
			setLoadingArtifacts((prev) => {
				const next = { ...prev }
				delete next[artifact.id]
				return next
			})
		}
	}

	const getDocumentWithBody = async (document: DocumentReference): Promise<DocumentReference | null> => {
		if (!document.id) return null
		setLoadingDocuments((prev) => ({ ...prev, [document.id]: true }))
		try {
			const { data, error } = await supabase
				.from('documents')
				.select('id, title, body, tags, document_type, image_prompt, image_link')
				.eq('id', document.id)
				.maybeSingle()

			if (error) throw error
			if (!data) return null

			const record = data as Record<string, unknown>
			const parsedTags = parseStringArray(record.tags)
			const nextDocument: DocumentReference = {
				...document,
				title: ensureString(record.title) ?? document.title,
				documentType: ensureString(record.document_type) ?? document.documentType,
				tags: parsedTags.length ? parsedTags : document.tags,
				preview: document.preview ?? (ensureString(record.body)?.slice(0, 180) ?? null),
				body: ensureString(record.body),
				imagePrompt: ensureString(record.image_prompt) ?? document.imagePrompt,
				imageLink: ensureString(record.image_link) ?? document.imageLink,
			}

			setDocumentCache((prev) => ({ ...prev, [document.id]: nextDocument }))
			return nextDocument
		} catch (error) {
			console.error('Failed to load document', error)
			showToast('We could not load the full document. Try again shortly.')
			return null
		} finally {
			setLoadingDocuments((prev) => {
				const next = { ...prev }
				delete next[document.id]
				return next
			})
		}
	}

	const handleOpenTimeline = async (artifact: ArtifactReference, call: ToolCallEntry | null) => {
		const existing = toTimelineData(artifactCache[artifact.id] ?? artifact)
		if (existing) {
			setTimelineModal({ artifact: artifactCache[artifact.id] ?? artifact, call, data: existing })
			setTimelineIndex(0)
			return
		}
		const loaded = await getArtifactWithData(artifact)
		if (!loaded) return
		const timelineData = toTimelineData(loaded)
		if (!timelineData) {
			showToast('Timeline data is unavailable for this artifact')
			return
		}
		setTimelineModal({ artifact: loaded, call, data: timelineData })
		setTimelineIndex(0)
	}

	const handleOpenVisualization = async (artifact: ArtifactReference) => {
		const cached = artifactCache[artifact.id] ?? artifact
		const current = toVisualChartData(cached)
		if (current) {
			setVisualModal({ artifact: cached, data: current })
			return
		}
		const loaded = await getArtifactWithData(artifact)
		if (!loaded) return
		const chartData = toVisualChartData(loaded)
		if (!chartData) {
			showToast('Visualization data is unavailable for this artifact')
			return
		}
		setVisualModal({ artifact: loaded, data: chartData })
	}

	const handleOpenGraph = async (artifact: ArtifactReference, call: ToolCallEntry | null) => {
		const cached = artifactCache[artifact.id] ?? artifact
		const current = toKnowledgeGraphData(cached)
		if (current) {
			setGraphModal({ artifact: cached, call, data: current })
			setGraphSelection(current.nodes[0]?.id ?? null)
			return
		}
		const loaded = await getArtifactWithData(artifact)
		if (!loaded) return
		const graphData = toKnowledgeGraphData(loaded)
		if (!graphData) {
			showToast('Graph data is unavailable for this artifact')
			return
		}
		setGraphModal({ artifact: loaded, call, data: graphData })
		setGraphSelection(graphData.nodes[0]?.id ?? null)
	}

	const handleOpenDocument = async (document: DocumentReference) => {
		const cached = documentCache[document.id] ?? document
		if (cached.body && cached.body.length > 0) {
			setDocumentModal(cached)
			return
		}
		const loaded = await getDocumentWithBody(document)
		if (!loaded) return
		setDocumentModal(loaded)
	}

	const renderImageAsset = (image: ImageAssetReference) => {
		return (
			<div className="mt-3 rounded-2xl border border-biosphere-500/25 bg-biosphere-500/5 p-4 backdrop-blur">
				<div className="flex items-start gap-3">
					<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-biosphere-500/20 text-biosphere-200">
						<HiOutlinePhoto className="h-5 w-5" />
					</span>
					<div className="flex-1 space-y-3">
						<div className="space-y-1">
							<p className="text-sm font-semibold text-scheme-text">Generated image</p>
							<p className="text-xs text-scheme-muted-text/80">{formatExpiryLabel(image.expiresAt)}</p>
						</div>
						<div className="overflow-hidden rounded-xl border border-biosphere-500/25 bg-space-900/40">
							<img
								src={image.url}
								alt="Generated image"
								className="max-h-72 w-full object-cover"
								loading="lazy"
							/>
						</div>
						{image.tags.length ? (
							<div className="flex flex-wrap gap-1.5">
								{image.tags.map((tag) => (
									<Badge key={tag} variant="outline" className="rounded-full border-biosphere-500/40 bg-biosphere-500/10 text-[0.7rem] text-biosphere-200">
										{tag}
									</Badge>
								))}
							</div>
						) : null}
						<div className="flex flex-wrap items-center gap-2">
							<Button
								type="button"
								size="sm"
								className="rounded-full bg-biosphere-500 text-space-900 hover:bg-biosphere-400"
								onClick={() => openExternalLink(image.url)}
							>
								Open full image
							</Button>
							{image.sourceUrl ? (
								<Button
									type="button"
									size="sm"
									variant="ghost"
									className="rounded-full text-xs text-scheme-muted-text hover:text-scheme-text"
									onClick={() => openExternalLink(image.sourceUrl)}
								>
									Source
								</Button>
							) : null}
							{image.bucket && image.path ? (
								<Badge variant="secondary" className="rounded-full bg-scheme-surface/80 text-xs text-scheme-muted-text">
									{image.bucket}/{image.path.split('/').pop()}
								</Badge>
							) : null}
						</div>
					</div>
				</div>
			</div>
		)
	}

	const persistArtifact = async (artifact: ArtifactReference | null, callId: number) => {
		if (!artifact || !message.chat_id) return
		const key = `artifact:${artifact.id}`

		if (savedMap[key]) {
			showToast('Already saved to collections')
			return
		}

		if (!canPersist) {
			showToast('Save becomes available once the response finishes')
			return
		}

		setSavingMap((prev) => ({ ...prev, [key]: true }))
		try {
			const { data, error } = await supabase
				.from('chat_artifacts')
				.select('id')
				.eq('id', artifact.id)
				.maybeSingle()

			if (error) throw error

			if (!data) {
				const payload: Record<string, unknown> = {
					chat_id: message.chat_id,
					artifact_type: artifact.type,
					title: artifact.title,
					summary: artifact.summary,
					tags: artifact.tags,
					content: {
						...artifact,
						tool_call_id: callId,
					},
				}

				if (typeof message.id === 'number' && message.id > 0) {
					payload.message_id = message.id
				}

				const { error: insertError } = await supabase.from('chat_artifacts').insert(payload)
				if (insertError) throw insertError
			}

			setSavedMap((prev) => ({ ...prev, [key]: true }))
			showToast('Saved to collections')
		} catch (error) {
			console.error('Failed to save artifact', error)
			showToast('We could not save this artifact. Try again shortly.')
		} finally {
			setSavingMap((prev) => ({ ...prev, [key]: false }))
		}
	}

	const persistDocument = async (document: DocumentReference | null, callId: number) => {
		if (!document || !message.chat_id) return

		const key = `document:${document.id}`
		if (savedMap[key]) {
			showToast('Already saved to collections')
			return
		}

		if (!canPersist) {
			showToast('Save becomes available once the response finishes')
			return
		}

		setSavingMap((prev) => ({ ...prev, [key]: true }))
		try {
			const { data: existing, error: checkError } = await supabase
				.from('chat_artifacts')
				.select('id')
				.eq('content->>document_id', document.id)
				.maybeSingle()

			if (checkError) throw checkError

			if (!existing) {
				const payload: Record<string, unknown> = {
					chat_id: message.chat_id,
					artifact_type: 'document',
					title: document.title ?? 'Document excerpt',
					summary: document.preview,
					tags: document.tags,
					content: {
						document_id: document.id,
						document_type: document.documentType,
						title: document.title,
						preview: document.preview,
						tags: document.tags,
						body: document.body,
						image_prompt: document.imagePrompt,
						image_link: document.imageLink,
						tool_call_id: callId,
					},
				}

				if (typeof message.id === 'number' && message.id > 0) {
					payload.message_id = message.id
				}

				const { error: insertError } = await supabase.from('chat_artifacts').insert(payload)
				if (insertError) throw insertError
			}

			setSavedMap((prev) => ({ ...prev, [key]: true }))
			showToast('Saved to collections')
		} catch (error) {
			console.error('Failed to save document artifact', error)
			showToast('We could not save this document. Try again shortly.')
		} finally {
			setSavingMap((prev) => ({ ...prev, [key]: false }))
		}
	}

	const renderGenericArtifact = (artifact: ArtifactReference, call: ToolCallEntry | null) => {
		const iconKey = typeof artifact.type === 'string' ? artifact.type.toLowerCase() : ''
		const displayType = typeof artifact.type === 'string' && artifact.type.length > 0 ? artifact.type : 'artifact'
		const Icon = ARTIFACT_ICONS[iconKey] ?? HiOutlineSparkles
		const key = `artifact:${artifact.id}`
		const isSaving = Boolean(savingMap[key])
		const isSaved = Boolean(savedMap[key])
		const metricsLabel = renderMetrics(artifact.metrics)
		const disabled = !canPersist || isSaving || isSaved

		return (
			<div className="mt-3 relative overflow-hidden rounded-2xl border border-biosphere-500/20 dark:border-biosphere-500/10 bg-gradient-to-br from-white/80 via-biosphere-50/30 to-white/40 dark:from-space-800/80 dark:via-biosphere-900/10 dark:to-space-900/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:shadow-md group hover:border-biosphere-500/30 dark:hover:border-biosphere-500/20">
				<div className="flex items-start justify-between gap-4 relative z-10">
					<div className="flex items-center gap-3.5">
						<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-biosphere-500/20 to-biosphere-600/5 text-biosphere-600 dark:text-biosphere-300 ring-1 ring-biosphere-500/30 shadow-inner group-hover:ring-biosphere-500/50 transition-all">
							<Icon className="h-5 w-5 drop-shadow-[0_0_8px_rgba(0,231,179,0.3)] group-hover:scale-110 transition-transform" />
						</span>
						<div className="space-y-0.5">
							<p className="text-[15px] font-bold text-slate-800 dark:text-space-200 tracking-tight">{artifact.title ?? 'Generated artifact'}</p>
							<p className="text-[0.7rem] font-semibold text-slate-400 dark:text-space-400/80 uppercase tracking-widest">
								{displayType.replace('_', ' ')}
							</p>
						</div>
					</div>
					{metricsLabel ? <span className="text-[0.7rem] font-semibold text-slate-500 dark:text-space-400 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5">{metricsLabel}</span> : null}
				</div>
				{artifact.summary ? (
					<p className="mt-3 text-sm leading-relaxed text-scheme-text/85">{artifact.summary}</p>
				) : null}
				{artifact.tags.length ? (
					<div className="mt-3 flex flex-wrap gap-1.5">
						{artifact.tags.map((tag) => (
							<Badge key={tag} variant="outline" className="rounded-full border-biosphere-500/40 bg-biosphere-500/10 text-[0.7rem] text-biosphere-200">
								{tag}
							</Badge>
						))}
					</div>
				) : null}
				<div className="mt-4 flex flex-wrap items-center gap-2">
					<Button
						type="button"
						size="sm"
						className="rounded-full bg-biosphere-500 text-space-900 hover:bg-biosphere-400"
						onClick={() => persistArtifact(artifact, call?.id ?? 0)}
						disabled={disabled}
					>
						{isSaved ? 'Saved to collections' : isSaving ? 'Saving…' : 'Save to collections'}
					</Button>
				</div>
			</div>
		)
	}

	const renderTimelineArtifact = (artifact: ArtifactReference, call: ToolCallEntry | null) => {
		const key = `artifact:${artifact.id}`
		const isSaving = Boolean(savingMap[key])
		const isSaved = Boolean(savedMap[key])
		const metricsLabel = renderMetrics(artifact.metrics)
		const disabled = !canPersist || isSaving || isSaved
		const timelineData = toTimelineData(artifact)
		const timelineTitle = timelineData?.title ?? artifact.title ?? 'Generated timeline'
		const firstSection = timelineData?.sections[0]
		const isLoadingDetails = Boolean(loadingArtifacts[artifact.id])
		const displayType = typeof artifact.type === 'string' && artifact.type.length > 0 ? artifact.type : 'timeline'
		return (
			<div className="mt-3 relative overflow-hidden rounded-2xl border border-biosphere-500/20 dark:border-biosphere-500/10 bg-gradient-to-br from-white/80 via-amber-50/20 to-white/40 dark:from-space-800/80 dark:via-amber-900/10 dark:to-space-900/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:shadow-md group hover:border-amber-500/30 dark:hover:border-amber-500/20">
				<div className="flex items-start justify-between gap-4 relative z-10">
					<div className="flex items-center gap-3.5">
						<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30 shadow-inner group-hover:ring-amber-500/50 transition-all">
							<HiOutlineQueueList className="h-5 w-5 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform" />
						</span>
						<div className="space-y-0.5">
							<p className="text-[15px] font-bold text-slate-800 dark:text-space-200 tracking-tight">{timelineTitle}</p>
							<p className="text-[0.7rem] font-semibold text-slate-400 dark:text-space-400/80 uppercase tracking-widest">
								{displayType.replace('_', ' ')}
							</p>
						</div>
					</div>
					{metricsLabel ? <span className="text-[0.7rem] font-semibold text-slate-500 dark:text-space-400 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5">{metricsLabel}</span> : null}
				</div>
				{firstSection ? (
					<div className="mt-3 rounded-xl border border-biosphere-500/20 bg-space-950/50 p-3">
						<p className="text-xs font-semibold uppercase tracking-wide text-biosphere-200/80">
							Featured section
						</p>
						<p className="mt-1 text-sm font-semibold text-scheme-text">{firstSection.title}</p>
						<p className="mt-1 text-sm leading-relaxed text-scheme-text/85">{firstSection.description}</p>
					</div>
				) : artifact.summary ? (
					<p className="mt-3 text-sm leading-relaxed text-scheme-text/85">{artifact.summary}</p>
				) : null}
				{artifact.tags.length ? (
					<div className="mt-3 flex flex-wrap gap-1.5">
						{artifact.tags.map((tag) => (
							<Badge key={tag} variant="outline" className="rounded-full border-biosphere-500/40 bg-biosphere-500/10 text-[0.7rem] text-biosphere-200">
								{tag}
							</Badge>
						))}
					</div>
				) : null}
				<div className="mt-4 flex flex-wrap items-center gap-2">
					<Button
						type="button"
						size="sm"
						className="rounded-full bg-biosphere-500 text-space-900 hover:bg-biosphere-400"
						onClick={() => {
							void handleOpenTimeline(artifact, call)
						}}
						disabled={isLoadingDetails}
					>
						{isLoadingDetails ? 'Loading timeline…' : 'View timeline'}
					</Button>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						className="rounded-full text-xs text-scheme-muted-text hover:text-scheme-text"
						onClick={() => persistArtifact(artifact, call?.id ?? 0)}
						disabled={disabled}
					>
						{isSaved ? 'Saved to collections' : isSaving ? 'Saving…' : 'Save to collections'}
					</Button>
				</div>
			</div>
		)
	}

	const renderVisualArtifact = (artifact: ArtifactReference, call: ToolCallEntry | null) => {
		const key = `artifact:${artifact.id}`
		const isSaving = Boolean(savingMap[key])
		const isSaved = Boolean(savedMap[key])
		const metricsLabel = renderMetrics(artifact.metrics)
		const disabled = !canPersist || isSaving || isSaved
		const chartData = toVisualChartData(artifact)
		const previewPoints = chartData ? chartData.dataPoints.slice(0, 3) : []
		const chartTitle = chartData?.title ?? artifact.title ?? 'Generated visualization'
		const displayType = typeof artifact.type === 'string' && artifact.type.length > 0 ? artifact.type : 'visualization'
		const chartTypeLabel = chartData?.chartType ?? displayType.replace('_', ' ')
		const isLoadingDetails = Boolean(loadingArtifacts[artifact.id])
		return (
			<div className="mt-3 relative overflow-hidden rounded-2xl border border-biosphere-500/20 dark:border-biosphere-500/10 bg-gradient-to-br from-white/80 via-blue-50/30 to-white/40 dark:from-space-800/80 dark:via-blue-900/10 dark:to-space-900/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:shadow-md group hover:border-blue-500/30 dark:hover:border-blue-500/20">
				<div className="flex items-start justify-between gap-4 relative z-10">
					<div className="flex items-center gap-3.5">
						<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30 shadow-inner group-hover:ring-blue-500/50 transition-all">
							<HiOutlineChartBarSquare className="h-5 w-5 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform" />
						</span>
						<div className="space-y-0.5">
							<p className="text-[15px] font-bold text-slate-800 dark:text-space-200 tracking-tight">{chartTitle}</p>
							<p className="text-[0.7rem] font-semibold text-slate-400 dark:text-space-400/80 uppercase tracking-widest">
								{chartTypeLabel}
							</p>
						</div>
					</div>
					{metricsLabel ? <span className="text-[0.7rem] font-semibold text-slate-500 dark:text-space-400 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5">{metricsLabel}</span> : null}
				</div>
				{previewPoints.length ? (
					<div className="mt-3 space-y-2 text-xs text-scheme-muted-text/90">
						{previewPoints.map((point) => (
							<div key={point.label} className="flex items-center justify-between gap-3 rounded-lg border border-biosphere-500/15 bg-space-950/50 px-3 py-2 text-scheme-text/80">
								<span className="font-medium">{point.label}</span>
								<span>{point.value}</span>
							</div>
						))}
					</div>
				) : null}
				{artifact.tags.length ? (
					<div className="mt-3 flex flex-wrap gap-1.5">
						{artifact.tags.map((tag) => (
							<Badge key={tag} variant="outline" className="rounded-full border-biosphere-500/40 bg-biosphere-500/10 text-[0.7rem] text-biosphere-200">
								{tag}
							</Badge>
						))}
					</div>
				) : null}
				<div className="mt-4 flex flex-wrap items-center gap-2">
					<Button
						type="button"
						size="sm"
						className="rounded-full bg-biosphere-500 text-space-900 hover:bg-biosphere-400"
						onClick={() => {
							void handleOpenVisualization(artifact)
						}}
						disabled={isLoadingDetails}
					>
						{isLoadingDetails ? 'Loading visualization…' : 'View visualization'}
					</Button>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						className="rounded-full text-xs text-scheme-muted-text hover:text-scheme-text"
						onClick={() => persistArtifact(artifact, call?.id ?? 0)}
						disabled={disabled}
					>
						{isSaved ? 'Saved to collections' : isSaving ? 'Saving…' : 'Save to collections'}
					</Button>
				</div>
			</div>
		)
	}

	const renderGraphArtifact = (artifact: ArtifactReference, call: ToolCallEntry | null) => {
		const key = `artifact:${artifact.id}`
		const isSaving = Boolean(savingMap[key])
		const isSaved = Boolean(savedMap[key])
		const metricsLabel = renderMetrics(artifact.metrics)
		const disabled = !canPersist || isSaving || isSaved
		const graphData = toKnowledgeGraphData(artifact)
		const nodePreview = graphData ? graphData.nodes.slice(0, 3) : []
		const nodeCount = graphData ? graphData.nodes.length : coerceNumber(artifact.metrics?.nodes) ?? 0
		const edgeCount = graphData ? graphData.edges.length : coerceNumber(artifact.metrics?.edges) ?? 0
		const graphContext = graphData?.context ?? artifact.summary ?? null
		const isLoadingDetails = Boolean(loadingArtifacts[artifact.id])
		return (
			<div className="mt-3 relative overflow-hidden rounded-2xl border border-biosphere-500/20 dark:border-biosphere-500/10 bg-gradient-to-br from-white/80 via-purple-50/20 to-white/40 dark:from-space-800/80 dark:via-purple-900/10 dark:to-space-900/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:shadow-md group hover:border-purple-500/30 dark:hover:border-purple-500/20">
				<div className="flex items-start justify-between gap-4 relative z-10">
					<div className="flex items-center gap-3.5">
						<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/30 shadow-inner group-hover:ring-purple-500/50 transition-all">
							<HiOutlineGlobeAlt className="h-5 w-5 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform" />
						</span>
						<div className="space-y-0.5">
							<p className="text-[15px] font-bold text-slate-800 dark:text-space-200 tracking-tight">{artifact.title ?? 'Knowledge graph'}</p>
							<p className="text-[0.7rem] font-semibold text-slate-400 dark:text-space-400/80 uppercase tracking-widest">
								{nodeCount} nodes · {edgeCount} edges
							</p>
						</div>
					</div>
					{metricsLabel ? <span className="text-[0.7rem] font-semibold text-slate-500 dark:text-space-400 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5">{metricsLabel}</span> : null}
				</div>
				{nodePreview.length ? (
					<div className="mt-3 grid gap-2 text-xs text-scheme-muted-text/90">
						{nodePreview.map((node) => (
							<div key={node.id} className="rounded-lg border border-biosphere-500/15 bg-space-950/50 px-3 py-2 text-scheme-text/85">
								<p className="font-medium">{node.label}</p>
								{node.type ? <p className="text-[0.65rem] uppercase tracking-wide text-biosphere-200/80">{node.type}</p> : null}
							</div>
						))}
					</div>
				) : null}
				{graphContext ? (
					<p className="mt-3 text-xs leading-relaxed text-scheme-muted-text/85">{graphContext}</p>
				) : null}
				{artifact.tags.length ? (
					<div className="mt-3 flex flex-wrap gap-1.5">
						{artifact.tags.map((tag) => (
							<Badge key={tag} variant="outline" className="rounded-full border-biosphere-500/40 bg-biosphere-500/10 text-[0.7rem] text-biosphere-200">
								{tag}
							</Badge>
						))}
					</div>
				) : null}
				<div className="mt-4 flex flex-wrap items-center gap-2">
					<Button
						type="button"
						size="sm"
						className="rounded-full bg-biosphere-500 text-space-900 hover:bg-biosphere-400"
						onClick={() => {
							void handleOpenGraph(artifact, call)
						}}
						disabled={isLoadingDetails}
					>
						{isLoadingDetails ? 'Loading graph…' : 'Explore graph'}
					</Button>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						className="rounded-full text-xs text-scheme-muted-text hover:text-scheme-text"
						onClick={() => persistArtifact(artifact, call?.id ?? 0)}
						disabled={disabled}
					>
						{isSaved ? 'Saved to collections' : isSaving ? 'Saving…' : 'Save to collections'}
					</Button>
				</div>
			</div>
		)
	}

	const renderArtifact = (artifact: ArtifactReference, call: ToolCallEntry | null) => {
		const normalizedType = typeof artifact.type === 'string' ? artifact.type.toLowerCase() : ''
		if (normalizedType === 'timeline') {
			return renderTimelineArtifact(artifact, call)
		}
		if (normalizedType === 'visual_json') {
			return renderVisualArtifact(artifact, call)
		}
		if (normalizedType === 'knowledge_graph') {
			return renderGraphArtifact(artifact, call)
		}
		return renderGenericArtifact(artifact, call)
	}

	const renderDocument = (document: DocumentReference, call: ToolCallEntry | null) => {
		const key = `document:${document.id}`
		const isSaving = Boolean(savingMap[key])
		const isSaved = Boolean(savedMap[key])
		const disabled = !canPersist || isSaving || isSaved
		const isLoadingDoc = Boolean(loadingDocuments[document.id])

		return (
			<div className="mt-3 relative overflow-hidden rounded-2xl border border-black/5 dark:border-white/5 bg-gradient-to-br from-white/80 via-slate-50/50 to-white/40 dark:from-space-800/80 dark:via-space-800/50 dark:to-space-900/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:shadow-md group hover:border-black/10 dark:hover:border-white/10">
				<div className="flex items-start gap-4 relative z-10">
					<span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-200/50 to-slate-300/20 dark:from-space-700/50 dark:to-space-700/20 text-slate-500 dark:text-space-300 ring-1 ring-black/5 dark:ring-white/10 shadow-inner group-hover:ring-black/10 dark:group-hover:ring-white/20 transition-all">
						<HiOutlineDocumentText className="h-5 w-5 drop-shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform" />
					</span>
					<div className="flex-1 space-y-1.5">
						<div className="space-y-0.5">
							<p className="text-[15px] font-bold text-slate-800 dark:text-space-200 tracking-tight">{document.title ?? 'Generated document'}</p>
							<p className="text-[0.7rem] font-semibold text-slate-400 dark:text-space-400/80 uppercase tracking-widest">
								{document.documentType ?? 'document'}
							</p>
						</div>
						{document.preview ? (
							<p className="line-clamp-3 text-sm leading-relaxed text-scheme-text/85">{document.preview}</p>
						) : null}
						{document.tags.length ? (
							<div className="flex flex-wrap gap-1.5">
								{document.tags.map((tag) => (
									<Badge key={tag} variant="outline" className="rounded-full border-scheme-border/60 text-[0.7rem] text-scheme-muted-text">
										{tag}
									</Badge>
								))}
							</div>
						) : null}
						<div className="flex flex-wrap items-center gap-2 pt-1">
							<Button
								type="button"
								size="sm"
								className="rounded-full bg-biosphere-500 text-space-900 hover:bg-biosphere-400"
								onClick={() => {
									void handleOpenDocument(document)
								}}
								disabled={isLoadingDoc}
							>
								{isLoadingDoc ? 'Loading document…' : 'Read document'}
							</Button>
							<Button
								type="button"
								size="sm"
								variant="outline"
								className="rounded-full border-biosphere-500/60 text-biosphere-300 hover:bg-biosphere-500/10"
								onClick={() => persistDocument(document, call?.id ?? 0)}
								disabled={disabled}
							>
								{isSaved ? 'Saved to collections' : isSaving ? 'Saving…' : 'Save to collections'}
							</Button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	const renderError = (call: ToolCallEntry) => (
		<div className="mt-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
			<p className="flex items-center gap-2 font-semibold">
				<HiOutlineXCircle className="h-5 w-5" />
				This result could not be generated
			</p>
			{call.error ? <p className="mt-1 text-xs text-rose-200/80">{call.error}</p> : null}
		</div>
	)

	const renderBlock = (id: number) => {
		const entry = metadata.map.get(id)
		if (!entry) return null

		const { call, artifact, document, image, search, answer } = entry
		const resolvedArtifact = artifact ? artifactCache[artifact.id] ?? artifact : null
		const resolvedDocument = document ? documentCache[document.id] ?? document : null

		if (!resolvedArtifact && !resolvedDocument && !image && !search && !answer && (!call || call.status !== 'error')) {
			return null
		}

		return (
			<div key={`tool-block-${id}`} className="my-3 space-y-3">
				{call && call.status === 'error' ? renderError(call) : null}
				{answer ? renderAnswerWithSources(answer) : null}
				{search ? renderContextualSearch(search) : null}
				{resolvedArtifact ? renderArtifact(resolvedArtifact, call) : null}
				{resolvedDocument ? renderDocument(resolvedDocument, call) : null}
				{image ? renderImageAsset(image) : null}
			</div>
		)
	}

	const documentModalDialog = (
		<Dialog
			open={Boolean(documentModal)}
			onOpenChange={(open) => {
				if (!open) {
					setDocumentModal(null)
				}
			}}
		>
			{documentModal ? (
				<DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden">
					<DialogHeader className="pr-8">
						<DialogTitle className="text-2xl font-bold leading-tight">{documentModal.title ?? 'Generated document'}</DialogTitle>
						<DialogDescription className="flex flex-wrap items-center gap-2 text-sm">
							<span className="rounded-full bg-biosphere-500/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-biosphere-200">
								{documentModal.documentType ?? 'document'}
							</span>
							{documentModal.tags.length ? (
								<>
									{documentModal.tags.map((tag) => (
										<span key={tag} className="rounded-full border border-biosphere-500/30 bg-biosphere-500/5 px-3 py-1 text-xs text-biosphere-300 transition-colors hover:bg-biosphere-500/15">
											{tag}
										</span>
									))}
								</>
							) : null}
						</DialogDescription>
					</DialogHeader>
					<ScrollArea className="mt-6 h-[calc(90vh-200px)] max-h-[calc(90vh-180px)] pr-4">
						<div className="space-y-8">
							{documentModal.imageLink ? (
								<div className="group relative overflow-hidden rounded-2xl border border-biosphere-500/25 shadow-2xl transition-all hover:border-biosphere-500/40 hover:shadow-biosphere-500/10">
									<img
										src={documentModal.imageLink}
										alt={documentModal.title ?? 'Document illustration'}
										className="w-full transition-transform duration-300 group-hover:scale-[1.02]"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-space-900/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
								</div>
							) : null}
							<div className="rounded-2xl border border-scheme-border-subtle/40 bg-gradient-to-br from-scheme-surface/50 to-scheme-surface/30 p-8 shadow-inner">
								{documentModal.body ? (
									<ReactMarkdown
										remarkPlugins={[remarkGfm]}
										className="prose prose-invert max-w-none text-base leading-relaxed text-scheme-text/95 [&>*]:mb-5 [&>*:last-child]:mb-0 [&_h1]:mb-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-biosphere-200 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-biosphere-300 [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-scheme-text [&_p]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-scheme-text [&_em]:italic [&_em]:text-biosphere-200/90 [&_a]:font-medium [&_a]:text-biosphere-400 [&_a]:underline [&_a]:decoration-biosphere-500/30 [&_a]:underline-offset-2 [&_a]:transition-colors hover:[&_a]:text-biosphere-300 hover:[&_a]:decoration-biosphere-400/60 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_li]:leading-relaxed [&_blockquote]:border-l-4 [&_blockquote]:border-biosphere-500/40 [&_blockquote]:bg-scheme-muted/10 [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:pr-3 [&_blockquote]:italic [&_blockquote]:text-scheme-muted-text [&_code]:rounded [&_code]:bg-biosphere-500/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-biosphere-200 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-scheme-border-subtle/50 [&_pre]:bg-space-900/40 [&_pre]:p-4 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-lg [&_th]:border [&_th]:border-scheme-border-subtle/50 [&_th]:bg-biosphere-500/10 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-biosphere-200 [&_td]:border [&_td]:border-scheme-border-subtle/40 [&_td]:px-4 [&_td]:py-2 [&_hr]:my-8 [&_hr]:border-scheme-border-subtle/30"
									>
										{documentModal.body}
									</ReactMarkdown>
								) : (
									<p className="text-center text-sm text-scheme-muted-text">No document body was provided.</p>
								)}
							</div>
						</div>
					</ScrollArea>
				</DialogContent>
			) : null}
		</Dialog>
	)

	const timelineModalDialog = (
		<Dialog
			open={Boolean(timelineModal)}
			onOpenChange={(open) => {
				if (!open) {
					setTimelineModal(null)
					setTimelineIndex(0)
				}
			}}
		>
			{timelineModal ? (
				<DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden border border-black/5 dark:border-white/10 bg-white/90 dark:bg-space-950/80 backdrop-blur-3xl shadow-2xl p-0 sm:p-0">
					<div className="p-8">
						<DialogHeader className="pr-8 space-y-2">
							<DialogTitle className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">{timelineModal.data.title}</DialogTitle>
							<DialogDescription className="flex flex-wrap items-center gap-2 text-sm pt-2">
								<span className="rounded-full bg-biosphere-500/15 ring-1 ring-biosphere-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-biosphere-600 dark:text-biosphere-400">
									{timelineModal.data.sections.length} section{timelineModal.data.sections.length === 1 ? '' : 's'}
								</span>
								{timelineModal.data.tags.length ? (
									<>
										{timelineModal.data.tags.slice(0, 3).map((tag) => (
											<span key={tag} className="rounded-full border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-space-800/80 px-3.5 py-1 text-xs font-semibold text-slate-600 dark:text-space-300">
												{tag}
											</span>
										))}
									</>
								) : null}
							</DialogDescription>
						</DialogHeader>
						<div className="mt-8 flex flex-col gap-6">
							<ScrollArea className="max-h-20 mask-image-fade">
								<div className="flex flex-wrap items-center gap-3 pb-4">
									{timelineModal.data.sections.map((section, index) => {
										const isActive = index === timelineIndex
										return (
											<button
												type="button"
												key={`${section.title}-${index}`}
												onClick={() => setTimelineIndex(index)}
												className={`flex-shrink-0 rounded-full border px-5 py-2 text-sm font-bold transition-all ${isActive
													? 'border-biosphere-500/50 bg-gradient-to-br from-biosphere-500 to-biosphere-600 text-white shadow-[0_0_15px_rgba(0,231,179,0.3)] ring-2 ring-biosphere-500/20 ring-offset-2 ring-offset-white dark:ring-offset-space-950 scale-105'
													: 'border-black/5 dark:border-white/10 bg-slate-100 dark:bg-space-800 text-slate-500 dark:text-space-400 hover:border-biosphere-500/30 hover:bg-biosphere-50 dark:hover:bg-biosphere-500/10 hover:text-biosphere-600 dark:hover:text-biosphere-400'
													}`}
											>
												{index + 1}. {section.title.length > 20 ? section.title.substring(0, 20) + '...' : section.title}
											</button>
										)
									})}
								</div>
							</ScrollArea>
							{(() => {
								const sections = timelineModal.data.sections
								const safeIndex = Math.min(timelineIndex, sections.length - 1)
								const activeSection = sections[safeIndex]
								if (!activeSection) {
									return <p className="text-sm text-scheme-muted-text">No sections available.</p>
								}
								return (
									<ScrollArea className="h-[calc(92vh-320px)] max-h-[calc(92vh-320px)] rounded-3xl border border-black/5 dark:border-white/10 bg-slate-50/80 dark:bg-space-900/40 shadow-inner backdrop-blur-md">
										<div className="space-y-8 p-10">
											<div className="flex items-center gap-5">
												<span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-biosphere-500 to-biosphere-600 text-xl font-extrabold text-white shadow-[0_0_20px_rgba(0,231,179,0.3)] ring-1 ring-white/20">
													{safeIndex + 1}
												</span>
												<h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-space-300 drop-shadow-sm leading-tight">{activeSection.title}</h3>
											</div>
											<p className="text-[17px] leading-relaxed text-slate-700 dark:text-space-200">{activeSection.description}</p>
											{activeSection.imageLink ? (
												<div className="overflow-hidden rounded-3xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.6)] group">
													<img
														src={activeSection.imageLink}
														alt={activeSection.title}
														className="w-full h-auto object-cover max-h-[500px] transition-transform duration-700 group-hover:scale-[1.03]"
													/>
												</div>
											) : null}
										</div>
									</ScrollArea>
								)
							})()}
							<div className="flex items-center justify-between pt-2">
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => setTimelineIndex((prev) => Math.max(prev - 1, 0))}
									disabled={timelineIndex === 0}
									className="rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-space-800"
								>
									Previous section
								</Button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() =>
										setTimelineIndex((prev) =>
											Math.min(prev + 1, Math.max(timelineModal.data.sections.length - 1, 0)),
										)
									}
									disabled={timelineIndex >= timelineModal.data.sections.length - 1}
									className="rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-space-800"
								>
									Next section
								</Button>
							</div>
						</div>
					</div>
				</DialogContent>
			) : null}
		</Dialog>
	)

	const visualModalDialog = (
		<Dialog open={Boolean(visualModal)} onOpenChange={(open) => {
			if (!open) {
				setVisualModal(null)
			}
		}}>
			{visualModal ? (
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden border border-black/5 dark:border-white/10 bg-white/90 dark:bg-space-950/80 backdrop-blur-3xl shadow-2xl p-0 sm:p-0">
					<div className="p-8">
						<DialogHeader className="pr-8 space-y-2">
							<DialogTitle className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">{visualModal.data.title}</DialogTitle>
							<DialogDescription className="flex flex-wrap items-center gap-2 text-sm pt-2">
								<span className="rounded-full bg-blue-500/15 ring-1 ring-blue-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
									{visualModal.data.chartType} • {visualModal.data.dataPoints.length} data point{visualModal.data.dataPoints.length === 1 ? '' : 's'}
								</span>
								{visualModal.data.tags.length ? (
									<>
										{visualModal.data.tags.slice(0, 3).map((tag) => (
											<span key={tag} className="rounded-full border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-space-800/80 px-3.5 py-1 text-xs font-semibold text-slate-600 dark:text-space-300">
												{tag}
											</span>
										))}
									</>
								) : null}
							</DialogDescription>
						</DialogHeader>
						<ScrollArea className="mt-8 max-h-[70vh] pr-4 mask-image-fade">
							<div className="space-y-6">
								{(() => {
									const { chartType, dataPoints } = visualModal.data
									const normalizedType = chartType.toLowerCase()
									if (normalizedType.includes('pie')) {
										const total = dataPoints.reduce((sum, point) => sum + Math.max(point.value, 0), 0)
										let current = 0
										const segments = dataPoints.map((point, index) => {
											const value = Math.max(point.value, 0)
											const start = total > 0 ? (current / total) * 360 : 0
											current += value
											const end = total > 0 ? (current / total) * 360 : start
											const color = CHART_COLORS[index % CHART_COLORS.length]
											return `${color} ${start}deg ${end}deg`
										})
										const pieStyle = total
											? { background: `conic-gradient(${segments.join(', ')})` }
											: {
												background:
													'linear-gradient(135deg, rgba(96,165,250,0.45), rgba(14,165,233,0.25))',
											}
										return (
											<div className="flex flex-col items-center gap-4">
												<div className="h-56 w-56 rounded-full border border-scheme-border-subtle/40" style={pieStyle} />
												<ul className="w-full space-y-2 text-xs text-scheme-muted-text/85">
													{dataPoints.map((point, index) => (
														<li key={point.label} className="flex items-center justify-between gap-3 rounded-lg border border-scheme-border-subtle/60 bg-scheme-surface/80 px-3 py-2">
															<span className="flex items-center gap-2">
																<span
																	className="inline-block h-2 w-2 rounded-full"
																	style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
																/>
																{point.label}
															</span>
															<span>{point.value}</span>
														</li>
													))}
												</ul>
											</div>
										)
									}
									const max = dataPoints.reduce((acc, point) => Math.max(acc, Math.abs(point.value)), 0)
									return (
										<div className="space-y-4 rounded-3xl border border-black/5 dark:border-white/10 bg-slate-50/80 dark:bg-space-900/40 p-8 shadow-inner backdrop-blur-md">
											{dataPoints.map((point, index) => {
												const proportion = max > 0 ? Math.abs(point.value) / max : 0
												const width = Math.max(proportion * 100, 4)
												const color = CHART_COLORS[index % CHART_COLORS.length]
												return (
													<div key={point.label} className="group">
														<div className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-space-200 mb-2">
															<span>{point.label}</span>
															<span className="text-slate-500 dark:text-space-400">{point.value}</span>
														</div>
														<div className="h-3 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden ring-1 ring-inset ring-black/5 dark:ring-white/10">
															<div className="h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all duration-1000 group-hover:brightness-110" style={{ width: `${width}%`, backgroundColor: color }} />
														</div>
													</div>
												)
											})}
										</div>
									)
								})()}
							</div>
						</ScrollArea>
					</div>
				</DialogContent>
			) : null}
		</Dialog>
	)

	const graphModalDialog = (
		<Dialog
			open={Boolean(graphModal)}
			onOpenChange={(open) => {
				if (!open) {
					setGraphModal(null)
					setGraphSelection(null)
				}
			}}
		>
			{graphModal ? (
				<DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden border border-black/5 dark:border-white/10 bg-white/90 dark:bg-space-950/80 backdrop-blur-3xl shadow-2xl p-0 sm:p-0">
					<div className="p-8 h-full flex flex-col">
						<DialogHeader className="pr-8 space-y-2">
							<DialogTitle className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">{graphModal.artifact.title ?? 'Knowledge graph'}</DialogTitle>
							<DialogDescription className="flex flex-wrap items-center gap-2 text-sm pt-2">
								<span className="rounded-full bg-purple-500/15 ring-1 ring-purple-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
									{graphModal.data.nodes.length} nodes • {graphModal.data.edges.length} connections
								</span>
								{graphModal.data.tags.length ? (
									<>
										{graphModal.data.tags.slice(0, 3).map((tag) => (
											<span key={tag} className="rounded-full border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-space-800/80 px-3.5 py-1 text-xs font-semibold text-slate-600 dark:text-space-300">
												{tag}
											</span>
										))}
									</>
								) : null}
							</DialogDescription>
						</DialogHeader>
						{(() => {
							const nodeMap = new Map(graphModal.data.nodes.map((node) => [node.id, node]))
							const activeNodeId = graphSelection ?? graphModal.data.nodes[0]?.id ?? null
							const selectedNode = activeNodeId ? nodeMap.get(activeNodeId) ?? null : null
							const relatedEdges = selectedNode
								? graphModal.data.edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
								: []
							return (
								<div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr] flex-1 overflow-hidden">
									<div className="space-y-4 flex flex-col overflow-hidden">
										<div className="flex items-center gap-2.5 px-1">
											<div className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
											<p className="text-sm font-bold tracking-wide uppercase text-slate-700 dark:text-space-300">Entities</p>
										</div>
										<ScrollArea className="flex-1 rounded-3xl border border-black/5 dark:border-white/10 bg-slate-50/80 dark:bg-space-900/40 shadow-inner backdrop-blur-md">
											<div className="flex flex-col py-2">
												{graphModal.data.nodes.map((node) => {
													const isActive = node.id === activeNodeId
													return (
														<button
															type="button"
															key={node.id}
															onClick={() => setGraphSelection(node.id)}
															className={`flex flex-col items-start gap-1.5 border-b border-black/5 dark:border-white/5 px-5 py-3 text-left transition-all relative overflow-hidden group ${isActive
																? 'bg-gradient-to-r from-purple-500/10 to-transparent'
																: 'hover:bg-black/5 dark:hover:bg-white/5'
																}`}
														>
															{isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />}
															<span className={cn("text-sm font-bold transition-colors", isActive ? "text-purple-700 dark:text-purple-300" : "text-slate-700 dark:text-space-200 group-hover:text-slate-900 dark:group-hover:text-white")}>{node.label}</span>
															{node.type ? (
																<span className={cn("rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest transition-colors", isActive ? "bg-purple-500/20 text-purple-700 dark:text-purple-300" : "bg-black/5 dark:bg-white/10 text-slate-500 dark:text-space-400 group-hover:bg-black/10 dark:group-hover:bg-white/20")}>
																	{node.type}
																</span>
															) : null}
														</button>
													)
												})}
												{graphModal.data.nodes.length === 0 ? (
													<p className="px-5 py-6 text-sm text-slate-500 dark:text-space-400 font-medium">No entities found.</p>
												) : null}
											</div>
										</ScrollArea>
									</div>
									<div className="space-y-6 flex flex-col overflow-hidden max-h-[72vh]">
										<div className="relative flex-1 min-h-[420px] overflow-hidden rounded-3xl border border-black/5 dark:border-white/10 bg-gradient-to-br from-slate-50/90 via-slate-100/70 to-slate-200/60 dark:from-space-900/90 dark:via-space-800/70 dark:to-space-950/60 p-4 shadow-inner">
											<GraphVisualization
												nodes={graphModal.data.nodes}
												edges={graphModal.data.edges}
												selectedNodeId={activeNodeId}
												onSelect={(nodeId) => setGraphSelection(nodeId)}
											/>
										</div>
										<ScrollArea className="max-h-[30vh]">
											{graphModal.data.context ? (
												<div className="rounded-3xl border border-black/5 dark:border-white/10 bg-gradient-to-br from-purple-500/5 to-transparent dark:from-purple-500/10 dark:to-space-900/40 p-6 shadow-sm backdrop-blur-md mb-4">
													<p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">Context</p>
													<p className="text-sm leading-relaxed text-slate-700 dark:text-space-200">{graphModal.data.context}</p>
												</div>
											) : null}
											{selectedNode ? (
												<div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-space-950/40 p-6 shadow-sm backdrop-blur-md">
													<p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-space-400">Selected entity</p>
													<h3 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white drop-shadow-sm">{selectedNode.label}</h3>
													{selectedNode.type ? (
														<p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-space-400">{selectedNode.type}</p>
													) : null}
													<div className="mt-4 flex flex-wrap gap-2.5">
														{relatedEdges.length ? (
															relatedEdges.map((edge, index) => {
																const otherNodeId = edge.source === selectedNode.id ? edge.target : edge.source
																const target = nodeMap.get(otherNodeId)
																return (
																	<span
																		key={`${edge.source}-${edge.target}-${index}`}
																		className="rounded-full border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-space-800/80 px-3.5 py-1.5 text-[0.7rem] font-bold text-slate-700 dark:text-space-200 shadow-sm"
																	>
																		<span className="text-purple-600 dark:text-purple-400 mr-1.5 opacity-80">{edge.relation ?? 'Related to'}</span>
																		{target?.label ?? otherNodeId}
																	</span>
																)
															})
														) : (
															<span className="text-sm text-slate-500 dark:text-space-400 italic">No immediate connections.</span>
														)}
													</div>
												</div>
											) : null}
										</ScrollArea>
									</div>
								</div>
							)
						})()}
					</div>
				</DialogContent>
			) : null}
		</Dialog>
	)

	if (metadata.map.size === 0) {
		return null
	}

	const content = typeof toolId === 'number' ? renderBlock(toolId) : (
		<div className="flex w-full flex-col gap-3">{metadata.order.map((id) => renderBlock(id))}</div>
	)

	return (
		<>
			{content}
			{documentModalDialog}
			{timelineModalDialog}
			{visualModalDialog}
			{graphModalDialog}
		</>
	)
}

const renderContextualSearch = (search: ContextualSearchData) => {
	return <ContextualSearchBlock search={search} />
}

const renderAnswerWithSources = (answer: AnswerWithSourcesData) => {
	return (
		<div className="mt-3 relative overflow-hidden rounded-2xl border border-biosphere-500/20 dark:border-biosphere-500/10 bg-gradient-to-br from-white/80 via-emerald-50/20 to-white/40 dark:from-space-800/80 dark:via-emerald-900/10 dark:to-space-900/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:shadow-md group hover:border-emerald-500/30 dark:hover:border-emerald-500/20">
			<div className="flex items-start gap-4 relative z-10">
				<span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 shadow-inner group-hover:ring-emerald-500/50 transition-all">
					<HiOutlineSparkles className="h-5 w-5 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform" />
				</span>
				<div className="flex-1 space-y-3">
					<div className="space-y-0.5">
						<p className="text-[15px] font-bold text-slate-800 dark:text-space-200 tracking-tight">Grounded answer</p>
						<p className="text-[0.7rem] font-semibold text-slate-400 dark:text-space-400/80 uppercase tracking-widest">Cites contextual search sources inline.</p>
					</div>
					<div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-space-950/40 px-5 py-4 text-[13px] text-slate-700 dark:text-space-200 backdrop-blur shadow-sm">
						<strong className="font-bold text-slate-900 dark:text-white mr-2">Question:</strong> {answer.query}
					</div>
					<div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-space-900/80 px-5 py-4 text-sm leading-relaxed text-slate-700 dark:text-space-200 shadow-sm backdrop-blur">
						<ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-invert max-w-none text-sm leading-relaxed text-slate-700 dark:text-space-200 [&>*]:mb-3 [&>*:last-child]:mb-0">
							{answer.answer}
						</ReactMarkdown>
					</div>
					{answer.sources.length ? (
						<div className="space-y-3">
							<p className="text-xs font-semibold uppercase tracking-wide text-scheme-muted-text/70">Sources</p>
							<div className="space-y-2">
								{answer.sources.map((source, index) => {
									const similarityLabel = formatSimilarityScore(source.similarityScore)
									return (
										<div
											key={`answer-source-${index}-${source.url ?? source.pmcid ?? 'local'}`}
											className="rounded-2xl border border-biosphere-500/20 bg-scheme-surface/95 p-4"
										>
											<div className="flex flex-wrap items-center gap-2">
												<span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-biosphere-500/25 text-xs font-semibold text-biosphere-200">
													{index + 1}
												</span>
												<p className="text-sm font-semibold text-scheme-text">
													{source.title ?? 'Untitled source'}
												</p>
												{similarityLabel ? (
													<Badge variant="outline" className="rounded-full border-biosphere-500/40 text-[0.65rem] text-biosphere-200">
														Sim {similarityLabel}
													</Badge>
												) : null}
											</div>
											<p className="mt-2 text-sm leading-relaxed text-scheme-text/85">{source.text}</p>
											<div className="mt-3 flex flex-wrap items-center gap-2">
												{source.url ? (
													<Button
														type="button"
														size="sm"
														variant="ghost"
														className="rounded-full text-xs text-biosphere-300 hover:bg-biosphere-500/10"
														onClick={() => openExternalLink(source.url)}
													>
														View source
													</Button>
												) : null}
												{source.pmcid ? (
													<Badge variant="secondary" className="rounded-full bg-scheme-muted/30 text-[0.65rem] text-scheme-muted-text">
														PMC{source.pmcid}
													</Badge>
												) : null}
												{source.chunkIndex !== null ? (
													<Badge variant="outline" className="rounded-full border-scheme-border-subtle/70 text-[0.65rem] text-scheme-muted-text">
														Chunk {source.chunkIndex}
													</Badge>
												) : null}
											</div>
										</div>
									)
								})}
							</div>
						</div>
					) : null}
				</div>
			</div>
		</div>
	)
}

export default ToolCallResults

function ContextualSearchBlock({ search }: { search: ContextualSearchData }) {
	const [expanded, setExpanded] = useState(false)
	const matchCount = search.results.length

	return (
		<div className="mt-3 rounded-2xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-space-900/40 shadow-sm backdrop-blur-md transition-all overflow-hidden">
			<button
				type="button"
				onClick={() => setExpanded(!expanded)}
				className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/60 dark:hover:bg-space-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biosphere-500/50 group"
			>
				<div className="flex items-center gap-3">
					<span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-biosphere-500/20 to-biosphere-600/5 text-biosphere-600 dark:text-biosphere-400 ring-1 ring-biosphere-500/30 group-hover:ring-biosphere-500/50 shadow-inner">
						<HiOutlineGlobeAlt className="h-4 w-4 drop-shadow-[0_0_8px_rgba(0,231,179,0.3)] transition-transform group-hover:scale-110" />
					</span>
					<div>
						<p className="text-sm font-semibold text-slate-800 dark:text-space-200">
							Contextual search: <span className="font-normal italic text-slate-500 dark:text-space-400">"{search.query}"</span>
						</p>
						<p className="text-[0.7rem] font-medium text-slate-400 dark:text-space-400/80 uppercase tracking-widest mt-0.5">
							{matchCount} Match{matchCount === 1 ? '' : 'es'} Retrieved
						</p>
					</div>
				</div>
				<span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-space-800/80 text-slate-400 transition-colors group-hover:bg-slate-200 dark:group-hover:bg-space-700/80 group-hover:text-slate-600 dark:group-hover:text-space-300">
					<HiMiniChevronDown className={`h-4 w-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
				</span>
			</button>

			<div
				className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
					}`}
			>
				<div className="overflow-hidden">
					<div className="border-t border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-space-950/50 p-4 space-y-4">
						{search.results.length ? (
							<div className="space-y-3">
								{search.results.map((result, index) => {
									const similarityLabel = formatSimilarityScore(result.similarityScore)
									return (
										<div
											key={`contextual-result-${index}-${result.url ?? result.pmcid ?? 'local'}`}
											className="rounded-2xl border border-black/5 dark:border-white/5 bg-white/80 dark:bg-space-900/80 p-5 shadow-sm backdrop-blur-md"
										>
											<div className="flex flex-wrap items-center gap-2 mb-3">
												<span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-biosphere-500/15 text-xs font-bold text-biosphere-600 dark:text-biosphere-400">
													{index + 1}
												</span>
												<p className="text-sm font-bold text-slate-800 dark:text-space-200">
													{result.title ?? 'Untitled excerpt'}
												</p>
												{similarityLabel ? (
													<Badge variant="outline" className="rounded-full border-biosphere-500/30 bg-biosphere-500/5 text-[0.65rem] text-biosphere-600 dark:text-biosphere-400 font-semibold tracking-wider">
														SIM {similarityLabel}
													</Badge>
												) : null}
											</div>
											<p className="text-[13px] leading-relaxed text-slate-600 dark:text-space-300/90">{result.text}</p>
											<div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-black/5 dark:border-white/5">
												{result.url ? (
													<Button
														type="button"
														size="sm"
														variant="ghost"
														className="h-8 rounded-full text-xs font-semibold text-biosphere-600 dark:text-biosphere-400 hover:bg-biosphere-500/10 hover:text-biosphere-700 dark:hover:text-biosphere-300"
														onClick={() => openExternalLink(result.url)}
													>
														Open Source
													</Button>
												) : null}
												{result.pmcid ? (
													<Badge variant="secondary" className="rounded-full bg-slate-100 dark:bg-space-800 text-[0.65rem] font-medium text-slate-500 dark:text-space-400">
														PMC{result.pmcid}
													</Badge>
												) : null}
												{result.chunkIndex !== null ? (
													<Badge variant="outline" className="rounded-full border-black/10 dark:border-white/10 text-[0.65rem] font-medium text-slate-500 dark:text-space-400">
														Chunk {result.chunkIndex}
													</Badge>
												) : null}
											</div>
										</div>
									)
								})}
							</div>
						) : (
							<p className="text-sm text-slate-500 dark:text-space-400/90 text-center py-4">No matches were returned.</p>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
