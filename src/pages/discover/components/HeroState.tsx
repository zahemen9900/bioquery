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
        <div className="absolute left-[20%] top-[30%] h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-biosphere-500/10 dark:bg-biosphere-500/15 blur-[120px]" />
        <div className="absolute right-[20%] bottom-[30%] h-[400px] w-[400px] translate-x-1/2 rounded-full bg-accent-purple/5 dark:bg-accent-purple/10 blur-[120px]" />
        <div className="absolute inset-0 bg-noise opacity-[0.02] mix-blend-overlay pointer-events-none" />
      </motion.div>

      {/* Hero content */}
      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center mt-[-8vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-biosphere-500/20 to-cosmic-500/20 shadow-[0_0_40px_rgba(0,231,179,0.15)] ring-1 ring-white/10 backdrop-blur-3xl mb-2"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-biosphere-400 to-cosmic-500 shadow-inner">
            <HiSparkles className="h-6 w-6 text-space-900" />
          </div>
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center justify-center gap-3 text-sm font-mono tracking-widest text-slate-500 dark:text-space-400 uppercase"
          >
            <span className="block h-px w-8 bg-slate-300 dark:bg-space-700" />
            <span className="text-biosphere-600 dark:text-biosphere-400 font-bold">SYSTEM READY</span>
            <span className="block h-px w-8 bg-slate-300 dark:bg-space-700" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-display text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight"
          >
            What will we discover today?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto max-w-xl text-lg text-slate-600 dark:text-space-300"
          >
            Query NASA's bioscience corpus. Generate visualizations, extract entities, and accelerate your research.
          </motion.p>
        </div>

        {/* Suggested prompts */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
        >
          {PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSelectPrompt(prompt)}
              className="group relative overflow-hidden flex-1 sm:flex-none text-left rounded-xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-space-800/40 px-5 py-4 text-sm font-medium text-slate-700 dark:text-space-200 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-biosphere-500/50 hover:bg-slate-50 dark:hover:bg-space-800 hover:text-slate-900 dark:hover:text-white hover:shadow-[0_0_20px_rgba(0,231,179,0.15)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-biosphere-500/0 via-biosphere-500/0 to-biosphere-500/10 dark:to-biosphere-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative z-10">{prompt}</span>
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default HeroState
