import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import {
  HiMiniCheck,
  HiMiniChevronDown,
  HiOutlineClipboard,
  HiOutlineHandThumbDown,
  HiOutlineHandThumbUp,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import { MarkdownMessage } from '@/components/chat/MarkdownMessage'
import { SourcesButton } from '@/components/chat/SourcesButton'
import ToolCallResults from '@/components/chat/ToolCallResults'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast/useToast'
import { useChat, type ChatMessage } from '@/contexts/chat-context-types'
import { cn } from '@/lib/utils'

type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'tool'; id: number }

const TOOL_MARKER_REGEX = /\[tool:(\d+)\]/g

const parseMessageSegments = (content: string | null | undefined): MessageSegment[] => {
  if (typeof content !== 'string' || content.length === 0) return []
  const segments: MessageSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = TOOL_MARKER_REGEX.exec(content)) !== null) {
    const [fullMatch, idGroup] = match
    const index = match.index
    if (index > lastIndex) {
      const slice = content.slice(lastIndex, index)
      if (slice.trim().length > 0) segments.push({ type: 'text', content: slice })
    }

    const idNumber = Number(idGroup)
    if (Number.isFinite(idNumber)) {
      segments.push({ type: 'tool', id: idNumber })
    }

    lastIndex = index + fullMatch.length
  }

  if (lastIndex < content.length) {
    const slice = content.slice(lastIndex)
    if (slice.trim().length > 0) segments.push({ type: 'text', content: slice })
  }

  return segments
}

const collectToolIds = (message: ChatMessage): number[] => {
  const seen = new Set<number>()
  const ids: number[] = []

  const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : []
  for (const entry of toolCalls) {
    if (!entry || typeof entry !== 'object') continue
    const raw = (entry as Record<string, unknown>).id
    const id = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(id) || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }

  const toolContents = Array.isArray(message.tool_contents) ? message.tool_contents : []
  for (const entry of toolContents) {
    if (!entry || typeof entry !== 'object') continue
    const raw = (entry as Record<string, unknown>).tool_id
    const id = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(id) || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }

  return ids
}

type MessageItemProps = {
  message: ChatMessage
  isActiveStream?: boolean
  isLatestAssistant?: boolean
}

