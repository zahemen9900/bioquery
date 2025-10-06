import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import supabase from '@/lib/supabase-client'
import { useAuth } from './auth-context-types'

export type UserPreferences = Record<string, unknown> & {
  show_onboarding?: boolean
  auto_summarize?: boolean
  show_available_tools?: boolean
  has_seen_collections?: boolean
}

interface UserPreferencesContextValue {
  prefs: UserPreferences | null
  loading: boolean
  refresh: () => Promise<void>
  updatePrefs: (patch: Partial<UserPreferences>) => Promise<void>
}

export const UserPreferencesContext = createContext<UserPreferencesContextValue | undefined>(undefined)

export const UserPreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setPrefs(null)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('user_settings')
      .select('user_prefs')
      .eq('user_id', user.id)
      .maybeSingle<{ user_prefs: UserPreferences | null }>()

    if (error) {
      console.error('Failed to load user preferences', error)
      setPrefs(null)
      setLoading(false)
      return
    }

    const rawPrefs = data?.user_prefs && typeof data.user_prefs === 'object' ? data.user_prefs : {}
    setPrefs(rawPrefs)
    setLoading(false)
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const updatePrefs = useCallback(
    async (patch: Partial<UserPreferences>) => {
      if (!user) return

      const nextPrefs: UserPreferences = {
        ...(prefs ?? {}),
        ...patch,
      }

      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            user_prefs: nextPrefs,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )

      if (error) {
        console.error('Failed to update user preferences', error)
        return
      }

      setPrefs(nextPrefs)
    },
    [prefs, user],
  )

  const value = useMemo<UserPreferencesContextValue>(
    () => ({ prefs, loading, refresh, updatePrefs }),
    [prefs, loading, refresh, updatePrefs],
  )

  return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>
}
