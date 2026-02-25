import {
	HiOutlineChartBarSquare,
	HiOutlineGlobeAlt,
	HiOutlineQueueList,
	HiOutlineSparkles,
} from 'react-icons/hi2'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast/useToast'
import supabase from '@/lib/supabase-client'
import type { ChatMessage } from '@/contexts/chat-context-types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'


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





const ARTIFACT_ICONS: Record<string, typeof HiOutlineSparkles> = {
	visual_json: HiOutlineChartBarSquare,
	knowledge_graph: HiOutlineGlobeAlt,
	timeline: HiOutlineQueueList,
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

type GraphVisualizationProps = {
	nodes: KnowledgeGraphNode[]
	edges: KnowledgeGraphEdge[]
	selectedNodeId: string | null
	onSelect?: (nodeId: string) => void
}

export const GraphVisualization = ({ nodes, edges, selectedNodeId, onSelect }: GraphVisualizationProps) => {
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
