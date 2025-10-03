import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import supabase from '@/lib/supabase-client'

import { AuthContext, type AuthContextValue } from './auth-context-types'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const resolveInitialSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return

      setSession(data.session ?? null)
      setLoading(false)
    }

    resolveInitialSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setLoading(false)
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({ session, user: session?.user ?? null, loading }), [session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
