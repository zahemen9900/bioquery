import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'

import { HiMiniBars3CenterLeft } from 'react-icons/hi2'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import supabase from '@/lib/supabase-client'
import { useAuth } from '@/contexts/auth-context-types'
import { useAppShell } from '@/contexts/app-shell-context'
import { cn } from '@/lib/utils'

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
							<CollectionCard key={`${item.source}-${item.id}`} artifact={item} />
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
