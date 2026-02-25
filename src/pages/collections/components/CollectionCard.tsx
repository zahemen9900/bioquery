import { HiOutlineBookmark, HiOutlineChartBar, HiOutlineDocumentText, HiOutlineSparkles } from 'react-icons/hi2'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type CollectionKind = 'summary' | 'document' | 'visualization' | 'dataset'

export interface CollectionArtifact {
	id: string
	kind: CollectionKind
	title: string | null
	snippet: string | null
	tags: string[]
	createdAt: string
	chatName: string | null
	previewImageUrl: string | null
	source: 'artifact' | 'document'
}

const TYPE_BADGES: Record<CollectionKind, { label: string; icon: typeof HiOutlineBookmark; tint: string }> = {
	summary: {
		label: 'Mission Note',
		icon: HiOutlineDocumentText,
		tint: 'bg-gradient-to-r from-biosphere-500/15 to-cosmic-500/15 text-biosphere-300',
	},
	document: {
		label: 'Reference',
		icon: HiOutlineBookmark,
		tint: 'bg-gradient-to-r from-space-500/15 to-space-700/15 text-space-200',
	},
	visualization: {
		label: 'Visualization',
		icon: HiOutlineChartBar,
		tint: 'bg-gradient-to-r from-amber-400/20 to-biosphere-500/20 text-amber-200',
	},
	dataset: {
		label: 'Dataset Extract',
		icon: HiOutlineSparkles,
		tint: 'bg-gradient-to-r from-emerald-400/20 to-cosmic-500/20 text-emerald-200',
	},
}

export function CollectionCard({ artifact }: { artifact: CollectionArtifact }) {
	const badge = TYPE_BADGES[artifact.kind]
	const Icon = badge.icon

	return (
		<Card className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border-black/5 dark:border-white/10 bg-white/60 dark:bg-space-900/40 shadow-sm hover:shadow-2xl dark:hover:shadow-[0_15px_40px_rgba(0,231,179,0.08)] backdrop-blur-3xl transition-all duration-500 hover:-translate-y-2 hover:border-biosphere-500/30">
			<div className="absolute inset-0 bg-gradient-to-br from-biosphere-500/0 via-transparent to-cosmic-500/0 opacity-0 transition-opacity duration-500 group-hover:from-biosphere-500/5 group-hover:to-cosmic-500/5 group-hover:opacity-100 pointer-events-none" />

			<CardHeader className="gap-4 relative z-10 pt-8 px-8">
				<div className={cn('inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold w-fit shadow-sm', badge.tint)}>
					<Icon className="h-4 w-4" />
					{badge.label}
				</div>
				<div className="space-y-1 mt-2">
					<CardTitle className="text-2xl font-display font-bold text-slate-900 dark:text-white transition-colors group-hover:text-biosphere-600 dark:group-hover:text-biosphere-400 tracking-tight leading-tight">
						{artifact.title?.trim() || 'Untitled entry'}
					</CardTitle>
					<CardDescription className="text-xs text-slate-500 dark:text-space-400 font-semibold tracking-wide uppercase">
						{artifact.chatName ? `Captured from “${artifact.chatName}”` : artifact.source === 'document' ? 'Saved document' : 'Generated via Discover'}
					</CardDescription>
				</div>
			</CardHeader>

			{artifact.previewImageUrl ? (
				<div className="mx-8 relative z-10 h-40 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-space-800 shadow-inner group-hover:ring-2 ring-biosphere-500/20 transition-all duration-500">
					<img
						src={artifact.previewImageUrl}
						alt={artifact.title ?? 'Collection preview'}
						className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
						loading="lazy"
					/>
				</div>
			) : null}

			<CardContent className="flex flex-1 flex-col justify-end gap-4 relative z-10 px-8 pb-8 pt-4">
				<div className="line-clamp-4 text-sm whitespace-pre-line leading-relaxed text-slate-600 dark:text-space-300">
					{artifact.snippet?.length ? artifact.snippet : 'This entry is ready to revisit when you are.'}
				</div>
				{artifact.tags.length ? (
					<div className="flex flex-wrap gap-2 mt-4">
						{artifact.tags.map((tag) => (
							<span key={tag} className="rounded-lg border border-black/5 dark:border-white/10 bg-white/50 dark:bg-space-800/50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-slate-500 dark:text-space-400 shadow-sm">
								{tag}
							</span>
						))}
					</div>
				) : null}
			</CardContent>

			<CardFooter className="flex items-center justify-between border-t border-black/5 dark:border-white/10 bg-slate-100/30 dark:bg-space-950/40 px-8 py-4 text-xs font-bold text-slate-400 dark:text-space-500 relative z-10">
				<span className="tracking-wide">{new Date(artifact.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
				<span className="tracking-widest uppercase">{artifact.source === 'document' ? 'Document' : 'Artifact'}</span>
			</CardFooter>
		</Card>
	)
}

export default CollectionCard
