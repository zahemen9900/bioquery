import { createContext, useContext } from 'react'

type AppShellContextValue = {
  isMobileSidebarOpen: boolean
  openMobileSidebar: () => void
  closeMobileSidebar: () => void
  toggleMobileSidebar: () => void
}

const AppShellContext = createContext<AppShellContextValue | undefined>(undefined)

export function useAppShell(): AppShellContextValue {
  const context = useContext(AppShellContext)
  if (!context) {
    throw new Error('useAppShell must be used within an AppShellProvider')
  }
  return context
}

export { AppShellContext }
export type { AppShellContextValue }
