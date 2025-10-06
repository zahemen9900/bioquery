import { useEffect, useId, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { HiMiniBars3CenterLeft } from 'react-icons/hi2'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import supabase from '@/lib/supabase-client'
import { useAuth } from '@/contexts/auth-context-types'
import { useAppShell } from '@/contexts/app-shell-context'
import { cn } from '@/lib/utils'
import { useUserPreferences } from '@/hooks/use-user-preferences'

import CollectionCard, { type CollectionArtifact, type CollectionKind } from './components/CollectionCard'

type TabValue = 'all' | CollectionKind

type ChatArtifactRow = {
	id: string
	chat_id: string | null
	artifact_type: string | null
	title: string | null
	summary: string | null
	tags: string[] | null
	content: unknown
	created_at: string | null
	chats?: { chat_name: string | null } | Array<{ chat_name: string | null }>
}

type DocumentRow = {
	id: string
	title: string | null
	body: string | null
	tags: string[] | null
	created_at: string | null
	updated_at: string | null
	image_link: string | null
	chat_id: string | null
}

type TabOption = {
	value: TabValue
	label: string
	description: string
}

const TABS: TabOption[] = [
	{ value: 'all', label: 'All', description: 'Everything you have saved so far.' },
	{ value: 'document', label: 'Documents', description: 'Generated references and summaries.' },
	{ value: 'visualization', label: 'Visuals', description: 'Charts, timelines, and knowledge graphs.' },
	{ value: 'summary', label: 'Notes', description: 'Concise findings and narratives.' },
	{ value: 'dataset', label: 'Datasets', description: 'Structured outputs ready for analysis.' },
]

type ArtifactDetail = {
	id: string
	artifactType: string
	title: string | null
	summary: string | null
	tags: string[]
	data: Record<string, unknown> | null
}

type DocumentDetail = {
	id: string
	title: string | null
	documentType: string | null
	tags: string[]
	preview: string | null
	body: string | null
	imageLink: string | null
	imagePrompt: string | null
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

type TimelineModalState = {
	artifact: ArtifactDetail
	data: TimelineData
}

type VisualModalState = {
	artifact: ArtifactDetail
	data: VisualChartData
}

type GraphModalState = {
	artifact: ArtifactDetail
	data: KnowledgeGraphData
}

const CHART_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#f87171'] as const

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

const coerceNumber = (value: unknown): number | null => {
	if (typeof value === 'number' && Number.isFinite(value)) return value
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : null
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

const toTimelineData = (artifact: ArtifactDetail): TimelineData | null => {
	const source = ensureRecord(artifact.data)
	if (!source) return null
	const sections = parseTimelineSectionsData(source.timeline_sections ?? source.sections)
	if (!sections.length) return null
	const title = ensureString(source.title) ?? artifact.title ?? 'Timeline overview'
	const tags = toStringArray(source.tags ?? artifact.tags)
	return { title, sections, tags }
}

const toVisualChartData = (artifact: ArtifactDetail): VisualChartData | null => {
	const source = ensureRecord(artifact.data)
	if (!source) return null
	const dataPoints = parseChartDataPoints(source.data_points ?? source.points ?? source.values)
	if (!dataPoints.length) return null
	const chartType = (ensureString(source.chart_type) ?? ensureString(source.chartType) ?? artifact.artifactType).toLowerCase()
	const title = ensureString(source.title) ?? artifact.title ?? 'Generated visualization'
	const tags = toStringArray(source.tags ?? artifact.tags)
	return { title, chartType, dataPoints, tags }
}

const toKnowledgeGraphData = (artifact: ArtifactDetail): KnowledgeGraphData | null => {
	const source = ensureRecord(artifact.data)
	if (!source) return null
	const nodes = parseGraphNodesData(source.nodes)
	const edges = parseGraphEdgesData(source.edges)
	if (!nodes.length || !edges.length) return null
	const context = ensureString(source.context) ?? artifact.summary ?? null
	const tags = toStringArray(source.tags ?? artifact.tags)
	return { nodes, edges, context, tags }
}

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

const toStringArray = (value: unknown): string[] => {
	if (!Array.isArray(value)) return []
	const results: string[] = []
	for (const entry of value) {
		if (typeof entry !== 'string') continue
		const trimmed = entry.trim()
		if (trimmed) results.push(trimmed)
	}
	return results
}

const mapArtifactKind = (value: string | null): CollectionKind => {
	if (!value) return 'summary'
	const normalized = value.toLowerCase()
	if (normalized === 'document') return 'document'
	if (normalized === 'dataset') return 'dataset'
	if (
		normalized === 'visualization' ||
		normalized === 'visual_json' ||
		normalized === 'knowledge_graph' ||
		normalized === 'timeline'
	)
		return 'visualization'
	return 'summary'
}

const snippetFromContent = (content: unknown): string | null => {
	if (typeof content === 'string') {
		const trimmed = content.trim()
		return trimmed.length ? trimmed : null
	}
	if (content && typeof content === 'object') {
		try {
			const json = JSON.stringify(content)
			return json.slice(0, 320)
		} catch {
			return null
		}
	}
	return null
}

const resolveDate = (value: string | null | undefined): string => value ?? new Date().toISOString()

const COLLECTIONS_TOUR_SLIDES: Array<{
	id: string
	title: string
	description: string
	highlight: string
	accent: string
}> = [
	{
		id: 'documents',
		title: 'Keep every generated document within reach',
		description:
			'Your AI-crafted briefs, reports, and summaries automatically land here so you can pick up right where you left off.',
		highlight: 'Use tags to group mission threads or experiment phases.',
		accent: 'from-biosphere-500/80 via-cosmic-500/60 to-space-900/80',
	},
	{
		id: 'visuals',
		title: 'Organize visuals, timelines, and knowledge graphs',
		description:
			'Charts, knowledge graphs, and timelines generated in Discover show up instantly—perfect for sharing with your team.',
		highlight: 'Filter by type to focus on visuals, datasets, or notes.',
		accent: 'from-cosmic-500/80 via-biosphere-500/60 to-space-900/80',
	},
]

export default function CollectionsPage() {
	const { user } = useAuth()
	const { openMobileSidebar } = useAppShell()
	const navigate = useNavigate()
	const { prefs, loading: prefsLoading, updatePrefs } = useUserPreferences()
	const mobileMenuButtonClasses =
		'inline-flex h-9 w-9 items-center justify-center rounded-lg bg-scheme-surface/80 text-scheme-text shadow-sm ring-1 ring-inset ring-scheme-border/60 transition hover:text-biosphere-500 hover:ring-biosphere-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biosphere-500/60 md:hidden'

		const [activeTab, setActiveTab] = useState<TabValue>('all')
		const [collections, setCollections] = useState<CollectionArtifact[]>([])
		const [searchTerm, setSearchTerm] = useState('')
		const [loading, setLoading] = useState(false)
		const [error, setError] = useState<string | null>(null)
		const [collectionsTourOpen, setCollectionsTourOpen] = useState(false)
		const [collectionsTourStep, setCollectionsTourStep] = useState(0)
		const [collectionsTourSaving, setCollectionsTourSaving] = useState(false)
			const [artifactCache, setArtifactCache] = useState<Record<string, ArtifactDetail>>({})
			const [documentCache, setDocumentCache] = useState<Record<string, DocumentDetail>>({})
			const [loadingArtifacts, setLoadingArtifacts] = useState<Record<string, boolean>>({})
			const [loadingDocuments, setLoadingDocuments] = useState<Record<string, boolean>>({})
			const [artifactModal, setArtifactModal] = useState<ArtifactDetail | null>(null)
			const [documentModal, setDocumentModal] = useState<DocumentDetail | null>(null)
			const [timelineModal, setTimelineModal] = useState<TimelineModalState | null>(null)
			const [visualModal, setVisualModal] = useState<VisualModalState | null>(null)
			const [graphModal, setGraphModal] = useState<GraphModalState | null>(null)
			const [timelineIndex, setTimelineIndex] = useState(0)
			const [graphSelection, setGraphSelection] = useState<string | null>(null)

		useEffect(() => {
			if (prefsLoading) return
			if (!prefs || prefs.has_seen_collections === true) {
				setCollectionsTourOpen(false)
				return
			}

			setCollectionsTourStep(0)
			setCollectionsTourOpen(true)
		}, [prefs, prefsLoading])

	useEffect(() => {
		if (!user) {
			setCollections([])
			return
		}

		let cancelled = false

		const fetchCollections = async () => {
			setLoading(true)
			setError(null)

			try {
				const [artifactResult, documentResult] = await Promise.all([
					supabase
						.from('chat_artifacts')
						.select(
							'id, chat_id, artifact_type, title, summary, tags, content, created_at, chats!inner (chat_name, user_id)',
						)
						.eq('chats.user_id', user.id)
						.order('created_at', { ascending: false }),
					supabase
						.from('documents')
						.select('id, title, body, tags, created_at, updated_at, image_link, chat_id')
						.eq('user_id', user.id)
						.order('created_at', { ascending: false }),
				])

				if (cancelled) return

				if (artifactResult.error || documentResult.error) {
					console.error('Failed to load collections', artifactResult.error ?? documentResult.error)
					setError('We could not load your collections. Please try again shortly.')
					setCollections([])
					setLoading(false)
					return
				}

				const artifactRows = (artifactResult.data ?? []) as ChatArtifactRow[]
				const documentRows = (documentResult.data ?? []) as DocumentRow[]

					const artifactItems: CollectionArtifact[] = artifactRows.map((entry) => {
					const chatRelation = Array.isArray(entry.chats) ? entry.chats[0] : entry.chats
					const tags = toStringArray(entry.tags)
					const snippet = entry.summary ?? snippetFromContent(entry.content)
					return {
						id: String(entry.id),
						kind: mapArtifactKind(entry.artifact_type ?? ''),
							artifactType: entry.artifact_type,
						title: entry.title,
						snippet: snippet ? snippet.slice(0, 320) : null,
						tags,
						createdAt: resolveDate(entry.created_at),
						chatName: chatRelation?.chat_name ?? null,
						previewImageUrl: null,
						source: 'artifact',
					}
				})

				const documentItems: CollectionArtifact[] = documentRows.map((entry) => {
					const tags = toStringArray(entry.tags)
					return {
						id: entry.id,
						kind: 'document',
								artifactType: 'document',
						title: entry.title,
						snippet: entry.body ? entry.body.slice(0, 320) : null,
						tags,
						createdAt: resolveDate(entry.created_at ?? entry.updated_at),
						chatName: null,
						previewImageUrl: entry.image_link,
						source: 'document',
					}
				})

				const combined = [...artifactItems, ...documentItems].sort((a, b) => {
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				})

				setCollections(combined)
				setLoading(false)
			} catch (fetchError) {
				if (cancelled) return
				console.error('Unexpected collections error', fetchError)
				setError('We could not load your collections. Please try again shortly.')
				setCollections([])
				setLoading(false)
			}
		}

		void fetchCollections()

		return () => {
			cancelled = true
		}
	}, [user])

		const filteredCollections = useMemo(() => {
		const base = activeTab === 'all' ? collections : collections.filter((item) => item.kind === activeTab)
		const query = searchTerm.trim().toLowerCase()
		if (!query) return base
		return base.filter((item) => {
			const inTitle = item.title?.toLowerCase().includes(query)
			const inSnippet = item.snippet?.toLowerCase().includes(query)
			const inTags = item.tags.some((tag) => tag.toLowerCase().includes(query))
			return Boolean(inTitle || inSnippet || inTags)
		})
	}, [activeTab, collections, searchTerm])

			const currentTab = TABS.find((tab) => tab.value === activeTab) ?? TABS[0]

		const getArtifactDetail = async (artifactId: string): Promise<ArtifactDetail | null> => {
			if (!artifactId) return null
			if (artifactCache[artifactId]) return artifactCache[artifactId]

			setLoadingArtifacts((prev) => ({ ...prev, [artifactId]: true }))
			try {
				const { data, error } = await supabase
					.from('chat_artifacts')
					.select('id, artifact_type, title, summary, tags, content')
					.eq('id', artifactId)
					.maybeSingle()

				if (error) throw error
				if (!data) return null

				const record = data as Record<string, unknown>
				const contentRecord = ensureRecord((record as { content?: unknown }).content)

				const detail: ArtifactDetail = {
					id: ensureString(record.id) ?? artifactId,
					artifactType: ensureString(record.artifact_type) ?? 'artifact',
					title: ensureString(record.title),
					summary: ensureString(record.summary),
					tags: toStringArray(record.tags),
					data: contentRecord,
				}

				setArtifactCache((prev) => ({ ...prev, [artifactId]: detail }))
				return detail
			} catch (error) {
				console.error('Failed to load artifact detail', error)
				return null
			} finally {
				setLoadingArtifacts((prev) => {
					const next = { ...prev }
					delete next[artifactId]
					return next
				})
			}
		}

		const getDocumentDetail = async (documentId: string): Promise<DocumentDetail | null> => {
			if (!documentId) return null
			if (documentCache[documentId]) return documentCache[documentId]

			setLoadingDocuments((prev) => ({ ...prev, [documentId]: true }))
			try {
				const { data, error } = await supabase
					.from('documents')
					.select('id, title, body, tags, document_type, image_link, image_prompt')
					.eq('id', documentId)
					.maybeSingle()

				if (error) throw error
				if (!data) return null

				const record = data as Record<string, unknown>
				const detail: DocumentDetail = {
					id: ensureString(record.id) ?? documentId,
					title: ensureString(record.title),
					documentType: ensureString(record.document_type),
					tags: toStringArray(record.tags),
					preview: ensureString(record.body)?.slice(0, 200) ?? null,
					body: ensureString(record.body),
					imageLink: ensureString(record.image_link),
					imagePrompt: ensureString(record.image_prompt),
				}

				setDocumentCache((prev) => ({ ...prev, [documentId]: detail }))
				return detail
			} catch (error) {
				console.error('Failed to load document detail', error)
				return null
			} finally {
				setLoadingDocuments((prev) => {
					const next = { ...prev }
					delete next[documentId]
					return next
				})
			}
		}

		  const handleOpenCollection = async (entry: CollectionArtifact) => {
		    if (entry.source === 'document') {
		      if (loadingDocuments[entry.id]) return
		      const detail = await getDocumentDetail(entry.id)
		      if (detail) {
		        setDocumentModal(detail)
		      }
		      return
		    }

		    if (loadingArtifacts[entry.id]) return

		    const detail = await getArtifactDetail(entry.id)
		    if (!detail) return

		    const artifactType = detail.artifactType.toLowerCase()

		    if (artifactType.includes('timeline')) {
		      const timelineData = toTimelineData(detail)
		      if (timelineData) {
		        setTimelineModal({ artifact: detail, data: timelineData })
		        setTimelineIndex(0)
		        return
		      }
		    }

		    if (artifactType.includes('visual') || artifactType.includes('chart')) {
		      const visualData = toVisualChartData(detail)
		      if (visualData) {
		        setVisualModal({ artifact: detail, data: visualData })
		        return
		      }
		    }

		    if (artifactType.includes('knowledge_graph') || artifactType.includes('graph')) {
		      const graphData = toKnowledgeGraphData(detail)
		      if (graphData) {
		        setGraphModal({ artifact: detail, data: graphData })
		        setGraphSelection(graphData.nodes[0]?.id ?? null)
		        return
		      }
		    }

		    setArtifactModal(detail)
		  }

	const artifactModalDialog = (
		<Dialog
			open={Boolean(artifactModal)}
			onOpenChange={(open) => {
				if (!open) setArtifactModal(null)
			}}
		>
			{artifactModal ? (
				<DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden">
					<DialogHeader>
						<DialogTitle className="text-2xl font-bold leading-tight">
							{artifactModal.title ?? 'Generated artifact'}
						</DialogTitle>
						<DialogDescription className="flex flex-wrap items-center gap-2 text-sm">
							<span className="rounded-full bg-biosphere-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-biosphere-200">
								{artifactModal.artifactType.replace(/_/g, ' ')}
							</span>
							{artifactModal.tags.map((tag) => (
								<Badge key={tag} variant="outline" className="rounded-full border-biosphere-500/40 text-[0.65rem] text-biosphere-200">
									{tag}
								</Badge>
							))}
						</DialogDescription>
					</DialogHeader>
					<ScrollArea className="mt-6 max-h-[65vh] pr-4">
						<div className="space-y-6">
							{artifactModal.summary ? (
								<div className="rounded-2xl border border-scheme-border-subtle/50 bg-scheme-surface/90 p-6 text-sm leading-relaxed text-scheme-text/95">
									<ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-invert max-w-none text-sm leading-relaxed">
										{artifactModal.summary}
									</ReactMarkdown>
								</div>
							) : null}

							{artifactModal.data ? (
								<div className="rounded-2xl border border-scheme-border-subtle/50 bg-space-950/60 p-5">
									<p className="mb-3 text-xs font-semibold uppercase tracking-wide text-scheme-muted-text">Source data</p>
									<pre className="max-h-[320px] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-scheme-muted-text/80">
										{JSON.stringify(artifactModal.data, null, 2)}
									</pre>
								</div>
							) : null}
						</div>
					</ScrollArea>
				</DialogContent>
			) : null}
		</Dialog>
	)

	const documentModalDialog = (
		<Dialog
			open={Boolean(documentModal)}
			onOpenChange={(open) => {
				if (!open) setDocumentModal(null)
			}}
		>
			{documentModal ? (() => {
				const hasImage = Boolean(documentModal.imageLink)
				const bodyContent = (
					<div className="rounded-2xl border border-scheme-border-subtle/40 bg-gradient-to-br from-scheme-surface/60 to-scheme-surface/40 p-8 shadow-inner">
						{documentModal.body ? (
							<ReactMarkdown
								remarkPlugins={[remarkGfm]}
								className="prose prose-invert max-w-none text-base leading-relaxed text-scheme-text/95"
							>
								{documentModal.body}
							</ReactMarkdown>
						) : (
							<p className="text-center text-sm text-scheme-muted-text">This document does not contain body content.</p>
						)}
					</div>
				)
				const promptContent = documentModal.imagePrompt
					? (
						<div className="rounded-2xl border border-biosphere-500/25 bg-biosphere-500/5 p-5 text-sm text-biosphere-100/90">
							<p className="text-xs font-semibold uppercase tracking-wide text-biosphere-200/80">About Image</p>
							<p className="mt-2 leading-relaxed">{documentModal.imagePrompt}</p>
						</div>
					)
					: null
				return (
					<DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden">
						<DialogHeader>
							<DialogTitle className="text-2xl font-bold leading-tight">
								{documentModal.title ?? 'Generated document'}
							</DialogTitle>
							<DialogDescription className="flex flex-wrap items-center gap-2 text-sm">
								<span className="rounded-full bg-biosphere-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-biosphere-200">
									{documentModal.documentType ?? 'Document'}
								</span>
								{documentModal.tags.map((tag) => (
									<Badge key={tag} variant="outline" className="rounded-full border-biosphere-500/40 text-[0.65rem] text-biosphere-200">
										{tag}
									</Badge>
								))}
							</DialogDescription>
						</DialogHeader>
						{hasImage ? (
							<div className="mt-6 flex flex-col gap-6 lg:h-[calc(90vh-220px)] lg:grid lg:grid-cols-[minmax(320px,360px)_1fr] lg:gap-8">
								<div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-3xl border border-biosphere-500/25 bg-space-950/60 p-4 lg:h-full">
									<img
										src={documentModal.imageLink ?? ''}
										alt={documentModal.title ?? 'Document illustration'}
										className="h-full w-full max-h-full object-contain"
									/>
								</div>
								<ScrollArea className="flex-1 min-h-[280px] pr-4 lg:h-full">
									<div className="space-y-6 pr-2 lg:pr-4">
										{bodyContent}
										{promptContent}
									</div>
								</ScrollArea>
							</div>
						) : (
							<ScrollArea className="mt-6 h-[calc(90vh-200px)] max-h-[calc(90vh-200px)] pr-4">
								<div className="space-y-6">
									{bodyContent}
									{promptContent}
								</div>
							</ScrollArea>
						)}
					</DialogContent>
				)
			})() : null}
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
				<DialogContent className="max-h-[92vh] max-w-6xl overflow-hidden">
					<DialogHeader>
						<DialogTitle className="text-2xl font-bold">
							{timelineModal.data.title}
						</DialogTitle>
						<DialogDescription className="flex flex-wrap items-center gap-2 text-sm">
							<span className="rounded-full bg-biosphere-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-biosphere-200">
								{timelineModal.data.sections.length} section{timelineModal.data.sections.length === 1 ? '' : 's'}
							</span>
							{timelineModal.data.tags.map((tag) => (
								<Badge key={tag} variant="outline" className="rounded-full border-biosphere-500/40 text-[0.65rem] text-biosphere-200">
									{tag}
								</Badge>
							))}
						</DialogDescription>
					</DialogHeader>
					<div className="mt-6 flex flex-col gap-4">
						<ScrollArea className="max-h-16">
							<div className="flex items-center gap-2 pb-2">
								{timelineModal.data.sections.map((_, index) => {
									const isActive = index === timelineIndex
									return (
										<button
											key={`timeline-step-${index}`}
											type="button"
											onClick={() => setTimelineIndex(index)}
											className={cn(
												'flex-shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all',
												isActive
													? 'border-biosphere-500 bg-biosphere-500/25 text-biosphere-100 shadow-lg shadow-biosphere-500/20'
													: 'border-scheme-border-subtle text-scheme-muted-text hover:border-biosphere-500/60 hover:bg-biosphere-500/10 hover:text-biosphere-100',
											)}
										>
											{index + 1}
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
								<div className="flex flex-col gap-6 overflow-hidden rounded-2xl border border-biosphere-500/20 bg-gradient-to-br from-scheme-surface/95 to-scheme-surface/80 p-6 shadow-xl lg:h-[calc(92vh-260px)] lg:grid lg:grid-cols-[minmax(320px,360px)_1fr] lg:p-8">
									<div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-biosphere-500/25 bg-space-950/60 p-4 lg:h-full">
										{activeSection.imageLink ? (
											<img src={activeSection.imageLink} alt={activeSection.title} className="h-full w-full max-h-full object-contain" />
										) : (
											<div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-biosphere-500/30 bg-space-900/40 text-sm text-scheme-muted-text">
												No image provided for this step.
											</div>
										)}
									</div>
									<div className="flex h-full min-h-0 flex-col gap-4">
										<div className="flex flex-wrap items-center gap-3">
											<span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-biosphere-500/25 text-base font-bold text-biosphere-200 shadow-lg shadow-biosphere-500/20">
												{safeIndex + 1}
											</span>
											<h3 className="text-xl font-bold text-scheme-text">{activeSection.title}</h3>
										</div>
										<ScrollArea className="flex-1 min-h-0">
											<div className="space-y-4 rounded-2xl border border-biosphere-500/15 bg-scheme-surface/70 p-5 pr-6 text-base leading-relaxed text-scheme-text/95">
												<p>{activeSection.description}</p>
												{activeSection.imagePrompt ? (
													<div className="rounded-xl border border-biosphere-500/25 bg-biosphere-500/5 p-4 text-sm text-biosphere-100/90">
														<p className="text-xs font-semibold uppercase tracking-wide text-biosphere-200/80">About Image</p>
														<p className="mt-2 leading-relaxed italic">{activeSection.imagePrompt}</p>
													</div>
												) : null}
											</div>
										</ScrollArea>
									</div>
								</div>
							)
						})()}
						<div className="flex items-center justify-between">
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => setTimelineIndex((prev) => Math.max(prev - 1, 0))}
								disabled={timelineIndex === 0}
							>
								Previous section
							</Button>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() =>
									setTimelineIndex((prev) => Math.min(prev + 1, Math.max(timelineModal.data.sections.length - 1, 0)))
								}
								disabled={timelineIndex >= timelineModal.data.sections.length - 1}
							>
								Next section
							</Button>
						</div>
					</div>
				</DialogContent>
			) : null}
		</Dialog>
	)

	const visualModalDialog = (
		<Dialog
			open={Boolean(visualModal)}
			onOpenChange={(open) => {
				if (!open) setVisualModal(null)
			}}
		>
			{visualModal ? (
				<DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
					<DialogHeader>
						<DialogTitle className="text-xl font-bold">{visualModal.data.title}</DialogTitle>
						<DialogDescription className="text-sm">
							{visualModal.data.chartType} • {visualModal.data.dataPoints.length} data point
							{visualModal.data.dataPoints.length === 1 ? '' : 's'}
							{visualModal.data.tags.length ? (
								<span className="ml-3">
									{visualModal.data.tags.map((tag) => (
										<Badge key={tag} variant="outline" className="ml-1 rounded-full border-biosphere-500/40 text-[0.65rem] text-biosphere-200">
											{tag}
										</Badge>
									))}
								</span>
							) : null}
						</DialogDescription>
					</DialogHeader>
					<ScrollArea className="mt-6 max-h-[75vh] pr-4">
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
										: { background: 'linear-gradient(135deg, rgba(96,165,250,0.45), rgba(14,165,233,0.25))' }
									return (
										<div className="flex flex-col items-center gap-4">
											<div className="h-56 w-56 rounded-full border border-scheme-border-subtle/40" style={pieStyle} />
											<ul className="w-full space-y-2 text-xs text-scheme-muted-text/85">
												{dataPoints.map((point, index) => (
													<li
														key={point.label}
														className="flex items-center justify-between gap-3 rounded-lg border border-scheme-border-subtle/60 bg-scheme-surface/80 px-3 py-2"
													>
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
									<div className="space-y-3">
										{dataPoints.map((point, index) => {
											const proportion = max > 0 ? Math.abs(point.value) / max : 0
											const width = Math.max(proportion * 100, 4)
											const color = CHART_COLORS[index % CHART_COLORS.length]
											return (
												<div key={point.label}>
													<div className="flex items-center justify-between text-xs text-scheme-muted-text/80">
														<span>{point.label}</span>
														<span>{point.value}</span>
													</div>
													<div className="mt-1 h-2 w-full rounded-full bg-space-900/60">
														<div className="h-2 rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
													</div>
												</div>
											)
										})}
									</div>
								)
							})()}
						</div>
					</ScrollArea>
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
				<DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden">
					<DialogHeader>
						<DialogTitle className="text-xl font-bold">
							{graphModal.artifact.title ?? 'Knowledge graph'}
						</DialogTitle>
						<DialogDescription className="text-sm">
							{graphModal.data.nodes.length} nodes • {graphModal.data.edges.length} connections
							{graphModal.data.tags.length ? (
								<span className="ml-3">
									{graphModal.data.tags.map((tag) => (
										<Badge key={tag} variant="outline" className="ml-1 rounded-full border-biosphere-500/40 text-[0.65rem] text-biosphere-200">
											{tag}
										</Badge>
									))}
								</span>
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
							<div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
								<div className="space-y-4">
									<div className="flex items-center gap-2">
										<div className="h-2 w-2 rounded-full bg-biosphere-500" />
										<p className="text-sm font-semibold text-scheme-text">Entities</p>
									</div>
									<ScrollArea className="max-h-[65vh] rounded-2xl border border-biosphere-500/20 bg-scheme-surface/50">
										<div className="flex flex-col">
											{graphModal.data.nodes.map((node) => {
												const isActive = node.id === activeNodeId
												return (
													<button
														key={node.id}
														type="button"
														onClick={() => setGraphSelection(node.id)}
														className={cn(
															'flex flex-col items-start gap-1.5 border-b border-scheme-border-subtle/30 px-4 py-3 text-left transition-all',
															isActive
																? 'bg-biosphere-500/20 text-biosphere-100 shadow-inner'
																: 'text-scheme-text hover:bg-biosphere-500/10',
														)}
													>
														<span className="text-sm font-semibold">{node.label}</span>
														{node.type ? (
															<span className="rounded-full bg-scheme-muted/20 px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-scheme-muted-text">
																{node.type}
															</span>
														) : null}
													</button>
												)
											})}
											{graphModal.data.nodes.length === 0 ? (
												<p className="px-4 py-6 text-xs text-scheme-muted-text">No entities found.</p>
											) : null}
										</div>
									</ScrollArea>
								</div>
								<div className="space-y-6">
									<div className="relative h-[60vh] min-h-[420px] overflow-hidden rounded-3xl border border-biosphere-500/25 bg-gradient-to-br from-scheme-surface/90 via-scheme-surface/70 to-scheme-surface/60 p-4 shadow-2xl">
										<GraphVisualization
											nodes={graphModal.data.nodes}
											edges={graphModal.data.edges}
											selectedNodeId={activeNodeId}
											onSelect={(nodeId) => setGraphSelection(nodeId)}
										/>
									</div>
									{graphModal.data.context ? (
										<div className="rounded-2xl border border-biosphere-500/20 bg-gradient-to-br from-biosphere-500/10 to-scheme-surface/70 p-5 shadow-lg">
											<p className="mb-2 text-sm font-semibold text-biosphere-200">Context</p>
											<p className="text-sm leading-relaxed text-scheme-text/90">{graphModal.data.context}</p>
										</div>
									) : null}
									{selectedNode ? (
										<div className="rounded-2xl border border-biosphere-500/20 bg-scheme-surface/75 p-6 shadow-xl">
											<p className="text-xs font-semibold uppercase tracking-wide text-biosphere-200/80">Selected entity</p>
											<h3 className="mt-2 text-lg font-bold text-scheme-text">{selectedNode.label}</h3>
											{selectedNode.type ? (
												<p className="text-xs uppercase tracking-wide text-scheme-muted-text/90">{selectedNode.type}</p>
											) : null}
											<div className="mt-3 flex flex-wrap gap-2">
												{relatedEdges.length ? (
													relatedEdges.map((edge, index) => {
														const otherNodeId = edge.source === selectedNode.id ? edge.target : edge.source
														const target = nodeMap.get(otherNodeId)
														return (
															<span
																key={`${edge.source}-${edge.target}-${index}`}
																className="rounded-full border border-biosphere-500/30 bg-biosphere-500/10 px-3 py-1 text-xs text-biosphere-200"
															>
																{edge.relation ?? 'Related to'} • {target?.label ?? otherNodeId}
															</span>
														)
													})
												) : (
													<span className="text-xs text-scheme-muted-text">No immediate connections.</span>
												)}
											</div>
										</div>
									) : null}
								</div>
							</div>
						)
					})()}
				</DialogContent>
			) : null}
		</Dialog>
	)

	  const handleAdvanceCollectionsTour = async () => {
	    if (collectionsTourStep < COLLECTIONS_TOUR_SLIDES.length - 1) {
	      setCollectionsTourStep((prev) => Math.min(prev + 1, COLLECTIONS_TOUR_SLIDES.length - 1))
	      return
	    }

	    setCollectionsTourSaving(true)
	    await updatePrefs({ has_seen_collections: true })
	    setCollectionsTourSaving(false)
	    setCollectionsTourOpen(false)
	  }

	  const handleBackCollectionsTour = () => {
	    setCollectionsTourStep((prev) => Math.max(prev - 1, 0))
	  }

	return (
		<div className="relative flex h-full flex-1 flex-col overflow-hidden bg-scheme-background">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-biosphere-500/10 via-scheme-background to-transparent" aria-hidden />

			<section className="relative border-b border-scheme-border/60 px-6 pb-8 pt-14 md:pt-8">
				<button
					type="button"
					onClick={openMobileSidebar}
					className={`${mobileMenuButtonClasses} absolute left-4 top-4`}
					aria-label="Open navigation"
				>
					<HiMiniBars3CenterLeft className="h-5 w-5" />
				</button>
				<div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-biosphere-400">Collections</span>
							<h1 className="mt-3 text-3xl font-semibold text-scheme-text md:text-4xl">Your BioQuery library</h1>
							<p className="mt-2 max-w-2xl text-sm text-scheme-muted-text md:text-base">
								Track every document and visual your chats produce and return whenever you need a refresher.
							</p>
						</div>
						<Input
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
							placeholder="Search by title, notes, or tags"
							className="h-10 w-full max-w-sm rounded-full bg-scheme-surface/80 text-sm text-scheme-text"
						/>
					</div>

					<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
						<TabsList className="bg-scheme-surface/80 shadow-xl shadow-space-900/15">
							{TABS.map((tab) => (
								<TabsTrigger
									key={tab.value}
									value={tab.value}
									className={cn('rounded-full px-5 py-2 text-sm font-semibold transition', activeTab === tab.value ? 'bg-biosphere-500 text-space-900 shadow-md' : 'text-scheme-muted-text hover:text-scheme-text')}
								>
									{tab.label}
								</TabsTrigger>
							))}
						</TabsList>

						<TabsContent value={activeTab} className="mt-6 text-sm text-scheme-muted-text">
							{currentTab.description}
						</TabsContent>
					</Tabs>
				</div>
			</section>

			<div className="relative flex-1 overflow-y-auto px-6 py-10">
				<div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
					{error ? (
						<div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-6 py-5 text-sm text-rose-100">{error}</div>
					) : null}

					{loading ? (
						<div className="flex flex-col items-center gap-4 py-20 text-scheme-muted-text">
							<div className="h-12 w-12 animate-spin rounded-full border-4 border-biosphere-500/70 border-t-transparent" />
							<p className="text-sm">Loading your saved work…</p>
						</div>
					) : null}

					{!loading && filteredCollections.length === 0 ? (
						<div className="rounded-3xl border border-dashed border-scheme-border/60 bg-scheme-surface/80 px-10 py-16 text-center shadow-inner">
							<motion.div
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.35 }}
								className="mx-auto flex max-w-xl flex-col items-center gap-4"
							>
								<div className="rounded-full bg-biosphere-500/15 px-4 py-2 text-sm font-semibold text-biosphere-400">
									Nothing saved yet
								</div>
								<h2 className="text-2xl font-semibold text-scheme-text">Create something in Discover</h2>
								<p className="text-sm text-scheme-muted-text">
									Ask BioQuery for documents or visuals and they will appear here automatically.
								</p>
								<Button className="mt-2 rounded-full px-6" onClick={() => navigate('/discover')}>
									Open Discover
								</Button>
							</motion.div>
						</div>
					) : null}

					<div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
						{filteredCollections.map((item) => (
							<CollectionCard key={`${item.source}-${item.id}`} artifact={item} onOpen={handleOpenCollection} />
						))}
					</div>
				</div>
			</div>

			{artifactModalDialog}
			{documentModalDialog}
			{timelineModalDialog}
			{visualModalDialog}
	      {graphModalDialog}

	      <Dialog open={collectionsTourOpen} onOpenChange={() => {}}>
	        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
	          <div className="overflow-hidden rounded-3xl bg-scheme-surface text-scheme-text shadow-xl">
	            <div className="grid gap-0 md:grid-cols-[1fr_0.9fr]">
	              <div className="flex flex-col justify-between p-8 md:p-10">
	                <div className="space-y-4">
	                  <span className="inline-flex items-center rounded-full bg-biosphere-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-biosphere-300">
	                    BioQuery collections
	                  </span>
	                  <h2 className="heading-h3 font-bold">
	                    {COLLECTIONS_TOUR_SLIDES[collectionsTourStep].title}
	                  </h2>
	                  <p className="text-sm leading-relaxed text-scheme-muted-text">
	                    {COLLECTIONS_TOUR_SLIDES[collectionsTourStep].description}
	                  </p>
	                </div>
	                <div className="mt-6 rounded-2xl border border-scheme-border/60 bg-scheme-muted/10 p-5 text-sm text-scheme-text/90">
	                  {COLLECTIONS_TOUR_SLIDES[collectionsTourStep].highlight}
	                </div>
	                <div className="mt-8 flex items-center justify-between">
	                  <div className="flex items-center gap-2">
	                    {COLLECTIONS_TOUR_SLIDES.map((slide, index) => (
	                      <span
	                        key={slide.id}
	                        className={`h-2.5 rounded-full transition-all ${index === collectionsTourStep ? 'w-8 bg-biosphere-400' : 'w-2.5 bg-scheme-muted/60'}`}
	                      />
	                    ))}
	                  </div>
	                  <div className="flex items-center gap-3">
	                    <Button variant="ghost" size="sm" onClick={handleBackCollectionsTour} disabled={collectionsTourStep === 0}>
	                      Back
	                    </Button>
	                    <Button variant="default" size="sm" onClick={handleAdvanceCollectionsTour} disabled={collectionsTourSaving}>
	                      {collectionsTourStep === COLLECTIONS_TOUR_SLIDES.length - 1 ? 'Start exploring' : 'Next'}
	                    </Button>
	                  </div>
	                </div>
	              </div>
	              <div
	                className={`flex min-h-[320px] flex-col items-center justify-center gap-6 p-8 text-center text-white md:p-10 bg-gradient-to-br ${COLLECTIONS_TOUR_SLIDES[collectionsTourStep].accent}`}
	              >
	                <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 backdrop-blur">
	                  Your research vault
	                </div>
	                <p className="max-w-xs text-sm leading-relaxed text-white/85">
	                  Collections keeps documents, visuals, datasets, and notes synced with every conversation.
	                </p>
	                <div className="grid w-full gap-3 text-left text-xs text-white/80">
	                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
	                    <p className="font-semibold">Auto-organized</p>
	                    <p className="mt-1 leading-snug text-white/70">Artifacts appear as soon as they are generated.</p>
	                  </div>
	                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
	                    <p className="font-semibold">Filter by type</p>
	                    <p className="mt-1 leading-snug text-white/70">Focus on docs, visuals, notes, or datasets in one click.</p>
	                  </div>
	                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
	                    <p className="font-semibold">Ready to share</p>
	                    <p className="mt-1 leading-snug text-white/70">Grab summaries and export whenever inspiration strikes.</p>
	                  </div>
	                </div>
	              </div>
	            </div>
	          </div>
	        </DialogContent>
	      </Dialog>
		</div>
	)
}
