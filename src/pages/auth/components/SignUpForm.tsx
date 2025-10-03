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
import { useNavigate } from 'react-router-dom'
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
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [status, setStatus] = useState<AuthStatus>(initialStatus)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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

    setStatus({ type: 'success', message: '🎉 Account created! Welcome to BioQuery.' })
    setFormData({ fullName: '', email: '', password: '', confirmPassword: '' })
    setLoading(false)
    setTimeout(() => navigate('/discover'), 1500)
  }

  const handleGoogleSignUp = async () => {
    setStatus(initialStatus)
    const origin = window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth?next=/discover` },
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
      <Card className="w-full border-scheme-border/60 bg-scheme-surface/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="space-y-3 text-center">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <CardTitle className="text-3xl font-bold tracking-tight text-scheme-text">
              Create your account
            </CardTitle>
          </motion.div>
          <CardDescription className="text-base text-scheme-muted">
            Join the next generation of space researchers
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="sign-up-name" className="text-scheme-text">
                Full name
              </Label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-scheme-muted" />
                <Input
                  id="sign-up-name"
                  autoComplete="name"
                  placeholder="Dr. Jane Smith"
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sign-up-email" className="text-scheme-text">
                Email address
              </Label>
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-scheme-muted" />
                <Input
                  id="sign-up-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="researcher@nasa.gov"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sign-up-password" className="text-scheme-text">
                Password
              </Label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-scheme-muted" />
                <Input
                  id="sign-up-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="pl-10"
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
                      <span className="text-scheme-subtle">Password strength</span>
                      <span className={`font-semibold ${strength.score >= 3 ? 'text-emerald-400' : 'text-scheme-text'}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-scheme-border/60">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(strength.score / 4) * 100}%` }}
                        transition={{ duration: 0.3 }}
                        className={`h-full rounded-full bg-gradient-to-r ${strength.color}`}
                      />
                    </div>
                    <p className="text-xs text-scheme-subtle">
                      Use 12+ characters with upper & lowercase, numbers, and symbols.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sign-up-confirm" className="text-scheme-text">
                Confirm password
              </Label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-scheme-muted" />
                <Input
                  id="sign-up-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Re-type your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="pl-10 pr-10"
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
              className="w-full"
              disabled={loading}
              iconRight={<HiArrowRight className="size-5" />}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-scheme-surface px-2 text-scheme-subtle">or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleGoogleSignUp}
            iconLeft={<FcGoogle className="size-5" />}
          >
            Google
          </Button>

          {status.message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg border px-4 py-3 text-sm ${
                status.type === 'error'
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              }`}
              role="status"
              aria-live="polite"
            >
              {status.message}
            </motion.div>
          )}

          <div className="text-center">
            <p className="text-sm text-scheme-subtle">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="font-semibold text-biosphere-500 hover:text-biosphere-600 transition-colors"
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
