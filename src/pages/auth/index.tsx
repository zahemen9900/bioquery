'use client'

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HiOutlineLockClosed, HiOutlineSparkles, HiOutlineUser } from 'react-icons/hi2'
import { AnimatePresence, motion } from 'motion/react'

import { SignInForm } from './components/SignInForm'
import { SignUpForm } from './components/SignUpForm'
import { useAuth } from '@/contexts/auth-context-types'

type AuthView = 'sign-in' | 'sign-up'

export default function AuthPage() {
  const [activeView, setActiveView] = useState<AuthView>('sign-in')
  const navigate = useNavigate()
  const { session, initialized } = useAuth()

  useEffect(() => {
    if (initialized && session) {
      navigate('/discover', { replace: true })
    }
  }, [initialized, session, navigate])

  return (
    <div className="relative min-h-screen overflow-hidden bg-scheme-background">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[-10%] top-[-10%] h-[420px] w-[420px] rounded-full bg-biosphere-500/15 blur-3xl dark:bg-biosphere-500/20"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute right-[-15%] top-1/3 h-[380px] w-[380px] rounded-full bg-cosmic-500/15 blur-3xl dark:bg-cosmic-500/20"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          className="absolute bottom-[-20%] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-space-900/40 blur-[130px]"
        />
      </div>

      <div className="flex min-h-screen flex-col px-[5%] py-8 md:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-scheme-text transition-colors hover:text-biosphere-500"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <span>Back home</span>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-scheme-border/50 bg-scheme-surface/50 px-4 py-2 text-xs text-scheme-subtle backdrop-blur-sm md:inline-flex">
            <HiOutlineSparkles className="size-4 text-biosphere-500" />
            <span>Secure access for researchers</span>
          </div>
        </motion.div>

        {/* Main content grid */}
        <div className="mt-10 md:mt-14 grid flex-1 items-center gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
          {/* Left panel - Hero content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden rounded-3xl border border-scheme-border/60 bg-gradient-to-br from-space-900 via-space-950 to-space-900 p-8 lg:p-10 text-white shadow-2xl lg:flex lg:flex-col lg:justify-between lg:min-h-[600px]"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wide backdrop-blur-sm"
              >
                <HiOutlineLockClosed className="size-4 text-biosphere-300" />
                Space-grade security
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-3xl md:text-4xl font-bold leading-tight"
              >
                Welcome to the{' '}
                <span className="bg-gradient-to-r from-biosphere-400 to-cosmic-400 bg-clip-text text-transparent">
                  BioQuery Console
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="max-w-md text-base text-white/80 leading-relaxed"
              >
                Sign in to continue exploring NASA bioscience archives, collaborate with your team, and turn discoveries into actionable insights.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="space-y-3"
            >
              <FeatureCard
                icon={<HiOutlineUser className="size-5 text-biosphere-200" />}
                title="Single workspace identity"
                description="Your conversations, artifacts, and dashboards stay in sync across devices."
                gradient="bg-biosphere-500/20"
              />
              <FeatureCard
                icon={<HiOutlineSparkles className="size-5 text-cosmic-200" />}
                title="AI copilots included"
                description="Bring BioQuery's copilots into your research chats, summaries, and visualizations."
                gradient="bg-cosmic-500/20"
              />
            </motion.div>
          </motion.div>

          {/* Right panel - Auth forms */}
          <div className="w-full max-w-md mx-auto lg:max-w-none">
            <AnimatePresence mode="wait">
              {activeView === 'sign-in' ? (
                <SignInForm key="sign-in" onSwitchToSignUp={() => setActiveView('sign-up')} />
              ) : (
                <SignUpForm key="sign-up" onSwitchToSignIn={() => setActiveView('sign-in')} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 4 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 rounded-xl bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/10"
    >
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${gradient}`}>
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs leading-relaxed text-white/70">{description}</p>
      </div>
    </motion.div>
  )
}
