import { useCallback, useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabase-client'
import { AuthContext, type AuthContextValue, type UserProfile } from './auth-context-types'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthContextValue['session']>(null)
  const [user, setUser] = useState<AuthContextValue['user']>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      setLoading(true)
      const { data } = await supabase.auth.getSession()
      if (!active) return

      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
      setInitialized(true)
    }

    bootstrap()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)
      setInitialized(true)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }

    let aborted = false

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, nickname, avatar_url, last_login_at, created_at, updated_at')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Failed to fetch profile', error)
        return
      }

      if (!aborted) {
          setProfile((data as UserProfile | null) ?? null)
      }
    }

    fetchProfile()

    return () => {
      aborted = true
    }
  }, [user])

  const refreshProfile = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, nickname, avatar_url, last_login_at, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Failed to refresh profile', error)
      return
    }

    setProfile((data as UserProfile | null) ?? null)
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, session, loading, initialized, refreshProfile }),
    [initialized, loading, profile, refreshProfile, session, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
