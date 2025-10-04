import { HiSparkles } from 'react-icons/hi2'
import { motion } from 'motion/react'

type HeroStateProps = {
  onSelectPrompt: (prompt: string) => void
}

const PROMPTS = [
  'What are the biggest knowledge gaps in microgravity plant biology?',
  'Summarize recent findings on astronaut immune system changes.',
  'Show me experiments related to lunar regolith and agriculture.',
]

export function HeroState({ onSelectPrompt }: HeroStateProps) {
  return (
    <div className="relative flex h-full flex-1 flex-col items-center justify-center px-6 pb-24 pt-12">
      {/* Ambient background */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        initial={false}
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-biosphere-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-cosmic-500/5 blur-3xl" />
      </motion.div>

      {/* Hero content */}
      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full border border-biosphere-500/30 bg-biosphere-500/5 px-4 py-1.5 text-sm font-medium text-biosphere-400"
        >
          <HiSparkles className="h-4 w-4" />
          BioQuery Discover
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl text-balance text-5xl font-bold leading-tight tracking-tight text-scheme-text md:text-6xl lg:text-7xl"
        >
          Your AI research assistant for space biology
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl text-balance text-lg text-scheme-muted-text md:text-xl"
        >
          Get instant answers from NASA's bioscience research with citations, summaries, and visualizations.
        </motion.p>

        {/* Suggested prompts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-4 flex flex-wrap items-center justify-center gap-2"
        >
          <span className="text-xs font-medium text-scheme-muted-text">Try asking:</span>
          {PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSelectPrompt(prompt)}
              className="rounded-full border border-scheme-border/50 bg-scheme-surface/50 px-3 py-1.5 text-xs font-medium text-scheme-text transition-all hover:border-biosphere-500/50 hover:bg-biosphere-500/10 hover:text-biosphere-400"
            >
              {prompt}
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default HeroState