export function MessageItem({ message, isActiveStream = false, isLatestAssistant = false }: MessageItemProps) {
  const isAssistant = message.sender === 'assistant'
  const containerAlignment = isAssistant ? 'justify-start' : 'justify-end'
  const contentAlignment = isAssistant ? 'items-start text-left' : 'items-end text-right'
  const bubbleClass = isAssistant
    ? 'bg-scheme-surface/80 text-scheme-text shadow-sm border border-black/5 dark:border-white/5 backdrop-blur-md'
    : 'bg-gradient-to-br from-biosphere-500/15 to-biosphere-600/5 text-scheme-text border border-biosphere-500/30 backdrop-blur-md shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_10px_rgba(255,255,255,0.02)]'
  const nameLabel = isAssistant ? 'BioQuery' : 'You'
  const timestamp = new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const feedbackState = message.feedback ?? null
  const alwaysShowActions = isAssistant && isLatestAssistant
  const disableFeedback = message.pending || !isAssistant || !message.chat_id
  const showSources = isAssistant && (message.sources?.length ?? 0) > 0
  const { updateMessageFeedback } = useChat()
  const { showToast } = useToast()
  const [copied, setCopied] = useState(false)
  const copyResetRef = useRef<number | null>(null)

  const segments = useMemo(() => parseMessageSegments(message.content), [message.content])
  const firstTextIndex = useMemo(() => segments.findIndex((segment) => segment.type === 'text'), [segments])
  const inlineToolIds = useMemo(
    () =>
      segments
        .filter((segment): segment is Extract<MessageSegment, { type: 'tool' }> => segment.type === 'tool')
        .map((segment) => segment.id),
    [segments],
  )
  const inlineToolIdSet = useMemo(() => new Set(inlineToolIds), [inlineToolIds])
  const remainingToolIds = useMemo(() => {
    const allIds = collectToolIds(message)
    return allIds.filter((id) => !inlineToolIdSet.has(id))
  }, [inlineToolIdSet, message])

  const hasSegments = segments.length > 0
  const hasPlainContent = typeof message.content === 'string' && message.content.trim().length > 0
  const showThinkingPlaceholder = isAssistant && !hasSegments && !hasPlainContent

  const avatar = isAssistant ? (
    <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-biosphere-500 to-space-600 text-white shadow-[0_0_12px_rgba(0,231,179,0.3)] ring-1 ring-biosphere-500/30">
      <HiOutlineSparkles className="h-4 w-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
    </div>
  ) : (
    <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/50 dark:bg-space-800/80 border border-black/10 dark:border-white/10 text-slate-700 dark:text-space-200 shadow-sm backdrop-blur-sm">
      <span className="text-[11px] font-bold tracking-wider">YOU</span>
    </div>
  )

  const handleCopy = useCallback(async () => {
    if (!hasPlainContent) return
    try {
      await navigator.clipboard.writeText(message.content ?? '')
      setCopied(true)
      if (copyResetRef.current) {
        window.clearTimeout(copyResetRef.current)
      }
      copyResetRef.current = window.setTimeout(() => {
        setCopied(false)
        copyResetRef.current = null
      }, 1400)
    } catch (error) {
      console.error('Failed to copy message', error)
    }
  }, [hasPlainContent, message.content])

  const handleFeedback = useCallback(
    async (desired: 'like' | 'dislike') => {
      if (!message.chat_id) return
      const nextState = feedbackState === desired ? null : desired
      const success = await updateMessageFeedback(message.id, message.chat_id, nextState)
      if (success && nextState) {
        showToast('Thanks for your feedback')
      }
    },
    [feedbackState, message.chat_id, message.id, showToast, updateMessageFeedback],
  )

  useEffect(
    () => () => {
      if (copyResetRef.current) {
        window.clearTimeout(copyResetRef.current)
        copyResetRef.current = null
      }
    },
    [],
  )

  return (
    <motion.article
      layout
      transition={{ type: 'spring', stiffness: 280, damping: 30, mass: 0.6 }}
      className={cn('group flex w-full items-start gap-3', containerAlignment)}
      data-role={isAssistant ? 'assistant-message' : 'user-message'}
    >
      {isAssistant ? avatar : null}
      <div
        className={cn('flex w-full max-w-3xl flex-col gap-2', contentAlignment)}
        data-active-stream={isActiveStream ? 'true' : undefined}
      >
        <div
          className={cn(
            'flex items-center gap-2 text-xs font-medium text-scheme-muted-text',
            isAssistant ? 'pl-1' : 'justify-end pr-1',
          )}
        >
          <span className="text-sm font-semibold text-scheme-text">{nameLabel}</span>
          <span className="h-1 w-1 rounded-full bg-scheme-muted-text/40" />
          <time dateTime={message.created_at} className="text-[0.7rem] text-scheme-muted-text/80">
            {timestamp}
          </time>
          {message.pending ? (
            <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[0.65rem] font-medium text-amber-500">
              Pending
            </span>
          ) : null}
        </div>

        {isAssistant && message.thoughts && message.thoughts.trim().length > 0 ? (
          <details className="group w-full text-sm leading-relaxed text-slate-500 dark:text-space-400">
            <summary className="flex cursor-pointer select-none items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-space-400/80 transition hover:text-slate-700 dark:hover:text-space-200">
              <span className="h-2 w-2 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.5)] group-open:bg-biosphere-500/80 group-open:shadow-[0_0_8px_rgba(0,231,179,0.5)] transition-colors" />
              <span className="inline-flex items-center gap-1">
                Model thoughts
                <HiMiniChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </span>
            </summary>
            <div className="mt-3 w-full rounded-2xl border border-black/5 dark:border-white/5 bg-slate-100/50 dark:bg-space-900/50 p-4 text-left shadow-inner backdrop-blur-sm">
              <MarkdownMessage content={message.thoughts} className="italic text-slate-600/90 dark:text-space-300/80 leading-relaxed text-[13px]" />
            </div>
          </details>
        ) : null}

        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 280, damping: 30, mass: 0.6 }}
          className={cn(
            'w-full max-w-2xl rounded-3xl px-4 py-3 text-sm leading-relaxed transition-all',
            bubbleClass,
            isActiveStream && 'ring-2 ring-biosphere-400/40',
          )}
        >
          {hasSegments ? (
            <div className="flex flex-col gap-4">
              {segments.map((segment, index) => {
                if (segment.type === 'text') {
                  const attachSources = index === firstTextIndex
                  return (
                    <MarkdownMessage
                      key={`msg-text-${index}`}
                      content={segment.content}
                      sources={attachSources ? message.sources : undefined}
                    />
                  )
                }

                return <ToolCallResults key={`msg-tool-${segment.id}-${index}`} message={message} toolId={segment.id} />
              })}
            </div>
          ) : showThinkingPlaceholder ? (
            <div className="flex items-center gap-2 text-sm text-scheme-muted-text">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              Thinking...
            </div>
          ) : hasPlainContent ? (
            <MarkdownMessage content={message.content ?? ''} sources={message.sources} />
          ) : null}
        </motion.div>

        {isAssistant && remainingToolIds.length > 0 ? (
          <div className="w-full max-w-2xl">
            <div className="flex flex-col gap-3">
              {remainingToolIds.map((id) => (
                <ToolCallResults key={`msg-tool-remaining-${id}`} message={message} toolId={id} />
              ))}
            </div>
          </div>
        ) : null}

        <div
          className={cn(
            'flex items-center gap-1 text-scheme-muted-text transition',
            isAssistant ? 'pl-1' : 'justify-end pr-1',
            alwaysShowActions
              ? 'opacity-100'
              : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100',
            showSources ? 'w-full pr-1 justify-between' : undefined,
          )}
        >
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-lg text-scheme-muted-text transition hover:bg-scheme-surface/80 hover:text-scheme-text',
                copied && 'text-biosphere-500',
              )}
              onClick={handleCopy}
              title={copied ? 'Copied' : 'Copy message'}
              aria-label={copied ? 'Message copied' : 'Copy message'}
            >
              {copied ? <HiMiniCheck className="h-4 w-4" /> : <HiOutlineClipboard className="h-4 w-4" />}
            </Button>
            {isAssistant ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 rounded-lg text-scheme-muted-text transition hover:bg-scheme-surface/80 hover:text-scheme-text',
                    feedbackState === 'like' && 'bg-biosphere-500/15 text-biosphere-500 hover:text-biosphere-500',
                  )}
                  onClick={() => handleFeedback('like')}
                  title="Like response"
                  aria-label="Like response"
                  aria-pressed={feedbackState === 'like'}
                  disabled={Boolean(disableFeedback)}
                >
                  <HiOutlineHandThumbUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 rounded-lg text-scheme-muted-text transition hover:bg-scheme-surface/80 hover:text-scheme-text',
                    feedbackState === 'dislike' && 'bg-rose-500/15 text-rose-400 hover:text-rose-400',
                  )}
                  onClick={() => handleFeedback('dislike')}
                  title="Dislike response"
                  aria-label="Dislike response"
                  aria-pressed={feedbackState === 'dislike'}
                  disabled={Boolean(disableFeedback)}
                >
                  <HiOutlineHandThumbDown className="h-4 w-4" />
                </Button>
              </>
            ) : null}
          </div>
          {showSources ? <SourcesButton sources={message.sources ?? []} disabled={message.pending} /> : null}
        </div>
      </div>
      {!isAssistant ? avatar : null}
    </motion.article>
  )
}

export default MessageItem
