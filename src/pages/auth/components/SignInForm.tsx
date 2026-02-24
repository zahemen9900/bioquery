'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import { HiArrowRight, HiOutlineEnvelope, HiOutlineLockClosed } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import supabase from '@/lib/supabase-client'

type AuthStatus = { type: 'idle' | 'error' | 'success'; message: string }

const initialStatus: AuthStatus = { type: 'idle', message: '' }

export function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [status, setStatus] = useState<AuthStatus>(initialStatus)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(initialStatus)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      setStatus({ type: 'error', message: error.message })
      setLoading(false)
      return
    }

    setStatus({ type: 'success', message: 'Welcome back! Redirecting…' })
    setTimeout(() => navigate('/discover'), 800)
  }

  const handleGoogleSignIn = async () => {
    setStatus(initialStatus)
    const origin = window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth` },
    })
    if (error) setStatus({ type: 'error', message: error.message })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="w-full border border-black/5 dark:border-white/10 bg-white/60 dark:bg-space-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl backdrop-blur-xl transition-colors duration-500 overflow-hidden">
        <CardHeader className="space-y-3 text-center pt-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <CardTitle className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors duration-500">
              Welcome back
            </CardTitle>
          </motion.div>
          <CardDescription className="text-base text-slate-600 dark:text-space-200 transition-colors duration-500">
            Sign in to continue your space biology research
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="sign-in-email" className="text-slate-700 dark:text-space-100 font-semibold transition-colors duration-500">
                Email address
              </Label>
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400 dark:text-space-400" />
                <Input
                  id="sign-in-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="researcher@bioquery.dev"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="pl-10 h-11 bg-slate-50 dark:bg-space-900/50 border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-space-400 focus:border-biosphere-500 dark:focus:border-biosphere-500 transition-colors duration-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sign-in-password" className="text-slate-700 dark:text-space-100 font-semibold transition-colors duration-500">
                  Password
                </Label>
                <button type="button" className="text-xs font-semibold text-biosphere-600 dark:text-biosphere-400 hover:text-biosphere-700 dark:hover:text-biosphere-300 transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400 dark:text-space-400" />
                <Input
                  id="sign-in-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="pl-10 h-11 bg-slate-50 dark:bg-space-900/50 border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-space-400 focus:border-biosphere-500 dark:focus:border-biosphere-500 transition-colors duration-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-11 bg-biosphere-500 text-white dark:bg-biosphere-500 dark:text-space-900 hover:bg-biosphere-600 dark:hover:bg-white shadow-[0_0_15px_rgba(0,231,179,0.3)] dark:shadow-neon-teal font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading}
              iconRight={<HiArrowRight className="size-5" />}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="bg-black/10 dark:bg-white/10 transition-colors duration-500" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
              <span className="bg-white dark:bg-space-900 px-3 text-slate-400 dark:text-space-400 rounded-full border border-black/5 dark:border-white/5 transition-colors duration-500">
                or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full h-11 bg-white/50 dark:bg-space-800/50 border border-black/10 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-space-700 text-slate-900 dark:text-white font-semibold transition-colors duration-500"
            onClick={handleGoogleSignIn}
            iconLeft={<FcGoogle className="size-5" />}
          >
            Google
          </Button>

          {status.message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl border px-4 py-3 text-sm font-medium ${status.type === 'error'
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-200'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-200'
                }`}
              role="status"
              aria-live="polite"
            >
              {status.message}
            </motion.div>
          )}

          <div className="text-center pt-2">
            <p className="text-sm text-slate-600 dark:text-space-200 transition-colors duration-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="font-bold text-biosphere-600 dark:text-biosphere-400 hover:text-biosphere-700 dark:hover:text-biosphere-300 hover:underline transition-colors"
              >
                Create one now
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
