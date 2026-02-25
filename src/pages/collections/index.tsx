import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'

import { HiMiniBars3CenterLeft, HiOutlineMagnifyingGlass } from 'react-icons/hi2'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import supabase from '@/lib/supabase-client'
import { useAuth } from '@/contexts/auth-context-types'
import { useAppShell } from '@/contexts/app-shell-context'
import { cn } from '@/lib/utils'

import CollectionCard, { type CollectionArtifact, type CollectionKind } from './components/CollectionCard'
import { ArtifactViewerModal, type ArtifactViewerTarget } from '@/components/artifacts/ArtifactViewerModal'

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

export default function CollectionsPage() {
	const { user } = useAuth()
	const { openMobileSidebar } = useAppShell()
	const navigate = useNavigate()
	const mobileMenuButtonClasses =
		'inline-flex h-9 w-9 items-center justify-center rounded-lg bg-scheme-surface/80 text-scheme-text shadow-sm ring-1 ring-inset ring-scheme-border/60 transition hover:text-biosphere-500 hover:ring-biosphere-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biosphere-500/60 md:hidden'

	const [activeTab, setActiveTab] = useState<TabValue>('all')
	const [collections, setCollections] = useState<CollectionArtifact[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [viewingArtifact, setViewingArtifact] = useState<ArtifactViewerTarget | null>(null)

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
						artifactType: entry.artifact_type ?? null,
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
						artifactType: null,
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

	return (
		<div className="relative flex h-full flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-space-950 transition-colors duration-500">
			{/* Ambient background */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
				<div className="absolute left-[10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-biosphere-500/10 blur-[120px]" />
				<div className="absolute right-[10%] top-[40%] h-[400px] w-[400px] rounded-full bg-accent-purple/5 dark:bg-accent-purple/10 blur-[120px]" />
				<div className="absolute inset-0 bg-noise opacity-[0.02] mix-blend-overlay" />
			</div>

			<section className="relative border-b border-black/5 dark:border-white/10 px-6 pb-4 pt-8 md:pt-6 z-10 backdrop-blur-xl bg-white/40 dark:bg-space-900/60 shadow-sm">
				<div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
					{/* Header Text & Mobile Menu Button */}
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-3 mb-1">
							<button type="button" onClick={openMobileSidebar} className={mobileMenuButtonClasses} aria-label="Open navigation">
								<HiMiniBars3CenterLeft className="h-5 w-5" />
							</button>
							<div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-biosphere-600 dark:text-biosphere-400">
								<span className="h-px w-6 bg-biosphere-500/50" />
								Archives
							</div>
						</div>
						<h1 className="text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-white leading-none">Your BioQuery Library</h1>
						<p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-space-300">
							Track every document and visual your chats produce and return whenever you need a refresher.
						</p>
					</div>

					{/* Search & Tabs Component Group */}
					<div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[400px]">
						<div className="relative group">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<HiOutlineMagnifyingGlass className="h-4 w-4 text-slate-400 transition-colors group-focus-within:text-biosphere-500" />
							</div>
							<Input
								type="search"
								placeholder="Search by title, notes, or tags"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full bg-white/50 dark:bg-space-800/40 pl-10 pr-4 text-sm transition-all outline-none rounded-xl border border-black/5 dark:border-white/10 focus-visible:ring-1 focus-visible:ring-biosphere-500/50 focus-visible:border-biosphere-500/50 shadow-inner h-10"
							/>
						</div>

						<Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabValue)} className="w-full sm:w-auto">
							<TabsList className="inline-flex h-10 items-center justify-start rounded-xl bg-white/40 dark:bg-space-800/40 p-1 text-slate-500 dark:text-space-400 border border-black/5 dark:border-white/5 backdrop-blur-md shadow-sm w-full outline-none overflow-x-auto no-scrollbar">
								{TABS.map((tab) => (
									<TabsTrigger
										key={tab.value}
										value={tab.value}
										className={cn(
											'rounded-[0.6rem] px-4 py-1.5 text-xs font-bold transition-all duration-300 flex-shrink-0',
											activeTab === tab.value
												? 'bg-biosphere-500/15 dark:bg-biosphere-500/20 text-biosphere-600 dark:text-biosphere-400 shadow-[0_2px_10px_rgba(0,231,179,0.15)] ring-1 ring-biosphere-500/30'
												: 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-space-700/50'
										)}
									>
										{tab.label}
									</TabsTrigger>
								))}
							</TabsList>
						</Tabs>
					</div>
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
						<div className="rounded-[2.5rem] border border-black/5 dark:border-white/10 bg-white/40 dark:bg-space-800/20 backdrop-blur-xl px-10 py-20 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl relative overflow-hidden">
							<div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />
							<motion.div
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.35 }}
								className="mx-auto flex max-w-xl flex-col items-center gap-4"
							>
								<div className="rounded-2xl bg-biosphere-500/10 dark:bg-biosphere-500/20 ring-1 ring-biosphere-500/30 px-5 py-2 text-sm font-bold text-biosphere-600 dark:text-biosphere-400 shadow-[0_0_15px_rgba(0,231,179,0.1)]">
									Nothing saved yet
								</div>
								<h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white mt-2">Create something in Discover</h2>
								<p className="text-lg text-slate-600 dark:text-space-300 max-w-md mx-auto">
									Ask BioQuery for documents or visuals and they will appear here automatically.
								</p>
								<Button className="mt-4 rounded-xl px-8 h-12 bg-biosphere-500 text-white dark:text-space-900 font-bold shadow-[0_0_15px_rgba(0,231,179,0.3)] dark:shadow-neon-teal hover:bg-biosphere-600 dark:hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300" onClick={() => navigate('/discover')}>
									Open Discover
								</Button>
							</motion.div>
						</div>
					) : null}

					<div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
						{filteredCollections.map((item) => (
							<CollectionCard
								key={`${item.source}-${item.id}`}
								artifact={item}
								onOpen={() => setViewingArtifact({
									id: item.id,
									type: item.artifactType ?? item.kind,
									title: item.title,
									source: item.source,
								})}
							/>
						))}
					</div>
				</div>
			</div>
			<ArtifactViewerModal
				target={viewingArtifact}
				onClose={() => setViewingArtifact(null)}
			/>
		</div >
	)
}
