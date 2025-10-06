import { HiOutlineBookmark, HiOutlineChartBar, HiOutlineDocumentText, HiOutlineSparkles } from 'react-icons/hi2'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type CollectionKind = 'summary' | 'document' | 'visualization' | 'dataset'

export interface CollectionArtifact {
	id: string
	kind: CollectionKind
	artifactType?: string | null
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
export function CollectionCard({ artifact, onOpen }: { artifact: CollectionArtifact; onOpen?: (artifact: CollectionArtifact) => void }) {
  const badge = TYPE_BADGES[artifact.kind]
  const Icon = badge.icon

  return (
    <button
      type="button"
      onClick={onOpen ? () => onOpen(artifact) : undefined}
      className="group flex h-full flex-col text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biosphere-500/60"
    >
      <Card
        className={cn(
          'flex h-full flex-col overflow-hidden border-scheme-border/40 bg-scheme-surface/85 shadow-xl backdrop-blur transition group-hover:-translate-y-1 group-hover:border-biosphere-500/40 group-hover:shadow-emerald-500/10',
          onOpen && 'cursor-pointer',
        )}
      >
        <CardHeader className="gap-3">
          <div className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', badge.tint)}>
            <Icon className="h-4 w-4" />
            {badge.label}
          </div>
          <CardTitle className="text-lg font-semibold text-scheme-text">
            {artifact.title?.trim() || 'Untitled entry'}
          </CardTitle>
          <CardDescription className="text-xs text-scheme-muted-text">
            {artifact.chatName ? `Captured from “${artifact.chatName}”` : artifact.source === 'document' ? 'Saved document' : 'Generated via Discover'}
          </CardDescription>
        </CardHeader>

        {artifact.previewImageUrl ? (
          <div className="mx-6 h-36 overflow-hidden rounded-2xl border border-scheme-border/50 bg-scheme-muted">
            <img
              src={artifact.previewImageUrl}
              alt={artifact.title ?? 'Collection preview'}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
        ) : null}

        <CardContent className="flex flex-1 flex-col gap-3 text-sm text-scheme-muted-text">
          <div className="line-clamp-4 whitespace-pre-line leading-relaxed text-scheme-text/85">
            {artifact.snippet?.length ? artifact.snippet : 'This entry is ready to revisit when you are.'}
          </div>
          {artifact.tags.length ? (
            <div className="flex flex-wrap gap-1.5">
              {artifact.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-scheme-border/50 px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-scheme-muted-text">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-scheme-border/50 bg-scheme-surface/75 px-6 py-3 text-xs text-scheme-muted-text">
          <span>{new Date(artifact.createdAt).toLocaleString()}</span>
          <span className="text-scheme-muted-text/80">{artifact.source === 'document' ? 'Document' : 'Artifact'}</span>
        </CardFooter>
      </Card>
    </button>
  )
}

export default CollectionCard
