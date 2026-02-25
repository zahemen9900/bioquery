import { useId, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

import type {
    TimelineData,
    VisualChartData,
    KnowledgeGraphData,
    KnowledgeGraphNode,
    KnowledgeGraphEdge,
    DocumentModalData
} from './ArtifactUtils'
import { CHART_COLORS } from './ArtifactUtils'

// ─── Inline Graph SVG renderer (cannot live in a .ts file) ──────────────────
function GraphVisualization({
    nodes,
    edges,
    selectedNodeId,
    onSelect,
}: {
    nodes: KnowledgeGraphNode[]
    edges: KnowledgeGraphEdge[]
    selectedNodeId: string | null
    onSelect: (nodeId: string) => void
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
        const place = (list: KnowledgeGraphNode[], radius: number) => {
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

export function DocumentArtifactModal({ data, open, onOpenChange }: { data: DocumentModalData | null; open: boolean; onOpenChange: (open: boolean) => void }) {
    if (!data) return null;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden backdrop-blur-3xl bg-white/90 dark:bg-space-950/80 border-black/5 dark:border-white/10 shadow-2xl">
                <DialogHeader className="pr-8">
                    <DialogTitle className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">{data.title ?? 'Generated document'}</DialogTitle>
                    <DialogDescription className="flex flex-wrap items-center gap-2 text-sm pt-2">
                        <span className="rounded-full bg-slate-500/15 ring-1 ring-slate-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                            {data.documentType ?? 'document'}
                        </span>
                        {data.tags.length ? (
                            <>
                                {data.tags.slice(0, 3).map((tag) => (
                                    <span key={tag} className="rounded-full border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-space-800/80 px-3.5 py-1 text-xs font-semibold text-slate-600 dark:text-space-300">
                                        {tag}
                                    </span>
                                ))}
                            </>
                        ) : null}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="mt-8 h-[calc(90vh-200px)] max-h-[calc(90vh-180px)] pr-4 mask-image-fade">
                    <div className="space-y-8 pb-10">
                        {data.imageLink ? (
                            <div className="group relative overflow-hidden rounded-3xl border border-black/5 dark:border-white/10 shadow-2xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.6)]">
                                <img
                                    src={data.imageLink}
                                    alt={data.title ?? 'Document illustration'}
                                    className="w-full h-auto object-cover max-h-[500px] transition-transform duration-700 group-hover:scale-[1.03]"
                                />
                            </div>
                        ) : null}
                        <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-gradient-to-br from-slate-50/90 via-slate-100/70 to-slate-200/60 dark:from-space-900/90 dark:via-space-800/70 dark:to-space-950/60 p-10 shadow-inner backdrop-blur-md">
                            {data.body ? (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    className="prose prose-invert max-w-none text-[17px] leading-relaxed text-slate-700 dark:text-space-200 [&>*]:mb-5 [&>*:last-child]:mb-0 [&_h1]:mb-6 [&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:text-slate-900 [&_h1]:dark:text-white [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:dark:text-space-100 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-700 [&_h3]:dark:text-space-200 flex flex-col"
                                >
                                    {data.body}
                                </ReactMarkdown>
                            ) : (
                                <p className="text-center text-sm text-scheme-muted-text">No document body was provided.</p>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

export function TimelineArtifactModal({ data, open, onOpenChange }: { data: TimelineData | null; open: boolean; onOpenChange: (open: boolean) => void }) {
    const [timelineIndex, setTimelineIndex] = useState(0)

    if (!data) return null;
    const sections = data.sections
    const safeIndex = Math.min(timelineIndex, sections.length - 1)
    const activeSection = sections[safeIndex]

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    onOpenChange(false)
                    setTimelineIndex(0)
                } else {
                    onOpenChange(true)
                }
            }}
        >
            <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden border border-black/5 dark:border-white/10 bg-white/90 dark:bg-space-950/80 backdrop-blur-3xl shadow-2xl p-0 sm:p-0">
                <div className="p-8">
                    <DialogHeader className="pr-8 space-y-2">
                        <DialogTitle className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">{data.title}</DialogTitle>
                        <DialogDescription className="flex flex-wrap items-center gap-2 text-sm pt-2">
                            <span className="rounded-full bg-biosphere-500/15 ring-1 ring-biosphere-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-biosphere-600 dark:text-biosphere-400">
                                {data.sections.length} section{data.sections.length === 1 ? '' : 's'}
                            </span>
                            {data.tags.length ? (
                                <>
                                    {data.tags.slice(0, 3).map((tag) => (
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
                                {data.sections.map((section, index) => {
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
                        {activeSection ? (
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
                        ) : <p className="text-sm text-scheme-muted-text">No sections available.</p>}
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
                                        Math.min(prev + 1, Math.max(data.sections.length - 1, 0)),
                                    )
                                }
                                disabled={timelineIndex >= data.sections.length - 1}
                                className="rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-space-800"
                            >
                                Next section
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function VisualArtifactModal({ data, open, onOpenChange }: { data: VisualChartData | null; open: boolean; onOpenChange: (open: boolean) => void }) {
    if (!data) return null;
    const { chartType, dataPoints } = data

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden border border-black/5 dark:border-white/10 bg-white/90 dark:bg-space-950/80 backdrop-blur-3xl shadow-2xl p-0 sm:p-0">
                <div className="p-8">
                    <DialogHeader className="pr-8 space-y-2">
                        <DialogTitle className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">{data.title}</DialogTitle>
                        <DialogDescription className="flex flex-wrap items-center gap-2 text-sm pt-2">
                            <span className="rounded-full bg-blue-500/15 ring-1 ring-blue-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                {data.chartType} • {data.dataPoints.length} data point{data.dataPoints.length === 1 ? '' : 's'}
                            </span>
                            {data.tags.length ? (
                                <>
                                    {data.tags.slice(0, 3).map((tag) => (
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
        </Dialog>
    )
}

export function GraphArtifactModal({ data, artifactTitle, open, onOpenChange }: { data: KnowledgeGraphData | null; artifactTitle: string | null; open: boolean; onOpenChange: (open: boolean) => void }) {
    const [graphSelection, setGraphSelection] = useState<string | null>(null)

    if (!data) return null;

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    onOpenChange(false)
                    setGraphSelection(null)
                } else {
                    onOpenChange(true)
                }
            }}
        >
            <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden border border-black/5 dark:border-white/10 bg-white/90 dark:bg-space-950/80 backdrop-blur-3xl shadow-2xl p-0 sm:p-0">
                <div className="p-8 h-full flex flex-col">
                    <DialogHeader className="pr-8 space-y-2">
                        <DialogTitle className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">{artifactTitle ?? 'Knowledge graph'}</DialogTitle>
                        <DialogDescription className="flex flex-wrap items-center gap-2 text-sm pt-2">
                            <span className="rounded-full bg-purple-500/15 ring-1 ring-purple-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                                {data.nodes.length} nodes • {data.edges.length} connections
                            </span>
                            {data.tags.length ? (
                                <>
                                    {data.tags.slice(0, 3).map((tag) => (
                                        <span key={tag} className="rounded-full border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-space-800/80 px-3.5 py-1 text-xs font-semibold text-slate-600 dark:text-space-300">
                                            {tag}
                                        </span>
                                    ))}
                                </>
                            ) : null}
                        </DialogDescription>
                    </DialogHeader>
                    {(() => {
                        const nodeMap = new Map(data.nodes.map((node) => [node.id, node]))
                        const activeNodeId = graphSelection ?? data.nodes[0]?.id ?? null
                        const selectedNode = activeNodeId ? nodeMap.get(activeNodeId) ?? null : null
                        const relatedEdges = selectedNode
                            ? data.edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
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
                                            {data.nodes.map((node) => {
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
                                            {data.nodes.length === 0 ? (
                                                <p className="px-5 py-6 text-sm text-slate-500 dark:text-space-400 font-medium">No entities found.</p>
                                            ) : null}
                                        </div>
                                    </ScrollArea>
                                </div>
                                <div className="space-y-6 flex flex-col overflow-hidden max-h-[72vh]">
                                    <div className="relative flex-1 min-h-[420px] overflow-hidden rounded-3xl border border-black/5 dark:border-white/10 bg-gradient-to-br from-slate-50/90 via-slate-100/70 to-slate-200/60 dark:from-space-900/90 dark:via-space-800/70 dark:to-space-950/60 p-4 shadow-inner">
                                        <GraphVisualization
                                            nodes={data.nodes}
                                            edges={data.edges}
                                            selectedNodeId={activeNodeId}
                                            onSelect={(nodeId: string) => setGraphSelection(nodeId)}
                                        />
                                    </div>
                                    <ScrollArea className="max-h-[30vh]">
                                        {data.context ? (
                                            <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-gradient-to-br from-purple-500/5 to-transparent dark:from-purple-500/10 dark:to-space-900/40 p-6 shadow-sm backdrop-blur-md mb-4">
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
        </Dialog>
    )
}
