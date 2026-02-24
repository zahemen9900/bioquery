'use client'

import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import {
  HiArrowRight,
  HiCheckCircle,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiXCircle,
} from 'react-icons/hi2'
import { motion, AnimatePresence } from 'motion/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import supabase from '@/lib/supabase-client'

type AuthStatus = { type: 'idle' | 'error' | 'success'; message: string }
type PasswordStrength = { score: number; label: string; color: string }

const initialStatus: AuthStatus = { type: 'idle', message: '' }

const passwordScore = (value: string): PasswordStrength => {
  if (!value) return { score: 0, label: 'Start typing', color: 'from-gray-500 to-gray-400' }

  let score = 0
  const patterns = [/[a-z]/, /[A-Z]/, /\d/, /[^\w\s]/]
  patterns.forEach((pattern) => { if (pattern.test(value)) score += 1 })

  if (value.length >= 12) score += 1
  else if (value.length >= 8) score += 0.5

  const normalized = Math.min(score, 4)

  if (normalized >= 3.5) return { score: normalized, label: 'Excellent', color: 'from-emerald-400 to-biosphere-500' }
  if (normalized >= 2.5) return { score: normalized, label: 'Strong', color: 'from-lime-400 to-emerald-400' }
  if (normalized >= 1.5) return { score: normalized, label: 'Fair', color: 'from-amber-400 to-lime-400' }
  return { score: normalized, label: 'Weak', color: 'from-rose-500 to-orange-500' }
}

export function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [status, setStatus] = useState<AuthStatus>(initialStatus)
  const [loading, setLoading] = useState(false)

  const strength = useMemo(() => passwordScore(formData.password), [formData.password])
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(initialStatus)

    if (formData.password !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' })
      return
    }

    if (strength.score < 2) {
      setStatus({ type: 'error', message: 'Please choose a stronger password.' })
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { full_name: formData.fullName } },
    })

    if (error) {
      setStatus({ type: 'error', message: error.message })
      setLoading(false)
      return
    }

    setStatus({ type: 'success', message: '🎉 Account created! Check your inbox to verify your email.' })
    setFormData({ fullName: '', email: '', password: '', confirmPassword: '' })
    setLoading(false)
    setTimeout(() => onSwitchToSignIn(), 2500)
  }

  const handleGoogleSignUp = async () => {
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
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <CardTitle className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors duration-500">
              Create your account
            </CardTitle>
          </motion.div>
          <CardDescription className="text-base text-slate-600 dark:text-space-200 transition-colors duration-500">
            Join the next generation of space researchers
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="sign-up-name" className="text-slate-700 dark:text-space-100 font-semibold transition-colors duration-500">
                Full name
              </Label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400 dark:text-space-400" />
                <Input
                  id="sign-up-name"
                  autoComplete="name"
                  placeholder="Dr. Jane Smith"
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="pl-10 h-11 bg-slate-50 dark:bg-space-900/50 border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-space-400 focus:border-biosphere-500 dark:focus:border-biosphere-500 transition-colors duration-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sign-up-email" className="text-slate-700 dark:text-space-100 font-semibold transition-colors duration-500">
                Email address
              </Label>
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400 dark:text-space-400" />
                <Input
                  id="sign-up-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="researcher@nasa.gov"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="pl-10 h-11 bg-slate-50 dark:bg-space-900/50 border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-space-400 focus:border-biosphere-500 dark:focus:border-biosphere-500 transition-colors duration-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sign-up-password" className="text-slate-700 dark:text-space-100 font-semibold transition-colors duration-500">
                Password
              </Label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400 dark:text-space-400" />
                <Input
                  id="sign-up-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="pl-10 h-11 bg-slate-50 dark:bg-space-900/50 border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-space-400 focus:border-biosphere-500 dark:focus:border-biosphere-500 transition-colors duration-500"
                />
              </div>
              <AnimatePresence>
                {formData.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 pt-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-space-300">Password strength</span>
                      <span className={`font-semibold ${strength.score >= 3 ? 'text-biosphere-500' : 'text-slate-700 dark:text-space-100'}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(strength.score / 4) * 100}%` }}
                        transition={{ duration: 0.3 }}
                        className={`h-full rounded-full bg-gradient-to-r ${strength.color}`}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-space-300">
                      Use 12+ characters with upper & lowercase, numbers, and symbols.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sign-up-confirm" className="text-slate-700 dark:text-space-100 font-semibold transition-colors duration-500">
                Confirm password
              </Label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400 dark:text-space-400" />
                <Input
                  id="sign-up-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Re-type your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="pl-10 pr-10 h-11 bg-slate-50 dark:bg-space-900/50 border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-space-400 focus:border-biosphere-500 dark:focus:border-biosphere-500 transition-colors duration-500"
                />
                <AnimatePresence>
                  {formData.confirmPassword && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {passwordsMatch ? (
                        <HiCheckCircle className="size-5 text-emerald-500" />
                      ) : (
                        <HiXCircle className="size-5 text-rose-500" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-11 bg-biosphere-500 text-white dark:bg-biosphere-500 dark:text-space-900 hover:bg-biosphere-600 dark:hover:bg-white shadow-[0_0_15px_rgba(0,231,179,0.3)] dark:shadow-neon-teal font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading}
              iconRight={<HiArrowRight className="size-5" />}
            >
              {loading ? 'Creating account…' : 'Create account'}
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
            onClick={handleGoogleSignUp}
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
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="font-bold text-biosphere-600 dark:text-biosphere-400 hover:text-biosphere-700 dark:hover:text-biosphere-300 hover:underline transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
