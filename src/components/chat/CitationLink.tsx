import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { HiMiniLink, HiMiniArrowTopRightOnSquare } from 'react-icons/hi2'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { GroundingSource } from '@/contexts/chat-context-types'
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

type CitationLinkProps = {
  source: GroundingSource | null
  href?: string
  label: string
}

export function CitationLink({ source, href, label }: CitationLinkProps) {
  const targetUrl = href ?? source?.url ?? undefined
  const domain = useMemo(() => extractDomain(source?.domain ?? source?.url ?? null), [source])
  const title = source?.title?.trim() || domain || targetUrl || label
  const supportSnippet = source?.supports?.find((entry) => (entry.text ?? '').trim().length > 0)?.text?.trim()
  const displayLabel = useMemo(() => {
    const match = label.match(/\[\[(\d+)\]\]/)
    if (match) {
      return `[${match[1]}]`
    }
    return label
  }, [label])

  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const handleEnter = useCallback(() => {
    clearCloseTimer()
    setOpen(true)
  }, [clearCloseTimer])

  const scheduleClose = useCallback(() => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false)
      closeTimerRef.current = null
    }, 120)
  }, [clearCloseTimer])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLSpanElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        setOpen((prev) => !prev)
      } else if (event.key === 'Escape') {
        setOpen(false)
      }
    },
    [],
  )

  if (!source || !targetUrl) {
    return (
      <span className="inline-flex items-center gap-1 align-middle text-xs font-semibold text-biosphere-500">{displayLabel}</span>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          onMouseEnter={handleEnter}
          onMouseLeave={scheduleClose}
          onFocus={handleEnter}
          onBlur={scheduleClose}
          onKeyDown={handleKeyDown}
          className={cn(
            'inline-flex cursor-pointer items-center gap-1 rounded-full bg-biosphere-500/10 px-2 py-0.5 text-[0.7rem] font-semibold',
            'text-biosphere-500 transition hover:bg-biosphere-500/15 hover:text-biosphere-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-biosphere-400/50',
          )}
          aria-label={`View citation for ${title}`}
          aria-expanded={open}
        >
          <span>{displayLabel}</span>
          <HiMiniLink className="h-3 w-3" />
        </span>
      </PopoverTrigger>
      <PopoverContent onMouseEnter={handleEnter} onMouseLeave={scheduleClose} className="w-80 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-scheme-border/60 bg-scheme-surface">
            {source.favicon ? (
              <img src={source.favicon} alt={domain ?? title} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <span className="text-xs font-semibold text-scheme-muted-text">{getInitials(domain)}</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-sm font-semibold text-scheme-text">{title}</p>
              {domain ? <p className="text-xs text-scheme-muted-text/80">{domain}</p> : null}
            </div>
            {supportSnippet ? (
              <p className="rounded-xl bg-scheme-surface/80 p-2 text-xs text-scheme-muted-text/90">
                “{supportSnippet}”
              </p>
            ) : null}
            <a
              href={targetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-biosphere-500 transition hover:text-biosphere-400"
            >
              Open source
              <HiMiniArrowTopRightOnSquare className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default CitationLink
