import { useCallback, useEffect, useRef, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast/useToast'
import { useChat, type ChatMessage } from '@/contexts/chat-context-types'
import { cn } from '@/lib/utils'

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
    ? 'bg-scheme-surface/90 text-scheme-text shadow-sm'
    : 'bg-biosphere-500/10 text-scheme-text border border-biosphere-500/20 backdrop-blur-sm'
  const nameLabel = isAssistant ? 'BioQuery' : 'You'
  const timestamp = new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const hasContent = (message.content ?? '').trim().length > 0
  const feedbackState = message.feedback ?? null
  const alwaysShowActions = isAssistant && isLatestAssistant
  const disableFeedback = message.pending || !isAssistant || !message.chat_id
  const showSources = isAssistant && (message.sources?.length ?? 0) > 0
  const { updateMessageFeedback } = useChat()
  const { showToast } = useToast()
  const [copied, setCopied] = useState(false)
  const copyResetRef = useRef<number | null>(null)

  const avatar = isAssistant ? (
    <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-biosphere-500 to-biosphere-600 text-white shadow">
      <HiOutlineSparkles className="h-4 w-4" />
    </div>
  ) : (
    <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary shadow">
      <span className="text-xs font-semibold">You</span>
    </div>
  )

  const handleCopy = useCallback(async () => {
    if (!hasContent) return
    try {
      await navigator.clipboard.writeText(message.content)
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
  }, [hasContent, message.content, copyResetRef])

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
          <details className="group w-full text-sm leading-relaxed text-scheme-muted-text">
            <summary className="flex cursor-pointer select-none items-center gap-2 text-xs font-medium text-scheme-muted-text/80 transition hover:text-scheme-text">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 group-open:bg-emerald-400" />
              <span className="inline-flex items-center gap-1 font-semibold text-scheme-text">
                Model thoughts
                <HiMiniChevronDown className="h-4 w-4 text-scheme-muted-text transition group-open:rotate-180" />
              </span>
            </summary>
            <div className="mt-2 w-full rounded-2xl bg-scheme-surface/80 p-3 text-left shadow-inner">
              <MarkdownMessage content={message.thoughts} className="italic text-scheme-muted-text/60" />
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
          {hasContent ? (
            <MarkdownMessage content={message.content} sources={message.sources} />
          ) : isAssistant ? (
            <div className="flex items-center gap-2 text-sm text-scheme-muted-text">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              Thinking...
            </div>
          ) : null}
        </motion.div>

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
