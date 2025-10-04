import { useMemo } from 'react'
import { HiMiniArrowTopRightOnSquare, HiMiniXMark } from 'react-icons/hi2'
import type { GroundingSource } from '@/contexts/chat-context-types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

function extractDomain(url: string | null): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (!trimmed.includes('://')) {
    return trimmed.replace(/^www\./, '')
  }
  try {
    const parsed = new URL(trimmed)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return trimmed
  }
}

function getInitials(value: string | null): string {
  if (!value) return '•'
  const cleaned = value.trim()
  if (!cleaned) return '•'
  const segments = cleaned.split(/[\s._-]+/).filter(Boolean)
  if (segments.length === 0) return cleaned.slice(0, 2).toUpperCase()
  const [first, second] = segments
  if (second) return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase()
  return first.slice(0, 2).toUpperCase()
}

type SourcesButtonProps = {
  sources: GroundingSource[]
  disabled?: boolean
}

export function SourcesButton({ sources, disabled }: SourcesButtonProps) {
  const previewSources = useMemo(() => sources.slice(0, 3), [sources])

  if (sources.length === 0) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-scheme-muted-text transition',
            'hover:bg-scheme-surface/80 hover:text-scheme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-biosphere-400/50',
            disabled && 'pointer-events-none opacity-60',
          )}
        >
          <div className="flex -space-x-2">
            {previewSources.map((source) => {
              const domain = extractDomain(source.domain ?? source.url ?? null)
              return (
                <span
                  key={source.id}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-scheme-border/70 bg-scheme-surface text-[0.6rem] font-semibold text-scheme-muted-text shadow-sm"
                >
                  {source.favicon ? (
                    <img src={source.favicon} alt={domain ?? source.title ?? 'Source favicon'} className="h-full w-full rounded-full object-cover" loading="lazy" />
                  ) : (
                    getInitials(domain ?? source.title ?? null)
                  )}
                </span>
              )
            })}
          </div>
          <span>Sources</span>
        </Button>
      </DialogTrigger>
  <DialogContent className="w-full max-w-xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Sources</DialogTitle>
          <DialogDescription>Evidence referenced in this response.</DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-scheme-surface/80 text-scheme-muted-text transition hover:bg-scheme-surface hover:text-scheme-text"
          >
            <HiMiniXMark className="h-4 w-4" />
          </button>
        </DialogClose>
        <ScrollArea className="mt-4 max-h-[70vh] pr-1">
          <div className="flex flex-col gap-3">
          {sources.map((source) => {
            const domain = extractDomain(source.domain ?? source.url ?? null)
            const firstSnippet = source.supports.find((entry) => (entry.text ?? '').trim().length > 0)?.text?.trim()
            const href = source.url ?? undefined
            const title = source.title?.trim() || domain || href || `Source ${source.id}`

            const cardContent = (
              <div className="flex w-full items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-scheme-border/70 bg-scheme-surface">
                  {source.favicon ? (
                    <img src={source.favicon} alt={domain ?? title} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-sm font-semibold text-scheme-muted-text">{getInitials(domain ?? title)}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-scheme-text">{title}</p>
                    <span className="text-xs font-semibold text-scheme-muted-text/80">#{source.id}</span>
                  </div>
                  {domain ? <p className="text-xs text-scheme-muted-text/80">{domain}</p> : null}
                  {firstSnippet ? (
                    <p className="rounded-xl bg-scheme-surface/80 p-3 text-xs text-scheme-muted-text/90">“{firstSnippet}”</p>
                  ) : null}
                </div>
              </div>
            )

            return href ? (
              <a
                key={source.id}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-scheme-border/70 bg-scheme-surface/60 p-4 text-left transition hover:border-biosphere-500/40 hover:bg-scheme-surface/90"
              >
                {cardContent}
                <span className="flex items-center gap-1 text-xs font-semibold text-biosphere-500 opacity-0 transition group-hover:opacity-100">
                  Visit
                  <HiMiniArrowTopRightOnSquare className="h-4 w-4" />
                </span>
              </a>
            ) : (
              <div
                key={source.id}
                className="flex w-full items-start gap-4 rounded-2xl border border-dashed border-scheme-border/70 bg-scheme-surface/40 p-4"
              >
                {cardContent}
              </div>
            )
          })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default SourcesButton
