import { HiArrowUpRight, HiOutlineBookmark, HiOutlineChartBar, HiOutlineDocumentText, HiOutlineSparkles } from 'react-icons/hi2'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export type ArtifactKind = 'summary' | 'document' | 'visualization' | 'dataset'

export interface CollectionArtifact {
  id: number
  chat_id: string
  artifact_type: ArtifactKind
  title: string | null
  content: string | null
  preview_image_url: string | null
  metadata: Record<string, unknown>
  created_at: string
  chat_name: string | null
}

const TYPE_BADGES: Record<ArtifactKind, { label: string; icon: typeof HiOutlineBookmark; tint: string }> = {
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

export function CollectionCard({ artifact, onOpen }: { artifact: CollectionArtifact; onOpen: (artifact: CollectionArtifact) => void }) {
  const badge = TYPE_BADGES[artifact.artifact_type]
  const Icon = badge.icon
  const metadataCount = artifact.metadata ? Object.keys(artifact.metadata).length : 0

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-scheme-border/50 bg-scheme-surface/80 shadow-xl backdrop-blur">
      <CardHeader className="gap-3">
        <div className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', badge.tint)}>
          <Icon className="h-4 w-4" />
          {badge.label}
        </div>
        <CardTitle className="text-xl text-scheme-text">
          {artifact.title?.trim() || 'Untitled artifact'}
        </CardTitle>
        <CardDescription className="text-scheme-muted-text">
          {artifact.chat_name ? `Captured from “${artifact.chat_name}”` : 'Generated via Discover'}
        </CardDescription>
      </CardHeader>

      {artifact.preview_image_url ? (
        <div className="mx-6 h-40 overflow-hidden rounded-2xl border border-scheme-border/60 bg-scheme-muted">
          <img
            src={artifact.preview_image_url}
            alt={artifact.title ?? 'Artifact preview'}
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
        </div>
      ) : null}

      <CardContent className="flex flex-1 flex-col gap-3 text-sm text-scheme-subtle">
        <div className="line-clamp-4 whitespace-pre-line leading-relaxed">
          {artifact.content?.slice(0, 480) || 'This artifact is ready for exploration.'}
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex flex-col gap-3 border-t border-scheme-border/60 bg-scheme-surface/70">
        <div className="flex w-full items-center justify-between text-xs text-scheme-muted-text">
          <span>{new Date(artifact.created_at).toLocaleString()}</span>
          <span>{metadataCount > 0 ? `${metadataCount} data points` : 'No metadata yet'}</span>
        </div>
        <Separator className="border-scheme-border/40" />
        <Button
          variant="outline"
          className="w-full rounded-2xl border-biosphere-500/40 text-biosphere-300 hover:-translate-y-0.5"
          iconRight={<HiArrowUpRight className="h-4 w-4" />}
          onClick={() => onOpen(artifact)}
        >
          Open artifact
        </Button>
      </CardFooter>
    </Card>
  )
}

export default CollectionCard
