import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { HiMiniCheck, HiMiniPlus, HiOutlineInformationCircle, HiOutlinePaperAirplane } from 'react-icons/hi2'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useChat, type ToolMode } from '@/contexts/chat-context-types'
import { cn } from '@/lib/utils'

type ChatComposerProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
  isHeroMode?: boolean
}

const MODE_OPTIONS: Array<{ id: ToolMode; label: string }> = [
  { id: 'research-tools', label: 'Research tools' },
  { id: 'web-search', label: 'Web search' },
]

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder,
  isHeroMode = false,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showModeInfo, setShowModeInfo] = useState(false)
  const { toolMode, setToolMode } = useChat()

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value)
    const textarea = event.target
    textarea.style.height = 'auto'
    const newHeight = Math.min(textarea.scrollHeight, 7 * 24)
    textarea.style.height = `${newHeight}px`
  }

  const handleAttach = () => {
    setShowAttachmentPreview(true)
    textareaRef.current?.focus()
    setMenuOpen(false)
    setShowModeInfo(false)
  }

  const handleSelectMode = (mode: ToolMode) => {
    if (mode !== toolMode) {
      setToolMode(mode)
    }
    setMenuOpen(false)
    setShowModeInfo(false)
    textareaRef.current?.focus()
  }

  return (
    <div
      className={cn(
        'w-full px-4 transition-all duration-300',
        isHeroMode ? 'pb-12' : 'border-t border-scheme-border/30 bg-scheme-surface/80 py-4 backdrop-blur-sm',
      )}
    >
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-3xl">
        <div
          className={cn(
            'group relative flex items-center gap-2 rounded-2xl border bg-scheme-surface shadow-lg transition-all',
            isHeroMode
              ? 'border-scheme-border/50 p-2 shadow-2xl focus-within:border-biosphere-500/50 focus-within:shadow-biosphere-500/20'
              : 'border-scheme-border/40 p-1.5 focus-within:border-biosphere-500/40',
          )}
        >
          <Popover
            open={menuOpen && !disabled}
            onOpenChange={(next) => {
              if (disabled) return
              setMenuOpen(next)
              if (!next) {
                setShowModeInfo(false)
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  'shrink-0 rounded-xl text-scheme-muted-text transition hover:text-scheme-text',
                  isHeroMode ? 'h-12 w-12' : 'h-10 w-10',
                )}
                aria-label="Open quick actions"
                disabled={disabled}
              >
                <HiMiniPlus className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="top">
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-scheme-muted-text/80">Quick actions</p>
                  <button
                    type="button"
                    onClick={handleAttach}
                    className="mt-2 flex w-full items-center justify-between rounded-xl border border-scheme-border/40 bg-scheme-surface/70 px-3 py-2 text-left font-medium text-scheme-text transition hover:border-biosphere-500/60 hover:text-biosphere-200"
                  >
                    <span>Attach files</span>
                    <HiMiniPlus className="h-4 w-4" />
                  </button>
                </div>

                <div className="rounded-2xl border border-scheme-border/40 bg-scheme-surface/70 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-scheme-muted-text/80">Response mode</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-medium text-biosphere-200 transition hover:text-biosphere-100"
                      onClick={() => setShowModeInfo((prev) => !prev)}
                    >
                      <HiOutlineInformationCircle className="h-4 w-4" />
                      What’s the difference?
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {MODE_OPTIONS.map((option) => {
                      const isActive = option.id === toolMode
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleSelectMode(option.id)}
                          className={cn(
                            'flex items-center justify-between rounded-xl border px-3 py-2 text-left transition',
                            isActive
                              ? 'border-biosphere-500/60 bg-biosphere-500/15 text-biosphere-100'
                              : 'border-scheme-border/40 text-scheme-text hover:border-biosphere-500/40 hover:text-biosphere-100',
                          )}
                        >
                          <span>{option.label}</span>
                          {isActive ? <HiMiniCheck className="h-4 w-4" /> : null}
                        </button>
                      )
                    })}
                  </div>
                  <AnimatePresence initial={false}>
                    {showModeInfo ? (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 text-xs leading-relaxed text-scheme-muted-text"
                      >
                        Research tools mode keeps the assistant grounded in NASA’s curated knowledge base and enables structured
                        artifacts. Web search mode prioritizes live results via Google Search and URL context for broader coverage.
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Textarea
            id="discover-composer"
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className={cn(
              'max-h-[168px] min-h-[52px] flex-1 resize-none border-0 bg-transparent px-4 py-3 text-base text-scheme-text placeholder:text-scheme-muted-text focus-visible:outline-none focus-visible:ring-0',
              'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-scheme-border/50',
            )}
            disabled={disabled}
          />

          <Button
            type="button"
            size="icon"
            className={cn(
              'shrink-0 rounded-xl transition-all',
              isHeroMode ? 'h-12 w-12' : 'h-10 w-10',
              !value.trim() && 'opacity-50',
            )}
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
          >
            <HiOutlinePaperAirplane className="h-5 w-5" />
          </Button>
        </div>

        <AnimatePresence>
          {showAttachmentPreview ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-3 rounded-xl border border-dashed border-scheme-border/60 bg-scheme-surface/70 px-4 py-3 text-sm text-scheme-muted-text"
            >
              Attachment previews will appear here. File uploads are coming soon.
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!isHeroMode ? (
          <div className="mt-2 flex items-center justify-between px-2 text-xs text-scheme-muted-text">
            <span>
              Press{' '}
              <kbd className="rounded border border-scheme-border/50 bg-scheme-surface px-1.5 py-0.5 font-mono">Shift + Enter</kbd> for new
              line
            </span>
            <span className="flex items-center gap-3">
              <span className="rounded-full border border-scheme-border/40 bg-scheme-surface/60 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-scheme-muted-text/90">
                Mode: {toolMode === 'web-search' ? 'Web search' : 'Research tools'}
              </span>
              {value.length > 0 ? <span>{value.length} characters</span> : null}
            </span>
          </div>
        ) : null}
      </motion.div>
    </div>
  )
}

export default ChatComposer
