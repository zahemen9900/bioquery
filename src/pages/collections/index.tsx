import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import supabase from '@/lib/supabase-client'
import { useAuth } from '@/contexts/auth-context-types'
import { cn } from '@/lib/utils'

import CollectionCard, { type ArtifactKind, type CollectionArtifact } from './components/CollectionCard'

type ChatArtifactRow = {
	id: number
	chat_id: string
	artifact_type: string
	title: string | null
	content: string | null
	preview_image_url: string | null
	metadata: Record<string, unknown> | null
	created_at: string
	chats?: { chat_name: string | null } | Array<{ chat_name: string | null }>
}

type TabOption = {
	value: 'all' | ArtifactKind
	label: string
	description: string
}

const TABS: TabOption[] = [
	{ value: 'all', label: 'All', description: 'Every insight you have saved so far.' },
	{ value: 'summary', label: 'Notes', description: 'Executive briefings crafted from your chats.' },
	{ value: 'visualization', label: 'Visualizations', description: 'Graphs and diagrams generated on demand.' },
	{ value: 'document', label: 'References', description: 'Documents and curated source bundles.' },
	{ value: 'dataset', label: 'Datasets', description: 'Structured data extracts for further analysis.' },
]

export default function CollectionsPage() {
	const { user } = useAuth()
		const navigate = useNavigate()
	const [activeTab, setActiveTab] = useState<TabOption['value']>('all')
	const [artifacts, setArtifacts] = useState<CollectionArtifact[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [selectedArtifact, setSelectedArtifact] = useState<CollectionArtifact | null>(null)

	useEffect(() => {
		if (!user) return

		let cancelled = false
		const fetchArtifacts = async () => {
			setLoading(true)
			setError(null)

			const { data, error: fetchError } = await supabase
				.from('chat_artifacts')
				.select(
					`id, chat_id, artifact_type, title, content, preview_image_url, metadata, created_at,
					 chats!inner (chat_name, user_id)`,
				)
				.eq('chats.user_id', user.id)
				.order('created_at', { ascending: false })

			if (fetchError) {
				console.error('Failed to load artifacts', fetchError)
				if (!cancelled) {
					setError('We could not load your collections. Please try again shortly.')
					setArtifacts([])
					setLoading(false)
				}
				return
			}

					if (!cancelled) {
					const rows = (data ?? []) as ChatArtifactRow[]
						const mapped = rows.map((entry) => {
							const chatRelation = Array.isArray(entry.chats) ? entry.chats[0] : entry.chats
										const metadata = typeof entry.metadata === 'object' && entry.metadata !== null ? entry.metadata : {}

										return {
					id: entry.id,
					chat_id: entry.chat_id,
					artifact_type: entry.artifact_type as ArtifactKind,
					title: entry.title,
					content: entry.content,
					preview_image_url: entry.preview_image_url,
											metadata,
					created_at: entry.created_at,
								chat_name: chatRelation?.chat_name ?? null,
							}
						})
				setArtifacts(mapped)
				setLoading(false)
			}
		}

		fetchArtifacts()

		return () => {
			cancelled = true
		}
	}, [user])

	const filteredArtifacts = useMemo(() => {
		if (activeTab === 'all') return artifacts
		return artifacts.filter((artifact) => artifact.artifact_type === activeTab)
	}, [activeTab, artifacts])

	const currentTab = TABS.find((tab) => tab.value === activeTab) ?? TABS[0]

	return (
		<div className="relative flex h-full flex-1 flex-col overflow-hidden bg-scheme-background">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-biosphere-500/10 via-scheme-background to-transparent" aria-hidden />

			<section className="relative border-b border-scheme-border/60 px-6 py-8">
				<div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-biosphere-400">Collections</span>
							<h1 className="mt-3 text-3xl font-semibold text-scheme-text md:text-4xl">Your BioQuery library</h1>
							<p className="mt-2 max-w-2xl text-sm text-scheme-muted-text md:text-base">
								Every artifact you create—notes, graphs, datasets—lives here. Re-open any insight and continue the conversation with BioQuery.
							</p>
						</div>
									<Button
										variant="secondary"
										className="rounded-full border border-scheme-border/60 bg-scheme-surface/80 text-scheme-muted-text"
										disabled
									>
										Manage folders (coming soon)
									</Button>
					</div>

					<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabOption['value'])}>
						<TabsList className="bg-scheme-surface/80 shadow-xl shadow-space-900/20">
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

						<TabsContent value={activeTab} className="mt-8">
							<p className="text-sm text-scheme-muted-text">{currentTab.description}</p>
						</TabsContent>
					</Tabs>
				</div>
			</section>

			<div className="relative flex-1 overflow-y-auto px-6 py-10">
				<div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
					{error ? (
						<div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-6 py-5 text-sm text-rose-100">
							{error}
						</div>
					) : null}

					{loading ? (
						<div className="flex flex-col items-center gap-4 py-20 text-scheme-muted-text">
							<div className="h-12 w-12 animate-spin rounded-full border-4 border-biosphere-500/70 border-t-transparent" />
							<p className="text-sm">Loading your archived artifacts…</p>
						</div>
					) : null}

					{!loading && filteredArtifacts.length === 0 ? (
						<div className="rounded-3xl border border-dashed border-scheme-border/60 bg-scheme-surface/80 px-10 py-16 text-center shadow-inner">
							<motion.div
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.35 }}
								className="mx-auto flex max-w-xl flex-col items-center gap-4"
							>
								<div className="rounded-full bg-biosphere-500/15 px-4 py-2 text-sm font-semibold text-biosphere-400">
									Empty orbit
								</div>
								<h2 className="text-2xl font-semibold text-scheme-text">No artifacts in this category yet</h2>
								<p className="text-sm text-scheme-muted-text">
									Ask BioQuery to create summaries, datasets, or graphs in Discover and they will appear here instantly.
								</p>
												<Button className="mt-2 rounded-full px-6" onClick={() => navigate('/discover')}>
									Open Discover
								</Button>
							</motion.div>
						</div>
					) : null}

					<div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
						{filteredArtifacts.map((artifact) => (
							<CollectionCard key={artifact.id} artifact={artifact} onOpen={setSelectedArtifact} />
						))}
					</div>
				</div>
			</div>

			<Dialog open={!!selectedArtifact} onOpenChange={(open) => !open && setSelectedArtifact(null)}>
				<DialogContent className="max-w-3xl">
					{selectedArtifact ? (
						<div className="space-y-6">
							<DialogHeader>
								<DialogTitle>{selectedArtifact.title ?? 'Untitled artifact'}</DialogTitle>
								<DialogDescription>
									Saved {new Date(selectedArtifact.created_at).toLocaleString()} • Source chat: {selectedArtifact.chat_name ?? 'Unknown'}
								</DialogDescription>
							</DialogHeader>
							{selectedArtifact.preview_image_url ? (
								<div className="overflow-hidden rounded-2xl border border-scheme-border/60">
									<img
										src={selectedArtifact.preview_image_url}
										alt={selectedArtifact.title ?? 'Artifact preview'}
										className="w-full object-cover"
									/>
								</div>
							) : null}
							<Separator />
							<div className="max-h-[60vh] overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-scheme-text/90">
								{selectedArtifact.content ?? 'No content available yet.'}
							</div>
						</div>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	)
}
