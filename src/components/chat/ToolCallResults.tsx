import { useMemo, useState } from 'react'
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
} from 'react-icons/hi2'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast/useToast'
import supabase from '@/lib/supabase-client'
import type { ChatMessage } from '@/contexts/chat-context-types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

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

const formatToolName = (name: string): string =>
	name
		.replace(/_/g, ' ')
		.replace(/\b\w/g, (char) => char.toUpperCase())

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

		const slot = map.get(toolId) ?? { call: null, artifact: null, document: null, image: null }

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

	const renderImageAsset = (image: ImageAssetReference, call: ToolCallEntry | null) => {
		return (
			<div className="mt-3 rounded-2xl border border-biosphere-500/25 bg-biosphere-500/5 p-4 backdrop-blur">
				<div className="flex items-start gap-3">
					<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-biosphere-500/20 text-biosphere-200">
						<HiOutlinePhoto className="h-5 w-5" />
					</span>
					<div className="flex-1 space-y-3">
						<div className="space-y-1">
							<p className="text-sm font-semibold text-scheme-text">
								{call ? `${formatToolName(call.name)} image` : 'Generated image'}
							</p>
							<p className="text-xs text-scheme-muted-text/80">{formatExpiryLabel(image.expiresAt)}</p>
						</div>
						<div className="overflow-hidden rounded-xl border border-biosphere-500/25 bg-space-900/40">
							<img
								src={image.url}
								alt={image.prompt ?? 'Generated image'}
								className="max-h-72 w-full object-cover"
								loading="lazy"
							/>
						</div>
						{image.prompt ? (
							<p className="text-xs leading-relaxed text-scheme-muted-text/80">Prompt: {image.prompt}</p>
						) : null}
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

	const renderStatusPill = (call: ToolCallEntry | null) => {
		if (!call) return null
		if (call.status === 'pending') {
			return <Badge className="rounded-full bg-amber-500/15 text-[0.7rem] text-amber-300">Running…</Badge>
		}
		if (call.status === 'error') {
			return <Badge className="rounded-full bg-rose-500/20 text-[0.7rem] text-rose-200">Failed</Badge>
		}
		return <Badge className="rounded-full bg-emerald-500/15 text-[0.7rem] text-emerald-200">Ready</Badge>
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
			<div className="mt-3 rounded-2xl border border-biosphere-500/25 bg-biosphere-500/5 p-4 backdrop-blur">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-biosphere-500/15 text-biosphere-300">
							<Icon className="h-5 w-5" />
						</span>
						<div className="space-y-1">
							<p className="text-sm font-semibold text-scheme-text">{artifact.title ?? 'Generated artifact'}</p>
							<p className="text-xs text-scheme-muted-text">
								{call ? formatToolName(call.name) : 'Artifact'} • {displayType.replace('_', ' ')}
							</p>
						</div>
					</div>
					{metricsLabel ? <span className="text-xs text-scheme-muted-text">{metricsLabel}</span> : null}
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
					{call ? (
						<Badge variant="secondary" className="rounded-full bg-scheme-surface/80 text-xs text-scheme-muted-text">
							Artifact #{call.id}
						</Badge>
					) : null}
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
			<div className="mt-3 rounded-2xl border border-biosphere-500/25 bg-biosphere-500/5 p-4 backdrop-blur">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-biosphere-500/15 text-biosphere-300">
							<HiOutlineQueueList className="h-5 w-5" />
						</span>
						<div className="space-y-1">
							<p className="text-sm font-semibold text-scheme-text">{timelineTitle}</p>
							<p className="text-xs text-scheme-muted-text">
								{call ? formatToolName(call.name) : 'Timeline'} • {displayType.replace('_', ' ')}
							</p>
						</div>
					</div>
					{metricsLabel ? <span className="text-xs text-scheme-muted-text">{metricsLabel}</span> : null}
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
					{call ? (
						<Badge variant="secondary" className="rounded-full bg-scheme-surface/80 text-xs text-scheme-muted-text">
							Artifact #{call.id}
						</Badge>
					) : null}
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
			<div className="mt-3 rounded-2xl border border-biosphere-500/25 bg-biosphere-500/5 p-4 backdrop-blur">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-biosphere-500/15 text-biosphere-300">
							<HiOutlineChartBarSquare className="h-5 w-5" />
						</span>
						<div className="space-y-1">
							<p className="text-sm font-semibold text-scheme-text">{chartTitle}</p>
							<p className="text-xs text-scheme-muted-text">
								{call ? formatToolName(call.name) : 'Visualization'} • {chartTypeLabel}
							</p>
						</div>
					</div>
					{metricsLabel ? <span className="text-xs text-scheme-muted-text">{metricsLabel}</span> : null}
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
					{call ? (
						<Badge variant="secondary" className="rounded-full bg-scheme-surface/80 text-xs text-scheme-muted-text">
							Artifact #{call.id}
						</Badge>
					) : null}
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
			<div className="mt-3 rounded-2xl border border-biosphere-500/25 bg-biosphere-500/5 p-4 backdrop-blur">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-biosphere-500/15 text-biosphere-300">
							<HiOutlineGlobeAlt className="h-5 w-5" />
						</span>
						<div className="space-y-1">
							<p className="text-sm font-semibold text-scheme-text">{artifact.title ?? 'Knowledge graph'}</p>
							<p className="text-xs text-scheme-muted-text">
								{call ? formatToolName(call.name) : 'Knowledge graph'} • {nodeCount} nodes · {edgeCount} edges
							</p>
						</div>
					</div>
					{metricsLabel ? <span className="text-xs text-scheme-muted-text">{metricsLabel}</span> : null}
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
					{call ? (
						<Badge variant="secondary" className="rounded-full bg-scheme-surface/80 text-xs text-scheme-muted-text">
							Artifact #{call.id}
						</Badge>
					) : null}
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
			<div className="mt-3 rounded-2xl border border-scheme-border-subtle bg-scheme-surface/90 p-4 shadow-sm">
				<div className="flex items-start gap-3">
					<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-scheme-muted/20 text-scheme-muted-text">
						<HiOutlineDocumentText className="h-5 w-5" />
					</span>
					<div className="flex-1 space-y-2">
						<div>
							<p className="text-sm font-semibold text-scheme-text">{document.title ?? 'Generated document'}</p>
							<p className="text-xs text-scheme-muted-text">
								{call ? formatToolName(call.name) : 'Document'} • {document.documentType ?? 'document'}
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
							{call ? (
								<Badge variant="secondary" className="rounded-full bg-scheme-surface/80 text-xs text-scheme-muted-text">
									Document #{call.id}
								</Badge>
							) : null}
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
				{formatToolName(call.name)} failed
			</p>
			{call.error ? <p className="mt-1 text-xs text-rose-200/80">{call.error}</p> : null}
		</div>
	)

	const renderSummary = (call: ToolCallEntry) => {
		if (!call.summary) return null
		const summaryEntries = Object.entries(call.summary).filter(([, value]) => typeof value !== 'object')
		if (!summaryEntries.length) return null
		return (
			<div className="mt-3 rounded-2xl border border-scheme-border-subtle/60 bg-scheme-surface/70 px-4 py-3 text-xs text-scheme-muted-text">
				{summaryEntries.map(([key, value]) => (
					<div key={key} className="flex items-center justify-between gap-4">
						<span className="font-semibold text-scheme-text/80">{formatToolName(key)}</span>
						<span>{String(value)}</span>
					</div>
				))}
			</div>
		)
	}

	const renderBlock = (id: number) => {
		const entry = metadata.map.get(id)
		if (!entry) return null

		const { call, artifact, document, image } = entry
		const resolvedArtifact = artifact ? artifactCache[artifact.id] ?? artifact : null
		const resolvedDocument = document ? documentCache[document.id] ?? document : null
		const statusPill = renderStatusPill(call)

		return (
			<div key={`tool-block-${id}`} className="my-2 rounded-2xl border border-scheme-border-subtle/70 bg-scheme-surface/80 p-3">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2 text-sm font-semibold text-scheme-text">
						<span>{call ? formatToolName(call.name) : `Tool #${id}`}</span>
						<span className="text-xs text-scheme-muted-text/70">#{id}</span>
					</div>
					{statusPill}
				</div>
				{call && call.status === 'error' ? renderError(call) : null}
				{resolvedArtifact ? renderArtifact(resolvedArtifact, call) : null}
				{resolvedDocument ? renderDocument(resolvedDocument, call) : null}
				{image ? renderImageAsset(image, call) : null}
				{call && call.status === 'success' && !resolvedArtifact && !resolvedDocument && !image ? renderSummary(call) : null}
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
				<DialogContent className="max-h-[80vh] max-w-3xl">
					<DialogHeader>
						<DialogTitle>{documentModal.title ?? 'Generated document'}</DialogTitle>
						<DialogDescription>
							{documentModal.documentType ?? 'document'}
							{documentModal.tags.length ? ` • ${documentModal.tags.join(', ')}` : ''}
						</DialogDescription>
					</DialogHeader>
					<ScrollArea className="mt-4 max-h-[68vh] pr-2">
						<div className="space-y-4">
							{documentModal.imageLink ? (
								<div className="overflow-hidden rounded-2xl border border-scheme-border-subtle/70">
									<img src={documentModal.imageLink} alt={documentModal.title ?? 'Document illustration'} className="w-full object-cover" />
								</div>
							) : null}
							{documentModal.imagePrompt ? (
								<p className="text-xs text-scheme-muted-text/80">Image prompt: {documentModal.imagePrompt}</p>
							) : null}
							{documentModal.body ? (
								<ReactMarkdown
									remarkPlugins={[remarkGfm]}
									className="text-sm leading-relaxed text-scheme-text/90 [&>*]:mb-4 [&>*:last-child]:mb-0 [&_h2]:text-lg [&_h3]:text-base [&_strong]:text-scheme-text [&_a]:text-biosphere-300 hover:[&_a]:text-biosphere-200 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l [&_blockquote]:border-scheme-border-subtle [&_blockquote]:pl-3 [&_blockquote]:text-scheme-muted-text/80 [&_code]:rounded [&_code]:bg-scheme-muted/20 [&_code]:px-1 [&_code]:py-0.5 [&_table]:w-full [&_th]:text-left [&_th]:font-semibold"
								>
									{documentModal.body}
								</ReactMarkdown>
							) : (
								<p className="text-sm text-scheme-muted-text">No document body was provided.</p>
							)}
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
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>{timelineModal.data.title}</DialogTitle>
						<DialogDescription>
							{timelineModal.data.sections.length} section{timelineModal.data.sections.length === 1 ? '' : 's'} timeline
						</DialogDescription>
					</DialogHeader>
					{timelineModal.call ? (
						<p className="text-xs text-scheme-muted-text/80">
							Generated by {formatToolName(timelineModal.call.name)}
						</p>
					) : null}
					<div className="mt-4 flex flex-col gap-4">
						<div className="flex flex-wrap items-center gap-2">
							{timelineModal.data.sections.map((section, index) => {
								const isActive = index === timelineIndex
								return (
									<button
										type="button"
										key={`${section.title}-${index}`}
										onClick={() => setTimelineIndex(index)}
										className={`rounded-full border px-3 py-1 text-xs transition ${
											isActive
												? 'border-biosphere-500 bg-biosphere-500/20 text-biosphere-100'
												: 'border-scheme-border-subtle text-scheme-muted-text hover:border-biosphere-500/60 hover:text-biosphere-100'
										}`}
									>
										Step {index + 1}
									</button>
								)
							})}
						</div>
						{(() => {
							const sections = timelineModal.data.sections
							const safeIndex = Math.min(timelineIndex, sections.length - 1)
							const activeSection = sections[safeIndex]
							if (!activeSection) {
								return <p className="text-sm text-scheme-muted-text">No sections available.</p>
							}
							return (
								<ScrollArea className="max-h-[55vh] rounded-2xl border border-scheme-border-subtle/60 bg-scheme-surface/70 p-5">
									<div className="space-y-3 text-sm text-scheme-text/90">
										<p className="text-xs font-semibold uppercase tracking-wide text-scheme-muted-text/80">
											Step {safeIndex + 1}
										</p>
										<h3 className="text-base font-semibold text-scheme-text">{activeSection.title}</h3>
										<p className="leading-relaxed">{activeSection.description}</p>
										{activeSection.imageLink ? (
											<div className="overflow-hidden rounded-2xl border border-scheme-border-subtle/60">
												<img src={activeSection.imageLink} alt={activeSection.title} className="w-full object-cover" />
											</div>
										) : null}
										{activeSection.imagePrompt ? (
											<p className="text-xs text-scheme-muted-text/80">Image prompt: {activeSection.imagePrompt}</p>
										) : null}
									</div>
								</ScrollArea>
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
									setTimelineIndex((prev) =>
										Math.min(prev + 1, Math.max(timelineModal.data.sections.length - 1, 0)),
									)
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
		<Dialog open={Boolean(visualModal)} onOpenChange={(open) => {
			if (!open) {
				setVisualModal(null)
			}
		}}>
			{visualModal ? (
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>{visualModal.data.title}</DialogTitle>
						<DialogDescription>
							{visualModal.data.chartType} chart with {visualModal.data.dataPoints.length} point
							{visualModal.data.dataPoints.length === 1 ? '' : 's'}
						</DialogDescription>
					</DialogHeader>
					<div className="mt-4 space-y-6">
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
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>{graphModal.artifact.title ?? 'Knowledge graph'}</DialogTitle>
						<DialogDescription>
							{graphModal.data.nodes.length} nodes • {graphModal.data.edges.length} edges
						</DialogDescription>
					</DialogHeader>
					<div className="mt-4 grid gap-6 md:grid-cols-[220px_1fr]">
						<div className="space-y-3">
							<p className="text-xs font-semibold uppercase tracking-wide text-scheme-muted-text/80">Nodes</p>
							<ScrollArea className="max-h-[55vh] rounded-2xl border border-scheme-border-subtle/60">
								<div className="flex flex-col divide-y divide-scheme-border-subtle/50">
									{graphModal.data.nodes.map((node) => {
										const isActive = node.id === graphSelection
										return (
											<button
												type="button"
												key={node.id}
												onClick={() => setGraphSelection(node.id)}
												className={`flex flex-col items-start gap-1 px-3 py-3 text-left transition ${
													isActive
														? 'bg-biosphere-500/15 text-biosphere-100'
														: 'text-scheme-text hover:bg-biosphere-500/10'
												}`}
											>
												<span className="text-sm font-semibold">{node.label}</span>
												{node.type ? (
													<span className="text-[0.65rem] uppercase tracking-wide text-scheme-muted-text/70">
														{node.type}
													</span>
												) : null}
											</button>
										)
									})}
									{graphModal.data.nodes.length === 0 ? (
										<p className="px-3 py-4 text-xs text-scheme-muted-text">No nodes defined.</p>
									) : null}
								</div>
							</ScrollArea>
						</div>
						<div className="space-y-4">
							{graphModal.data.context ? (
								<p className="rounded-2xl border border-scheme-border-subtle/60 bg-scheme-surface/70 p-4 text-xs text-scheme-muted-text/90">
									{graphModal.data.context}
								</p>
							) : null}
							{(() => {
								const selectedNode = graphModal.data.nodes.find((node) => node.id === graphSelection) ?? graphModal.data.nodes[0]
								if (!selectedNode) {
									return <p className="text-sm text-scheme-muted-text">No nodes available.</p>
								}
								const relatedEdges = graphModal.data.edges.filter(
									(edge) => edge.source === selectedNode.id || edge.target === selectedNode.id,
								)
								return (
									<div className="rounded-2xl border border-scheme-border-subtle/60 bg-scheme-surface/70 p-5">
										<p className="text-xs font-semibold uppercase tracking-wide text-scheme-muted-text/80">
											Connections for {selectedNode.label}
										</p>
										{relatedEdges.length ? (
											<ul className="mt-3 space-y-2 text-sm text-scheme-text/90">
												{relatedEdges.map((edge, index) => (
													<li key={`${edge.source}-${edge.target}-${index}`} className="rounded-lg border border-scheme-border-subtle/60 bg-scheme-surface/80 px-3 py-2">
														<p className="text-xs text-scheme-muted-text/80">{edge.relation}</p>
														<p className="text-sm font-medium text-scheme-text">
															{edge.source} → {edge.target}
														</p>
													</li>
												))}
											</ul>
										) : (
											<p className="mt-3 text-sm text-scheme-muted-text">No connections for this node.</p>
										)}
									</div>
								)
							})()}
						</div>
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

export default ToolCallResults
