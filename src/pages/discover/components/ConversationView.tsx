import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { HiMiniChevronDown, HiOutlineSparkles } from 'react-icons/hi2'
import type { ActiveStreamState, ChatMessage } from '@/contexts/chat-context-types'
import MarkdownMessage from '@/components/chat/MarkdownMessage'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import MessageItem from './MessageItem'

interface ConversationViewProps {
  messages: ChatMessage[]
  isLoading: boolean
  activeStream: ActiveStreamState | null
}

const STAGE_CONFIG: Record<ActiveStreamState['stage'], { message: string; accent: string }> = {
  pending: {
    message: 'Sending your question to BioQuery…',
    accent: 'bg-biosphere-300',
  },
  thinking: {
    message: 'BioQuery is thinking through the best response.',
    accent: 'bg-biosphere-500',
  },
  responding: {
    message: 'BioQuery is crafting a reply.',
    accent: 'bg-emerald-400',
  },
}

function ActiveThoughtBanner({ activeStream }: { activeStream: ActiveStreamState }) {
  const config = STAGE_CONFIG[activeStream.stage]
  const hasThoughts = activeStream.thoughts.trim().length > 0
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.section
      key="active-thought-banner"
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className="sticky top-0 z-10 rounded-xl border border-scheme-border-subtle bg-scheme-surface/95 px-4 py-4 shadow-lg shadow-black/5 backdrop-blur"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <span className="flex items-center gap-2 text-xs font-medium text-scheme-muted-text">
            <span className={cn('h-2 w-2 rounded-full', config.accent)} />
            Live update
          </span>
          <p className="text-sm text-scheme-text/90">{config.message}</p>
        </div>
        {hasThoughts ? (
          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-scheme-border-subtle bg-scheme-surface text-scheme-muted-text transition hover:text-scheme-text"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Hide model thoughts' : 'Show model thoughts'}
          >
            <HiMiniChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
          </button>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {hasThoughts && isExpanded ? (
          <motion.div
            key="active-thoughts"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 overflow-hidden rounded-lg border border-scheme-border-subtle bg-scheme-surface/90 px-3 py-2"
          >
            <MarkdownMessage content={activeStream.thoughts} className="text-sm italic text-scheme-muted-text/60" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  )
}

function LoadingPlaceholder() {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-3 rounded-2xl bg-scheme-surface/80 px-4 py-2 text-sm text-scheme-muted-text shadow-sm"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-biosphere-500 to-biosphere-600 text-white shadow">
        <HiOutlineSparkles className="h-4 w-4" />
      </div>
      <span>Loading conversation...</span>
    </motion.div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-scheme-border-subtle/60 bg-scheme-surface/70 px-6 py-8 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-biosphere-500/10 text-biosphere-500">
        <HiOutlineSparkles className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-scheme-text">Start the conversation</p>
        <p className="text-sm text-scheme-muted-text">Ask BioQuery about space biology missions, experiments, or datasets.</p>
      </div>
    </div>
  )
}

export function ConversationView({ messages, isLoading, activeStream }: ConversationViewProps) {
  const streamingMessageId = activeStream?.messageId ?? null
  const hasMessages = messages.length > 0
  const showEmptyState = !isLoading && !hasMessages
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const latestAssistantMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const candidate = messages[index]
      if (candidate.sender === 'assistant') {
        return candidate.id
      }
    }
    return null
  }, [messages])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    })

    return () => cancelAnimationFrame(frame)
  }, [messages, activeStream])

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6">
          <AnimatePresence initial={false}>
            {activeStream ? <ActiveThoughtBanner activeStream={activeStream} /> : null}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isActiveStream={streamingMessageId === message.id && activeStream?.chatId === message.chat_id}
                isLatestAssistant={message.id === latestAssistantMessageId}
              />
            ))}
          </AnimatePresence>

          {isLoading && !hasMessages ? <LoadingPlaceholder /> : null}
          {showEmptyState ? <EmptyState /> : null}
          <div ref={bottomRef} data-role="conversation-end" className="h-px w-full" />
        </div>
      </ScrollArea>
    </div>
  )
}

export default ConversationView
