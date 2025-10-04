import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

type UserProfile = {
  id: string
  email: string
  full_name: string | null
  nickname: string | null
  avatar_url: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  initialized: boolean
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export type { UserProfile }
