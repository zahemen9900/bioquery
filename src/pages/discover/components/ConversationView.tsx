import { AnimatePresence, motion } from 'motion/react'
import { HiOutlineSparkles } from 'react-icons/hi2'
import type { ChatMessage } from '@/contexts/chat-context-types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface ConversationViewProps {
  messages: ChatMessage[]
  isLoading: boolean
}

export function ConversationView({ messages, isLoading }: ConversationViewProps) {
  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6">
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const isAssistant = message.sender !== 'user'
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className={cn('flex gap-3', isAssistant ? 'flex-row' : 'flex-row-reverse')}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      isAssistant 
                        ? 'bg-gradient-to-br from-biosphere-500 to-biosphere-600 text-white shadow-md' 
                        : 'bg-scheme-muted text-scheme-text'
                    )}
                  >
                    {isAssistant ? (
                      <HiOutlineSparkles className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-semibold">You</span>
                    )}
                  </div>

                  {/* Message bubble */}
                  <div
                    className={cn(
                      'flex max-w-[75%] flex-col gap-2 rounded-2xl px-4 py-3',
                      isAssistant 
                        ? 'bg-scheme-surface/80 text-scheme-text' 
                        : 'bg-biosphere-500/10 text-scheme-text'
                    )}
                  >
                    <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                      {message.content.trim()}
                    </div>
                    <div className="text-[11px] text-scheme-muted-text">
                      {new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-biosphere-500 to-biosphere-600 text-white shadow-md">
                <HiOutlineSparkles className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-scheme-surface/80 px-4 py-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-biosphere-500 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-biosphere-500 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-biosphere-500" />
                </div>
                <span className="text-sm text-scheme-muted-text">Thinking...</span>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default ConversationView
