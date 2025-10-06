'use client'

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import LoadingScreen from '@/components/LoadingScreen'
import { useAuth } from '@/contexts/auth-context-types'
import supabase from '@/lib/supabase-client'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { session, initialized } = useAuth()

  useEffect(() => {
    if (initialized && session) {
      navigate('/discover', { replace: true })
    }
  }, [initialized, session, navigate])

  useEffect(() => {
    let cancelled = false

    const finalizeSignIn = async () => {
      const { pathname, search, hash } = window.location

      if (hash && hash.includes('access_token')) {
        const fragmentParams = new URLSearchParams(hash.replace(/^#/, ''))
        const accessToken = fragmentParams.get('access_token')
        const refreshToken = fragmentParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            console.error('Failed to store OAuth session from hash', error)
            navigate(`/auth?error=${encodeURIComponent(error.message)}`, { replace: true })
            return
          }
        }

        const cleanUrl = `${pathname}${search}`
        window.history.replaceState({}, document.title, cleanUrl)
      }

      const params = new URLSearchParams(window.location.search)
      const errorDescription = params.get('error_description') ?? params.get('error')

      if (errorDescription) {
        console.error('OAuth callback error', errorDescription)
        navigate(`/auth?error=${encodeURIComponent(errorDescription)}`, { replace: true })
        return
      }

      let currentSession = session

      if (!currentSession) {
        const { data } = await supabase.auth.getSession()
        currentSession = data.session
      }

      if (!currentSession && params.get('code')) {
        const code = params.get('code') as string
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('Failed to exchange auth code', error)
          navigate(`/auth?error=${encodeURIComponent(error.message)}`, { replace: true })
          return
        }

        const { data } = await supabase.auth.getSession()
        currentSession = data.session
      }

      if (cancelled) return

      if (currentSession) {
        navigate('/discover', { replace: true })
      } else {
        navigate('/auth', { replace: true })
      }
    }

    finalizeSignIn()

    return () => {
      cancelled = true
    }
  }, [navigate, session])

  return <LoadingScreen message="Preparing your BioQuery workspace…" />
}
