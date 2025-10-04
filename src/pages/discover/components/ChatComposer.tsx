import { useRef } from 'react'
import { HiOutlinePaperAirplane } from 'react-icons/hi2'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type ChatComposerProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
  isHeroMode?: boolean
}

export function ChatComposer({ 
  value, 
  onChange, 
  onSubmit, 
  disabled = false, 
  placeholder,
  isHeroMode = false 
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  // Auto-resize textarea
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value)
    const textarea = event.target
    textarea.style.height = 'auto'
    const newHeight = Math.min(textarea.scrollHeight, 7 * 24) // ~7 lines max
    textarea.style.height = `${newHeight}px`
  }

  return (
    <div className={cn(
      "w-full px-4 transition-all duration-300",
      isHeroMode ? "pb-12" : "border-t border-scheme-border/30 bg-scheme-surface/80 py-4 backdrop-blur-sm"
    )}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-3xl"
      >
        <div className={cn(
          "group relative flex items-center gap-2 rounded-2xl border bg-scheme-surface shadow-lg transition-all",
          isHeroMode 
            ? "border-scheme-border/50 p-2 shadow-2xl focus-within:border-biosphere-500/50 focus-within:shadow-biosphere-500/20" 
            : "border-scheme-border/40 p-1.5 focus-within:border-biosphere-500/40"
        )}>
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
              'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-scheme-border/50'
            )}
            disabled={disabled}
          />
          <Button
            type="button"
            size="icon"
            className={cn(
              "shrink-0 rounded-xl transition-all",
              isHeroMode ? "h-12 w-12" : "h-10 w-10",
              !value.trim() && "opacity-50"
            )}
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
          >
            <HiOutlinePaperAirplane className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Helper text */}
        {!isHeroMode && (
          <div className="mt-2 flex items-center justify-between px-2 text-xs text-scheme-muted-text">
            <span>Press <kbd className="rounded border border-scheme-border/50 bg-scheme-surface px-1.5 py-0.5 font-mono">Shift + Enter</kbd> for new line</span>
            {value.length > 0 && <span>{value.length} characters</span>}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default ChatComposer
