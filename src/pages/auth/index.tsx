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
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-space-900 transition-colors duration-500">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-biosphere-500/10 blur-[180px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-purple/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-noise opacity-[0.02] mix-blend-overlay pointer-events-none"></div>

      {/* Animated gradient blobs (subtle) */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[10%] top-[20%] h-[300px] w-[300px] rounded-full bg-biosphere-500/5 blur-3xl dark:bg-biosphere-500/10"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute right-[20%] top-1/4 h-[350px] w-[350px] rounded-full bg-accent-purple/5 blur-3xl dark:bg-accent-purple/10"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-accent-blue/5 blur-3xl dark:bg-accent-blue/10"
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col px-[5%] py-8 md:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-space-200 transition-colors hover:text-biosphere-600 dark:hover:text-biosphere-400"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <span>Back home</span>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-black/5 dark:border-white/10 bg-white/60 dark:bg-space-800/40 px-4 py-2 text-xs text-slate-600 dark:text-space-200 backdrop-blur-md md:inline-flex shadow-sm transition-colors duration-500">
            <HiOutlineSparkles className="size-4 text-biosphere-600 dark:text-biosphere-400" />
            <span className="font-medium tracking-wide">Secure access for researchers</span>
          </div>
        </motion.div>

        {/* Main content grid */}
        <div className="mt-10 md:mt-14 grid flex-1 items-center gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
          {/* Left panel - Hero content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group relative hidden rounded-[2.5rem] border border-black/5 dark:border-white/10 bg-slate-100/50 dark:bg-space-800/30 p-8 lg:p-12 shadow-[0_20px_40px_rgba(0,0,0,0.05)] dark:shadow-2xl backdrop-blur-xl lg:flex lg:flex-col lg:justify-between lg:min-h-[600px] overflow-hidden transition-colors duration-500"
          >
            <div className="absolute inset-0 bg-glass-gradient opacity-0 dark:opacity-10 group-hover:opacity-100 dark:group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" />
            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

            <div className="relative z-10 space-y-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 py-1.5 px-4 shadow-sm dark:shadow-glass-sm backdrop-blur-md"
              >
                <HiOutlineLockClosed className="size-4 text-biosphere-600 dark:text-biosphere-400" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-space-100">Space-grade security</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="font-display text-4xl md:text-5xl font-bold leading-tight text-slate-900 dark:text-white transition-colors duration-500"
              >
                Welcome to the{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-biosphere-600 to-accent-blue dark:from-biosphere-400 dark:to-accent-blue drop-shadow-sm">
                  BioQuery Console
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="max-w-md text-lg text-slate-600 dark:text-space-200 leading-relaxed transition-colors duration-500"
              >
                Sign in to continue exploring NASA bioscience archives, collaborate with your team, and turn discoveries into actionable insights.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="relative z-10 space-y-4"
            >
              <FeatureCard
                icon={<HiOutlineUser className="size-5 text-biosphere-600 dark:text-biosphere-400" />}
                title="Single workspace identity"
                description="Your conversations, artifacts, and dashboards stay in sync across devices."
                containerClass="bg-white/60 dark:bg-white/5 shadow-sm dark:shadow-glass-sm"
                iconBg="bg-biosphere-500/10 dark:bg-biosphere-500/20"
              />
              <FeatureCard
                icon={<HiOutlineSparkles className="size-5 text-purple-600 dark:text-accent-purple" />}
                title="AI copilots included"
                description="Bring BioQuery's copilots into your research chats, summaries, and visualizations."
                containerClass="bg-white/60 dark:bg-white/5 shadow-sm dark:shadow-glass-sm"
                iconBg="bg-purple-500/10 dark:bg-accent-purple/20"
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
  containerClass,
  iconBg,
}: {
  icon: React.ReactNode
  title: string
  description: string
  containerClass: string
  iconBg: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 4 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-4 rounded-[1.5rem] border border-black/5 dark:border-white/10 p-5 backdrop-blur-md transition-colors ${containerClass} hover:bg-white/80 dark:hover:bg-white/10`}
    >
      <div className={`flex size-12 shrink-0 items-center justify-center rounded-[1rem] ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 space-y-1.5">
        <p className="font-bold text-slate-900 dark:text-white transition-colors duration-500">{title}</p>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-space-200 transition-colors duration-500">{description}</p>
      </div>
    </motion.div>
  )
}
