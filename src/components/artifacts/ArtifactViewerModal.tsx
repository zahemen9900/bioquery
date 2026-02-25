/**
 * ArtifactViewerModal
 *
 * A standalone modal that fetches and renders an artifact from Supabase
 * by its artifact ID. Used by the Collections page to let users open
 * their saved timelines, charts, graphs, and documents.
 */

import { useEffect, useId, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import supabase from '@/lib/supabase-client'

// ─── Local types ────────────────────────────────────────────────────────────

type ArtifactData = {
    id: string
    type: string
    title: string | null
    summary: string | null
    tags: string[]
    data: Record<string, unknown> | null
}

type DocumentData = {
    id: string
    title: string | null
    documentType: string | null
    tags: string[]
    body: string | null
    imageLink: string | null
}

type TimelineSection = {
    title: string
    description: string
    imageLink?: string | null
}

type TimelineData = {
    title: string
    sections: TimelineSection[]
    tags: string[]
}

type ChartDataPoint = { label: string; value: number }

type VisualChartData = {
    title: string
    chartType: string
    dataPoints: ChartDataPoint[]
    tags: string[]
}

type GraphNode = { id: string; label: string; type?: string | null }
type GraphEdge = { source: string; target: string; relation: string }

type KnowledgeGraphData = {
    nodes: GraphNode[]
    edges: GraphEdge[]
    context: string | null
    tags: string[]
}

export type ArtifactViewerTarget = {
    id: string
    /** Canonical artifact_type string from DB, e.g. "timeline", "visual_json", "knowledge_graph" */
    type: string
    title: string | null
    source: 'artifact' | 'document'
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#f87171']

const ensureStr = (v: unknown): string | null => {
    if (typeof v !== 'string') return null
    const t = v.trim()
    return t.length > 0 ? t : null
}

const ensureRec = (v: unknown): Record<string, unknown> | null => {
    if (!v) return null
    if (typeof v === 'string') {
        try {
            const p = JSON.parse(v)
            if (p && typeof p === 'object' && !Array.isArray(p)) return p as Record<string, unknown>
        } catch {
            return null
        }
    }
    if (typeof v !== 'object' || Array.isArray(v)) return null
    return v as Record<string, unknown>
}

const ensureStrArr = (v: unknown, limit = 16): string[] => {
    if (!Array.isArray(v)) return []
    const out: string[] = []
    for (const entry of v) {
        if (typeof entry !== 'string') continue
        const t = entry.trim()
        if (!t) continue
        out.push(t)
        if (out.length >= limit) break
    }
    return out
}

const coerceNum = (v: unknown): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    const p = Number(v)
    return Number.isFinite(p) ? p : null
}

const toTimelineData = (artifact: ArtifactData): TimelineData | null => {
    const src = ensureRec(artifact.data)
    if (!src) return null
    const rawSections = src.timeline_sections ?? src.sections
    if (!Array.isArray(rawSections)) return null
    const sections: TimelineSection[] = []
    for (const entry of rawSections) {
        if (!entry || typeof entry !== 'object') continue
        const r = entry as Record<string, unknown>
        const title = ensureStr(r.title)
        const description = ensureStr(r.description)
        if (!title || !description) continue
        const imageLink = ensureStr(r.image_link) ?? ensureStr(r.imageLink)
        sections.push({ title, description, imageLink })
    }
    if (!sections.length) return null
    const title = ensureStr(src.title) ?? artifact.title ?? 'Timeline'
    const tags = ensureStrArr(src.tags ?? artifact.tags)
    return { title, sections, tags }
}

const toVisualChartData = (artifact: ArtifactData): VisualChartData | null => {
    const src = ensureRec(artifact.data)
    if (!src) return null
    const rawPoints = src.data_points ?? src.points ?? src.values
    if (!Array.isArray(rawPoints)) return null
    const dataPoints: ChartDataPoint[] = []
    for (const entry of rawPoints) {
        if (!entry || typeof entry !== 'object') continue
        const r = entry as Record<string, unknown>
        const label = ensureStr(r.label)
        const value = coerceNum(r.value)
        if (!label || value === null) continue
        dataPoints.push({ label, value })
    }
    if (!dataPoints.length) return null
    const chartType = (ensureStr(src.chart_type) ?? ensureStr(src.chartType) ?? artifact.type).toLowerCase()
    const title = ensureStr(src.title) ?? artifact.title ?? 'Visualization'
    const tags = ensureStrArr(src.tags ?? artifact.tags)
    return { title, chartType, dataPoints, tags }
}

const toGraphData = (artifact: ArtifactData): KnowledgeGraphData | null => {
    const src = ensureRec(artifact.data)
    if (!src) return null
    const rawNodes = src.nodes
    const rawEdges = src.edges
    if (!Array.isArray(rawNodes) || !Array.isArray(rawEdges)) return null
    const nodes: GraphNode[] = []
    for (const entry of rawNodes) {
        if (!entry || typeof entry !== 'object') continue
        const r = entry as Record<string, unknown>
        const id = ensureStr(r.id)
        const label = ensureStr(r.label)
        if (!id || !label) continue
        nodes.push({ id, label, type: ensureStr(r.type) })
    }
    const edges: GraphEdge[] = []
    for (const entry of rawEdges) {
        if (!entry || typeof entry !== 'object') continue
        const r = entry as Record<string, unknown>
        const source = ensureStr(r.source)
        const target = ensureStr(r.target)
        const relation = ensureStr(r.relation)
        if (!source || !target || !relation) continue
        edges.push({ source, target, relation })
    }
    if (!nodes.length) return null
    const context = ensureStr(src.context)
    const tags = ensureStrArr(src.tags ?? artifact.tags)
    return { nodes, edges, context, tags }
}

// ─── SVG Graph Renderer ──────────────────────────────────────────────────────

function GraphViz({
    nodes,
    edges,
    selectedNodeId,
    onSelect,
}: {
    nodes: GraphNode[]
    edges: GraphEdge[]
    selectedNodeId: string | null
    onSelect: (id: string) => void
}) {
    const size = 800
    const center = size / 2
    const rawId = useId()
    const gradientId = useMemo(() => rawId.replace(/:/g, ''), [rawId])
    const activeNodeId = selectedNodeId && nodes.some((n) => n.id === selectedNodeId) ? selectedNodeId : nodes[0]?.id ?? null

    const layout = useMemo(() => {
        const positions = new Map<string, { x: number; y: number }>()
        if (!nodes.length) return positions
        const focusId = activeNodeId ?? nodes[0]?.id
        if (!focusId) return positions
        const connectedIds = new Set<string>()
        for (const edge of edges) {
            if (edge.source === focusId) connectedIds.add(edge.target)
            if (edge.target === focusId) connectedIds.add(edge.source)
        }
        positions.set(focusId, { x: center, y: center })
        const others = nodes.filter((n) => n.id !== focusId)
        const primary = others.filter((n) => connectedIds.has(n.id))
        const secondary = others.filter((n) => !connectedIds.has(n.id))
        const place = (list: GraphNode[], radius: number) => {
            if (!list.length) return
            const step = (Math.PI * 2) / list.length
            list.forEach((n, i) => {
                const angle = -Math.PI / 2 + i * step
                positions.set(n.id, { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius })
            })
        }
        place(primary, size * 0.32)
        place(secondary, size * 0.45)
        return positions
    }, [nodes, edges, activeNodeId, center])

    const neighborSet = useMemo(() => {
        const s = new Set<string>()
        if (!activeNodeId) return s
        for (const edge of edges) {
            if (edge.source === activeNodeId) s.add(edge.target)
            if (edge.target === activeNodeId) s.add(edge.source)
        }
        return s
    }, [edges, activeNodeId])

    if (!nodes.length) return <div className="flex h-full items-center justify-center text-sm text-slate-500">No graph data.</div>

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
            <defs>
                <radialGradient id={`${gradientId}-bg`} cx="50%" cy="50%" r="70%">
                    <stop offset="0%" stopColor="rgba(59, 130, 246, 0.1)" />
                    <stop offset="100%" stopColor="rgba(15, 23, 42, 0.05)" />
                </radialGradient>
            </defs>
            <rect width={size} height={size} fill={`url(#${gradientId}-bg)`} rx={38} ry={38} />
            {edges.map((edge, i) => {
                const src = layout.get(edge.source)
                const tgt = layout.get(edge.target)
                if (!src || !tgt) return null
                const isActive = activeNodeId ? edge.source === activeNodeId || edge.target === activeNodeId : false
                const midX = (src.x + tgt.x) / 2
                const midY = (src.y + tgt.y) / 2
                return (
                    <g key={`e-${i}`}>
                        <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                            stroke={isActive ? 'rgba(168,85,247,0.65)' : 'rgba(148, 163, 184, 0.35)'}
                            strokeWidth={isActive ? 3 : 1.6} strokeLinecap="round" />
                        {edge.relation ? (
                            <text x={midX} y={midY - 6} textAnchor="middle" fontSize={12} fill="rgba(226, 232, 240, 0.7)">
                                {edge.relation}
                            </text>
                        ) : null}
                    </g>
                )
            })}
            {nodes.map((node) => {
                const pos = layout.get(node.id)
                if (!pos) return null
                const isActive = node.id === activeNodeId
                const isNeighbor = neighborSet.has(node.id)
                const r = isActive ? 26 : isNeighbor ? 20 : 16
                const fill = isActive ? 'rgba(52,211,153,0.9)' : isNeighbor ? 'rgba(168,85,247,0.75)' : 'rgba(148,163,184,0.6)'
                return (
                    <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`} className="cursor-pointer" onClick={() => onSelect(node.id)}>
                        {isActive ? <circle r={r + 8} fill="none" stroke="rgba(52,211,153,0.4)" strokeWidth={3} /> : null}
                        <circle r={r} fill={fill} stroke="rgba(10,15,30,0.9)" strokeWidth={isActive ? 3 : 2} />
                        <text y={r + 20} textAnchor="middle" fontSize={isActive ? 16 : 13} fill="rgba(226,232,240,0.95)" style={{ pointerEvents: 'none' }}>
                            {node.label}
                        </text>
                        {node.type ? (
                            <text y={r + 36} textAnchor="middle" fontSize={11} fill="rgba(148,163,184,0.7)" style={{ pointerEvents: 'none' }}>
                                {node.type.toUpperCase()}
                            </text>
                        ) : null}
                    </g>
                )
            })}
        </svg>
    )
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchArtifact(id: string): Promise<ArtifactData | null> {
    const { data, error } = await supabase
        .from('chat_artifacts')
        .select('id, artifact_type, title, tags, summary, content')
        .eq('id', id)
        .maybeSingle()

    if (error || !data) return null

    const rec = data as Record<string, unknown>
    const contentRaw = rec.content
    let contentRecord: Record<string, unknown> | null = null
    if (contentRaw && typeof contentRaw === 'object' && !Array.isArray(contentRaw)) {
        contentRecord = contentRaw as Record<string, unknown>
    } else if (typeof contentRaw === 'string') {
        try {
            const parsed = JSON.parse(contentRaw)
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                contentRecord = parsed as Record<string, unknown>
            }
        } catch { /* noop */ }
    }

    return {
        id: String(rec.id),
        type: ensureStr(rec.artifact_type) ?? 'summary',
        title: ensureStr(rec.title),
        summary: ensureStr(rec.summary),
        tags: ensureStrArr(rec.tags),
        data: contentRecord,
    }
}

async function fetchDocument(id: string): Promise<DocumentData | null> {
    const { data, error } = await supabase
        .from('documents')
        .select('id, title, body, tags, document_type, image_link')
        .eq('id', id)
        .maybeSingle()

    if (error || !data) return null
    const rec = data as Record<string, unknown>
    return {
        id: String(rec.id),
        title: ensureStr(rec.title),
        documentType: ensureStr(rec.document_type),
        tags: ensureStrArr(rec.tags),
        body: ensureStr(rec.body),
        imageLink: ensureStr(rec.image_link),
    }
}

// ─── The Modal Component ──────────────────────────────────────────────────────

type ArtifactViewerModalProps = {
    target: ArtifactViewerTarget | null
    onClose: () => void
}

export function ArtifactViewerModal({ target, onClose }: ArtifactViewerModalProps) {
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    // Artifact state
    const [artifact, setArtifact] = useState<ArtifactData | null>(null)
    const [document, setDocument] = useState<DocumentData | null>(null)

    // Timeline state
    const [timelineIndex, setTimelineIndex] = useState(0)

    // Graph state
    const [graphSelection, setGraphSelection] = useState<string | null>(null)

    const open = Boolean(target)

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            onClose()
            setArtifact(null)
            setDocument(null)
            setErrorMsg(null)
            setTimelineIndex(0)
            setGraphSelection(null)
        }
    }

    // Fetch data when target changes
    useEffect(() => {
        if (!target) return
        let cancelled = false

        const run = async () => {
            setLoading(true)
            setErrorMsg(null)
            setArtifact(null)
            setDocument(null)

            try {
                if (target.source === 'document') {
                    const doc = await fetchDocument(target.id)
                    if (cancelled) return
                    if (!doc) { setErrorMsg('Could not load this document.'); return }
                    setDocument(doc)
                } else {
                    const art = await fetchArtifact(target.id)
                    if (cancelled) return
                    if (!art) { setErrorMsg('Could not load this artifact.'); return }
                    setArtifact(art)
                    // Pre-select first node for graphs
                    const graphData = toGraphData(art)
                    if (graphData && graphData.nodes[0]) setGraphSelection(graphData.nodes[0].id)
                }
            } catch (e) {
                if (cancelled) return
                console.error('ArtifactViewerModal fetch error', e)
                setErrorMsg('Something went wrong. Please try again.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        void run()
        return () => { cancelled = true }
    }, [target?.id, target?.source])

    // Render loading/error states
    const renderStatus = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center gap-4 py-24">
                    <svg className="h-10 w-10 animate-spin text-biosphere-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-sm font-semibold text-slate-500 dark:text-space-400">Loading artifact…</p>
                </div>
            )
        }
        if (errorMsg) {
            return (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm font-semibold text-rose-600 dark:text-rose-400">{errorMsg}</p>
                </div>
            )
        }
        return null
    }

    // ── DOCUMENT ──────────────────────────────────────────────────────────────
    const renderDocument = () => {
        if (!document) return null
        return (
            <div className="p-8">
                <DialogHeader className="pr-8 space-y-2">
                    <DialogTitle className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">{document.title ?? 'Saved Document'}</DialogTitle>
                    <DialogDescription className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="rounded-full bg-slate-500/15 ring-1 ring-slate-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-space-300">
                            {document.documentType ?? 'Document'}
                        </span>
                        {document.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-full border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-space-800/80 px-3.5 py-1 text-xs font-semibold text-slate-600 dark:text-space-300">{tag}</span>
                        ))}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="mt-8 max-h-[70vh] pr-2">
                    {document.imageLink ? (
                        <div className="mb-6 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
                            <img src={document.imageLink} alt={document.title ?? 'document illustration'} className="w-full object-cover max-h-72" loading="lazy" />
                        </div>
                    ) : null}
                    <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-slate-50 dark:bg-space-900/40 px-8 py-7 shadow-inner backdrop-blur-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed">
                            {document.body ?? '_No content available._'}
                        </ReactMarkdown>
                    </div>
                </ScrollArea>
            </div>
        )
    }

    // ── TIMELINE ──────────────────────────────────────────────────────────────
    const renderTimeline = (data: TimelineData) => {
        const safeIndex = Math.min(timelineIndex, data.sections.length - 1)
        const active = data.sections[safeIndex]
        return (
            <div className="p-8">
                <DialogHeader className="pr-8 space-y-2">
                    <DialogTitle className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">{data.title}</DialogTitle>
                    <DialogDescription className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="rounded-full bg-biosphere-500/15 ring-1 ring-biosphere-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-biosphere-600 dark:text-biosphere-400">
                            {data.sections.length} section{data.sections.length === 1 ? '' : 's'}
                        </span>
                        {data.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-full border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-space-800/80 px-3.5 py-1 text-xs font-semibold text-slate-600 dark:text-space-300">{tag}</span>
                        ))}
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-8 flex flex-col gap-6">
                    <ScrollArea className="max-h-20">
                        <div className="flex flex-wrap items-center gap-3 pb-4">
                            {data.sections.map((section, index) => {
                                const isActive = index === safeIndex
                                return (
                                    <button
                                        type="button"
                                        key={`${section.title}-${index}`}
                                        onClick={() => setTimelineIndex(index)}
                                        className={`flex-shrink-0 rounded-full border px-5 py-2 text-sm font-bold transition-all ${isActive
                                            ? 'border-biosphere-500/50 bg-gradient-to-br from-biosphere-500 to-biosphere-600 text-white shadow-[0_0_15px_rgba(0,231,179,0.3)] scale-105'
                                            : 'border-black/5 dark:border-white/10 bg-slate-100 dark:bg-space-800 text-slate-500 dark:text-space-400 hover:border-biosphere-500/30 hover:text-biosphere-600 dark:hover:text-biosphere-400'
                                            }`}
                                    >
                                        {index + 1}. {section.title.length > 20 ? section.title.substring(0, 20) + '...' : section.title}
                                    </button>
                                )
                            })}
                        </div>
                    </ScrollArea>

                    {active ? (
                        <div className="overflow-hidden rounded-3xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-space-900/40 shadow-sm backdrop-blur-md">
                            {active.imageLink ? (
                                <div className="h-56 w-full overflow-hidden">
                                    <img src={active.imageLink} alt={active.title} className="h-full w-full object-cover" loading="lazy" />
                                </div>
                            ) : null}
                            <div className="p-8">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-biosphere-600 dark:text-biosphere-400 mb-2">
                                    Section {safeIndex + 1} of {data.sections.length}
                                </p>
                                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white drop-shadow-sm">{active.title}</h3>
                                <p className="mt-4 text-[15px] leading-relaxed text-slate-600 dark:text-space-200">{active.description}</p>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        )
    }

    // ── VISUALIZATION ─────────────────────────────────────────────────────────
    const renderVisualization = (data: VisualChartData) => {
        const max = data.dataPoints.reduce((acc, pt) => Math.max(acc, Math.abs(pt.value)), 0)
        return (
            <div className="p-8">
                <DialogHeader className="pr-8 space-y-2">
                    <DialogTitle className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">{data.title}</DialogTitle>
                    <DialogDescription className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="rounded-full bg-blue-500/15 ring-1 ring-blue-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                            {data.chartType} • {data.dataPoints.length} data point{data.dataPoints.length === 1 ? '' : 's'}
                        </span>
                        {data.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-full border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-space-800/80 px-3.5 py-1 text-xs font-semibold text-slate-600 dark:text-space-300">{tag}</span>
                        ))}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="mt-8 max-h-[70vh] pr-4">
                    <div className="space-y-4 rounded-3xl border border-black/5 dark:border-white/10 bg-slate-50/80 dark:bg-space-900/40 p-8 shadow-inner backdrop-blur-md">
                        {data.dataPoints.map((pt, index) => {
                            const proportion = max > 0 ? Math.abs(pt.value) / max : 0
                            const width = Math.max(proportion * 100, 4)
                            const color = CHART_COLORS[index % CHART_COLORS.length]
                            return (
                                <div key={pt.label} className="group">
                                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-space-200 mb-2">
                                        <span>{pt.label}</span>
                                        <span className="text-slate-500 dark:text-space-400">{pt.value}</span>
                                    </div>
                                    <div className="h-3 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden ring-1 ring-inset ring-black/5 dark:ring-white/10">
                                        <div
                                            className="h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all duration-700 group-hover:brightness-110"
                                            style={{ width: `${width}%`, backgroundColor: color }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </div>
        )
    }

    // ── KNOWLEDGE GRAPH ───────────────────────────────────────────────────────
    const renderGraph = (data: KnowledgeGraphData) => {
        const nodeMap = new Map(data.nodes.map((n) => [n.id, n]))
        const activeNodeId = graphSelection ?? data.nodes[0]?.id ?? null
        const selectedNode = activeNodeId ? nodeMap.get(activeNodeId) ?? null : null
        const relatedEdges = selectedNode
            ? data.edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
            : []
        return (
            <div className="p-8 h-full flex flex-col">
                <DialogHeader className="pr-8 space-y-2">
                    <DialogTitle className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">{artifact?.title ?? 'Knowledge Graph'}</DialogTitle>
                    <DialogDescription className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="rounded-full bg-purple-500/15 ring-1 ring-purple-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                            {data.nodes.length} nodes • {data.edges.length} connections
                        </span>
                        {data.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-full border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-space-800/80 px-3.5 py-1 text-xs font-semibold text-slate-600 dark:text-space-300">{tag}</span>
                        ))}
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr] flex-1 overflow-hidden">
                    {/* Entity list */}
                    <div className="flex flex-col gap-4 overflow-hidden">
                        <div className="flex items-center gap-2.5 px-1">
                            <div className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                            <p className="text-sm font-bold tracking-wide uppercase text-slate-700 dark:text-space-300">Entities</p>
                        </div>
                        <ScrollArea className="flex-1 rounded-3xl border border-black/5 dark:border-white/10 bg-slate-50/80 dark:bg-space-900/40 shadow-inner backdrop-blur-md">
                            <div className="flex flex-col py-2">
                                {data.nodes.map((node) => {
                                    const isActive = node.id === activeNodeId
                                    return (
                                        <button
                                            type="button"
                                            key={node.id}
                                            onClick={() => setGraphSelection(node.id)}
                                            className={`flex flex-col items-start gap-1.5 border-b border-black/5 dark:border-white/5 px-5 py-3 text-left transition-all relative overflow-hidden group ${isActive ? 'bg-gradient-to-r from-purple-500/10 to-transparent' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                                        >
                                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />}
                                            <span className={cn('text-sm font-bold transition-colors', isActive ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-space-200 group-hover:text-slate-900 dark:group-hover:text-white')}>
                                                {node.label}
                                            </span>
                                            {node.type ? (
                                                <span className={cn('rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest transition-colors', isActive ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300' : 'bg-black/5 dark:bg-white/10 text-slate-500 dark:text-space-400')}>
                                                    {node.type}
                                                </span>
                                            ) : null}
                                        </button>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                    {/* Graph + details */}
                    <div className="flex flex-col gap-6 overflow-hidden max-h-[72vh]">
                        <div className="relative flex-1 min-h-[360px] overflow-hidden rounded-3xl border border-black/5 dark:border-white/10 bg-gradient-to-br from-slate-50/90 via-slate-100/70 to-slate-200/60 dark:from-space-900/90 dark:via-space-800/70 dark:to-space-950/60 p-4 shadow-inner">
                            <GraphViz nodes={data.nodes} edges={data.edges} selectedNodeId={activeNodeId} onSelect={setGraphSelection} />
                        </div>
                        <ScrollArea className="max-h-[24vh]">
                            {data.context ? (
                                <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-gradient-to-br from-purple-500/5 to-transparent dark:from-purple-500/10 p-6 shadow-sm backdrop-blur-md mb-4">
                                    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">Context</p>
                                    <p className="text-sm leading-relaxed text-slate-700 dark:text-space-200">{data.context}</p>
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
                                        {relatedEdges.length ? relatedEdges.map((edge, i) => {
                                            const otherId = edge.source === selectedNode.id ? edge.target : edge.source
                                            const other = nodeMap.get(otherId)
                                            return (
                                                <span key={i} className="rounded-full border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-space-800/80 px-3.5 py-1.5 text-[0.7rem] font-bold text-slate-700 dark:text-space-200 shadow-sm">
                                                    <span className="text-purple-600 dark:text-purple-400 mr-1.5 opacity-80">{edge.relation}</span>
                                                    {other?.label ?? otherId}
                                                </span>
                                            )
                                        }) : (
                                            <span className="text-sm text-slate-500 dark:text-space-400 italic">No immediate connections.</span>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </ScrollArea>
                    </div>
                </div>
            </div>
        )
    }

    // ── Determine content ─────────────────────────────────────────────────────
    const renderContent = () => {
        const status = renderStatus()
        if (status) return status
        if (document) return renderDocument()
        if (!artifact) return null

        const type = artifact.type.toLowerCase()

        if (type === 'timeline') {
            const data = toTimelineData(artifact)
            if (data) return renderTimeline(data)
        }

        if (type === 'visual_json' || type === 'visualization') {
            const data = toVisualChartData(artifact)
            if (data) return renderVisualization(data)
        }

        if (type === 'knowledge_graph') {
            const data = toGraphData(artifact)
            if (data) return renderGraph(data)
        }

        // Fallback: show summary / raw content
        return (
            <div className="p-8">
                <DialogHeader className="pr-8 space-y-2">
                    <DialogTitle className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{artifact.title ?? target?.title ?? 'Artifact'}</DialogTitle>
                    <DialogDescription className="pt-2">
                        <span className="rounded-full bg-slate-500/15 ring-1 ring-slate-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-space-300">{artifact.type}</span>
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="mt-8 max-h-[70vh]">
                    <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-slate-50 dark:bg-space-900/40 px-8 py-7 shadow-inner backdrop-blur-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed">
                            {artifact.summary ?? '_No preview available for this artifact type._'}
                        </ReactMarkdown>
                    </div>
                </ScrollArea>
            </div>
        )
    }

    const isWide = artifact
        ? ['knowledge_graph', 'timeline', 'visual_json', 'visualization'].includes(artifact.type.toLowerCase())
        : false

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className={cn(
                    'max-h-[92vh] overflow-hidden border border-black/5 dark:border-white/10 bg-white/90 dark:bg-space-950/80 backdrop-blur-3xl shadow-2xl p-0 sm:p-0',
                    isWide ? 'max-w-6xl' : 'max-w-4xl',
                )}
            >
                {renderContent()}
            </DialogContent>
        </Dialog>
    )
}

export default ArtifactViewerModal
