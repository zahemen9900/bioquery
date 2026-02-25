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
        'w-full px-4 transition-all duration-300 relative z-30',
        isHeroMode ? 'pb-12' : 'border-t border-black/5 dark:border-white/5 bg-white/40 dark:bg-space-900/40 py-4 backdrop-blur-2xl',
      )}
    >
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-3xl">
        <div
          className={cn(
            'group relative flex items-center gap-2 rounded-[2rem] border transition-all duration-500 backdrop-blur-3xl overflow-hidden',
            isHeroMode
              ? 'border-black/5 dark:border-white/10 bg-white/60 dark:bg-space-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] focus-within:border-biosphere-500/50 focus-within:shadow-[0_0_30px_rgba(0,231,179,0.15)] dark:focus-within:shadow-[0_0_30px_rgba(0,231,179,0.2)] p-2'
              : 'border-black/5 dark:border-white/5 bg-white/70 dark:bg-space-800/60 shadow-sm focus-within:border-biosphere-500/40 focus-within:shadow-[0_0_20px_rgba(0,231,179,0.1)] p-1.5',
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
                  'shrink-0 rounded-full bg-slate-100/50 dark:bg-space-700/50 text-slate-500 dark:text-space-300 transition-all hover:bg-slate-200 dark:hover:bg-space-600 hover:text-slate-900 dark:hover:text-white',
                  isHeroMode ? 'h-12 w-12' : 'h-10 w-10',
                )}
                aria-label="Open quick actions"
                disabled={disabled}
              >
                <HiMiniPlus className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 rounded-3xl border-black/5 dark:border-white/10 bg-white/90 dark:bg-space-900/90 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] p-4" side="top" sideOffset={12}>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-space-400 mb-2 px-1">Quick actions</p>
                  <button
                    type="button"
                    onClick={handleAttach}
                    className="group flex w-full items-center justify-between rounded-2xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-space-800/40 px-4 py-3 text-left font-bold text-slate-700 dark:text-space-200 transition-all hover:bg-white disabled:hover:bg-white/50 dark:hover:bg-space-800 hover:shadow-md dark:shadow-none hover:border-biosphere-500/30"
                  >
                    <span className="group-hover:text-biosphere-600 dark:group-hover:text-biosphere-400 transition-colors">Attach files</span>
                    <HiMiniPlus className="h-5 w-5 text-slate-400 dark:text-space-400 group-hover:text-biosphere-500 transition-colors" />
                  </button>
                </div>

                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-space-800/30 p-1">
                  <div className="flex items-center justify-between px-3 py-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-space-400">Response mode</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-biosphere-600 dark:text-biosphere-400 transition hover:text-biosphere-700 dark:hover:text-biosphere-300"
                      onClick={() => setShowModeInfo((prev) => !prev)}
                    >
                      <HiOutlineInformationCircle className="h-3.5 w-3.5" />
                      Info
                    </button>
                  </div>
                  <div className="grid gap-1 px-1 pb-1">
                    {MODE_OPTIONS.map((option) => {
                      const isActive = option.id === toolMode
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleSelectMode(option.id)}
                          className={cn(
                            'flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all',
                            isActive
                              ? 'bg-biosphere-500 text-white font-bold shadow-[0_0_15px_rgba(0,231,179,0.3)] dark:shadow-neon-teal'
                              : 'text-slate-600 dark:text-space-300 font-medium hover:bg-slate-200/50 dark:hover:bg-space-700/50 hover:text-slate-900 dark:hover:text-white',
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
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-2 px-3 pb-2 text-xs leading-relaxed text-slate-500 dark:text-space-400">
                          <strong className="text-slate-700 dark:text-space-200">Research tools:</strong> Grounded in NASA’s curated knowledge base. Enables structured artifacts.<br />
                          <strong className="text-slate-700 dark:text-space-200 mt-1 block">Web search:</strong> prioritization for live results via Google Search and extended URL context.
                        </p>
                      </motion.div>
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
              'max-h-[168px] min-h-[48px] flex-1 resize-none border-0 bg-transparent px-4 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-space-400 font-medium focus-visible:outline-none focus-visible:ring-0',
              'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-space-700',
            )}
            disabled={disabled}
          />

          <Button
            type="button"
            size="icon"
            className={cn(
              'shrink-0 rounded-[1.25rem] transition-all duration-300',
              isHeroMode ? 'h-12 w-12' : 'h-10 w-10',
              disabled
                ? 'bg-biosphere-500/20 text-biosphere-500 cursor-not-allowed shadow-none'
                : !value.trim()
                  ? 'bg-slate-100 dark:bg-space-800 text-slate-400 dark:text-space-500 hover:bg-slate-200 dark:hover:bg-space-700 hover:text-slate-500 dark:hover:text-space-400'
                  : 'bg-biosphere-500 text-white dark:text-space-900 hover:bg-biosphere-600 dark:hover:bg-white shadow-[0_0_15px_rgba(0,231,179,0.3)] dark:shadow-neon-teal hover:scale-105 active:scale-95',
            )}
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
          >
            {disabled ? (
              <svg className="h-5 w-5 animate-spin drop-shadow-[0_0_8px_rgba(0,231,179,0.8)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <HiOutlinePaperAirplane className={cn("h-5 w-5", value.trim() && "drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]")} />
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showAttachmentPreview ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-4 rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-white/40 dark:bg-space-800/40 backdrop-blur-md px-5 py-4 text-sm font-medium text-slate-500 dark:text-space-400 text-center"
            >
              Attachment previews will appear here. File uploads are coming soon.
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!isHeroMode ? (
          <div className="mt-3 hidden sm:flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-space-500">
            <span>
              Press{' '}
              <kbd className="rounded-md border border-black/10 dark:border-white/10 bg-white/50 dark:bg-space-800/50 px-1.5 py-0.5 font-mono shadow-sm mx-0.5">Shift + Enter</kbd> to newline
            </span>
            <span className="flex items-center gap-3">
              <span className="rounded-full border border-biosphere-500/20 bg-biosphere-500/10 dark:bg-biosphere-500/20 px-2.5 py-1 text-biosphere-600 dark:text-biosphere-400 hover:bg-biosphere-500/20 transition-colors cursor-default">
                Mode: {toolMode === 'web-search' ? 'Web search' : 'Research tools'}
              </span>
            </span>
          </div>
        ) : null}
      </motion.div>
    </div>
  )
}

export default ChatComposer
