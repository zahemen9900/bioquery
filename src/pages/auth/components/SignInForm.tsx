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
      <Card className="w-full border-scheme-border/60 bg-scheme-surface/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="space-y-3 text-center">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <CardTitle className="text-3xl font-bold tracking-tight text-scheme-text">
              Welcome back
            </CardTitle>
          </motion.div>
          <CardDescription className="text-base text-scheme-muted">
            Sign in to continue your space biology research
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="sign-in-email" className="text-scheme-text">
                Email address
              </Label>
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-scheme-muted" />
                <Input
                  id="sign-in-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="researcher@bioquery.dev"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sign-in-password" className="text-scheme-text">
                  Password
                </Label>
                <button type="button" className="text-xs font-medium text-biosphere-500 hover:text-biosphere-600 transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-scheme-muted" />
                <Input
                  id="sign-in-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
              iconRight={<HiArrowRight className="size-5" />}
            >
              {loading ? 'Signing in…' : 'Sign in'}
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
            onClick={handleGoogleSignIn}
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
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="font-semibold text-biosphere-500 hover:text-biosphere-600 transition-colors"
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
