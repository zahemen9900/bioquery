import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  HiMiniStar,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
  HiOutlineCog6Tooth,
  HiOutlinePencilSquare,
  HiOutlineSquares2X2,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineEllipsisHorizontal,
  HiMiniPencilSquare,
  HiMiniTrash,
} from 'react-icons/hi2'

import { useAuth } from '../contexts/auth-context-types'
import { useChat, type ChatSummary } from '../contexts/chat-context-types'
import { AppShellContext, type AppShellContextValue } from '@/contexts/app-shell-context'
import supabase from '@/lib/supabase-client'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/use-theme'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent } from '@/components/ui/sheet'

interface AppLayoutProps {
  children: React.ReactNode
}

const CHAT_SECTIONS: Array<{ label: string; key: 'starredChats' | 'recentChats' }> = [
  { label: 'Starred', key: 'starredChats' },
  { label: 'Recent', key: 'recentChats' },
]

type UserPreferences = Record<string, unknown> & { show_onboarding?: boolean }

const ONBOARDING_SLIDES: Array<{
  id: string
  tag: string
  title: string
  description: string
  points: string[]
  gradient: string
  accent: string
  icon: string
}> = [
    {
      id: 'welcome',
      tag: 'Welcome Aboard',
      title: 'Meet BioQuery, your NASA bioscience copilot',
      description:
        'Ask natural questions and BioQuery will surface grounded answers from curated NASA space biology research.',
      points: ['Natural language search across curated publications', 'Grounded, citation-rich answers in seconds'],
      gradient: 'from-biosphere-500/80 via-cosmic-500/60 to-space-900/80',
      accent: 'text-biosphere-100',
      icon: '🚀',
    },
    {
      id: 'discover',
      tag: 'Discover',
      title: 'Visualize the story within your datasets',
      description:
        'Transform complex experiment results into beautiful visuals and knowledge graphs to share with your crew.',
      points: ['Generate rich charts, comparisons, and timelines', 'Reveal hidden relationships across missions'],
      gradient: 'from-cosmic-500/80 via-biosphere-500/60 to-space-900/70',
      accent: 'text-space-50',
      icon: '📈',
    },
    {
      id: 'build',
      tag: 'Create',
      title: 'Capture insights and craft living research hubs',
      description:
        'Save findings, generate documents, and keep every breakthrough organized so your team can act fast.',
      points: ['One-click document creation with AI assistance', 'Star and revisit chats to track evolving insights'],
      gradient: 'from-biosphere-500/90 via-cosmic-500/70 to-space-900/80',
      accent: 'text-biosphere-50',
      icon: '✨',
    },
  ]

function SidebarChatPill({
  chat,
  isActive,
  collapsed,
  onSelect,
}: {
  chat: ChatSummary
  isActive: boolean
  collapsed: boolean
  onSelect: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [chatNameDraft, setChatNameDraft] = useState(chat.chat_name ?? '')
  const [menuBusy, setMenuBusy] = useState(false)
  const [menuError, setMenuError] = useState<string | null>(null)
  const { renameChat, toggleStar, deleteChat } = useChat()

  const isPersistedChat = Boolean(chat.id && !chat.id.startsWith('temp-'))

  useEffect(() => {
    if (chat.chat_name) {
      setChatNameDraft(chat.chat_name)
    }
  }, [chat.chat_name])

  const handleRenameChat = async () => {
    if (!isPersistedChat) return
    const nextName = chatNameDraft.trim()
    if (nextName === (chat.chat_name?.trim() ?? '')) {
      setMenuOpen(false)
      return
    }
    setMenuBusy(true)
    setMenuError(null)
    const result = await renameChat(chat.id, nextName.length > 0 ? nextName : null)
    if (!result) {
      setMenuError('Could not rename this chat.')
    } else {
      setMenuOpen(false)
    }
    setMenuBusy(false)
  }

  const handleToggleStar = async () => {
    if (!isPersistedChat) return
    setMenuBusy(true)
    setMenuError(null)
    const result = await toggleStar(chat.id, !chat.is_starred)
    if (!result) {
      setMenuError('Updating the star failed.')
    }
    setMenuBusy(false)
  }

  const handleDeleteChat = async () => {
    if (!isPersistedChat) return
    const confirmed = window.confirm('Delete this conversation? This action cannot be undone.')
    if (!confirmed) return
    setMenuBusy(true)
    setMenuError(null)
    const success = await deleteChat(chat.id)
    if (!success) {
      setMenuError('Delete failed. Please try again later.')
    }
    setMenuBusy(false)
  }

  // --- Collapsed pill: a clean, compact avatar with a letter or star ---
  if (collapsed) {
    const initials = chat.chat_name
      ? chat.chat_name.replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase() || '#'
      : '#'
    return (
      <button
        type="button"
        onClick={() => onSelect(chat.id)}
        title={chat.chat_name ?? 'Untitled chat'}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200',
          isActive
            ? 'bg-biosphere-500/20 text-biosphere-500 ring-1 ring-biosphere-500/40 shadow-[0_0_12px_rgba(0,231,179,0.2)]'
            : 'bg-white/10 dark:bg-space-800/60 text-slate-500 dark:text-space-400 hover:bg-white/20 dark:hover:bg-space-700/60 hover:text-slate-700 dark:hover:text-white ring-1 ring-black/5 dark:ring-white/8'
        )}
      >
        {chat.is_starred ? (
          <HiMiniStar className={cn('h-4 w-4', isActive ? 'text-amber-400' : 'text-amber-400/70')} />
        ) : (
          <span className="text-[11px] font-bold leading-none tracking-wide">{initials}</span>
        )}
      </button>
    )
  }

  // --- Expanded pill: full text + hover ellipsis ---
  return (
    <div
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-[0.8rem] px-2.5 py-2 text-left text-sm transition-all duration-300 cursor-pointer',
        isActive
          ? 'bg-biosphere-500/15 text-biosphere-600 dark:text-biosphere-400 ring-1 ring-inset ring-biosphere-500/40 shadow-sm'
          : 'text-slate-600 dark:text-space-300 hover:bg-slate-200/50 dark:hover:bg-space-800/50',
      )}
      onClick={() => {
        onSelect(chat.id)
      }}
      title={chat.chat_name ?? 'Untitled chat'}
    >
      <span
        className={cn(
          'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ring-1 flex-shrink-0',
          isActive
            ? 'bg-white dark:bg-space-800 text-biosphere-600 dark:text-biosphere-400 ring-biosphere-500/20 shadow-sm'
            : 'bg-white/50 dark:bg-space-800/50 text-slate-500 dark:text-space-400 ring-black/5 dark:ring-white/10 group-hover:bg-white dark:group-hover:bg-space-800'
        )}
      >
        {chat.is_starred ? (
          <HiMiniStar className="h-4 w-4 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {chat.chat_name ? chat.chat_name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2) || 'CH' : 'CH'}
          </span>
        )}
      </span>

      {!collapsed && (
        <>
          <span
            className={cn(
              'flex-1 truncate leading-tight transition-colors',
              isActive ? 'font-bold' : 'font-medium group-hover:text-slate-900 dark:group-hover:text-white'
            )}
            style={{ maxWidth: '10.5rem' }}
          >
            {chat.chat_name?.trim() || 'Untitled chat'}
          </span>

          <div
            className={cn(
              'absolute right-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200',
              menuOpen && 'opacity-100'
            )}
            onClick={(e) => e.stopPropagation()} // Stop row click from firing
          >
            <Popover
              open={menuOpen}
              onOpenChange={(open) => {
                setMenuError(null)
                setMenuOpen(open)
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/80 dark:bg-space-800/80 text-slate-400 hover:text-slate-600 dark:hover:text-white backdrop-blur-sm shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-all hover:scale-105 active:scale-95 z-20"
                >
                  <HiOutlineEllipsisHorizontal className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-80 rounded-2xl border-black/5 dark:border-white/10 bg-white/95 dark:bg-space-900/95 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] p-5 z-50">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-space-400">Settings</p>
                    <Input
                      value={chatNameDraft}
                      onChange={(e) => setChatNameDraft(e.target.value)}
                      placeholder="Untitled chat"
                      disabled={!isPersistedChat || menuBusy}
                      className="h-10 border-black/5 dark:border-white/10 bg-slate-50 dark:bg-space-800/50 shadow-inner focus-visible:ring-biosphere-500/50 rounded-xl"
                    />
                    {!isPersistedChat ? (
                      <p className="text-xs text-slate-400">Options unlock once the first assistant reply is saved.</p>
                    ) : null}
                  </div>

                  {menuError ? (
                    <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-500 dark:text-rose-400">{menuError}</p>
                  ) : null}

                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRenameChat}
                      disabled={!isPersistedChat || menuBusy}
                      iconLeft={<HiMiniPencilSquare className="h-4 w-4" />}
                      className="flex-1 rounded-xl bg-slate-100 dark:bg-space-800 hover:bg-slate-200 dark:hover:bg-space-700 text-slate-700 dark:text-space-200"
                    >
                      Save name
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleStar}
                      disabled={!isPersistedChat || menuBusy}
                      iconLeft={chat.is_starred ? <HiMiniStar className="h-4 w-4 text-amber-500" /> : <HiOutlineStar className="h-4 w-4" />}
                      className="flex-1 rounded-xl text-slate-500 dark:text-space-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                    >
                      {chat.is_starred ? 'Unstar' : 'Star'}
                    </Button>
                  </div>

                  <Separator className="bg-black/5 dark:bg-white/10" />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteChat}
                    disabled={!isPersistedChat || menuBusy}
                    iconLeft={<HiMiniTrash className="h-4 w-4 text-rose-500" />}
                    className="w-full justify-start rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                  >
                    Delete conversation
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}
    </div>
  )
}

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuth()
  const {
    starredChats,
    recentChats,
    selectedChatId,
    selectChat,
    createChat,
    chatsLoading,
    reset: resetChatState,
  } = useChat()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [onboardingSaving, setOnboardingSaving] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null)
  const [userSettingsFetched, setUserSettingsFetched] = useState(false)

  const openMobileSidebar = useCallback(() => setSidebarOpen(true), [])
  const closeMobileSidebar = useCallback(() => setSidebarOpen(false), [])
  const toggleMobileSidebar = useCallback(() => setSidebarOpen((prev) => !prev), [])

  const appShellValue = useMemo<AppShellContextValue>(
    () => ({
      isMobileSidebarOpen: sidebarOpen,
      openMobileSidebar,
      closeMobileSidebar,
      toggleMobileSidebar,
    }),
    [closeMobileSidebar, openMobileSidebar, sidebarOpen, toggleMobileSidebar],
  )

  const userName = profile?.nickname?.trim() || profile?.full_name?.trim() || (user?.user_metadata?.full_name as string | undefined)?.trim() || user?.email || 'Explorer'
  const userEmail = profile?.email ?? user?.email ?? 'Signed in'
  const avatarUrl = profile?.avatar_url ?? (user?.user_metadata?.avatar_url as string | undefined) ?? (user?.user_metadata?.picture as string | undefined) ?? undefined

  useEffect(() => {
    if (!user) {
      setOnboardingOpen(false)
      setUserPrefs(null)
      setUserSettingsFetched(false)
      setOnboardingStep(0)
      return
    }

    let active = true

    const evaluateOnboarding = async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('user_prefs')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!active) return

      if (error) {
        console.error('Failed to load user preferences', error)
        setUserSettingsFetched(true)
        return
      }

      const rawPrefs =
        data && data.user_prefs && typeof data.user_prefs === 'object' && !Array.isArray(data.user_prefs)
          ? (data.user_prefs as UserPreferences)
          : ({} as UserPreferences)

      const shouldShow =
        typeof rawPrefs.show_onboarding === 'boolean' ? rawPrefs.show_onboarding : true

      setUserPrefs(rawPrefs)
      setOnboardingStep(0)
      setOnboardingOpen(shouldShow)
      setUserSettingsFetched(true)
    }

    if (!userSettingsFetched) {
      evaluateOnboarding()
    }

    return () => {
      active = false
    }
  }, [user, userSettingsFetched])

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const handleSelectChat = (chatId: string) => {
    selectChat(chatId)
    navigate(`/discover?chat=${chatId}`)
    setSidebarOpen(false)
  }

  const handleCreateChat = async () => {
    const chat = await createChat()
    if (!chat) return

    navigate(`/discover?chat=${chat.id}`)
    setSidebarOpen(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    resetChatState()
    navigate('/auth', { replace: true })
  }

  const handleOnboardingAdvance = async () => {
    if (onboardingStep < ONBOARDING_SLIDES.length - 1) {
      setOnboardingStep((prev) => Math.min(prev + 1, ONBOARDING_SLIDES.length - 1))
      return
    }

    if (!user) {
      setOnboardingOpen(false)
      return
    }

    setOnboardingSaving(true)

    const nextPrefs: UserPreferences = {
      ...(userPrefs ?? {}),
      show_onboarding: false,
    }

    const { error } = await supabase.from('user_settings').upsert(
      {
        user_id: user.id,
        user_prefs: nextPrefs,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

    if (error) {
      console.error('Failed to update onboarding preference', error)
      setOnboardingSaving(false)
      return
    }

    setUserPrefs(nextPrefs)
    setOnboardingOpen(false)
    setOnboardingSaving(false)
  }

  const handleOnboardingBack = () => {
    setOnboardingStep((prev) => Math.max(prev - 1, 0))
  }

  const chatSections = useMemo(
    () => ({
      starredChats,
      recentChats,
    }),
    [recentChats, starredChats],
  )

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex items-center px-4 py-4',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        <Link
          to="/discover"
          className={cn('flex items-center gap-3', collapsed && 'justify-center')}
          onClick={() => setSidebarOpen(false)}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-biosphere-500 to-cosmic-500">
            <span className="text-lg font-bold text-white">B</span>
          </div>
          {!collapsed && <span className="text-xl font-bold text-scheme-text">BioQuery</span>}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex"
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <HiOutlineChevronDoubleRight className="h-5 w-5" /> : <HiOutlineChevronDoubleLeft className="h-5 w-5" />}
        </Button>
      </div>

      <Separator className="mx-4" />

      <div className={cn('flex-1 overflow-hidden px-4 py-5', collapsed && 'px-2')}>
        <div className={cn('flex h-full flex-col gap-6', collapsed && 'items-center gap-4')}>
          <div className="flex w-full flex-col gap-3">
            <Link
              to="/discover"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300',
                location.pathname.startsWith('/discover')
                  ? 'bg-biosphere-500/10 dark:bg-biosphere-500/20 text-biosphere-600 dark:text-biosphere-400 ring-1 ring-inset ring-biosphere-500/30 dark:ring-biosphere-500/50 shadow-[0_0_15px_rgba(0,231,179,0.1)]'
                  : 'text-slate-600 dark:text-space-300 hover:bg-slate-200/50 dark:hover:bg-space-800/50 hover:text-slate-900 dark:hover:text-white',
                collapsed && 'justify-center px-0',
              )}
              title="Discover"
            >
              <HiOutlineSparkles className="h-5 w-5" />
              {!collapsed && <span>Discover</span>}
            </Link>

            <Link
              to="/collections"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300',
                location.pathname === '/collections'
                  ? 'bg-biosphere-500/10 dark:bg-biosphere-500/20 text-biosphere-600 dark:text-biosphere-400 ring-1 ring-inset ring-biosphere-500/30 dark:ring-biosphere-500/50 shadow-[0_0_15px_rgba(0,231,179,0.1)]'
                  : 'text-slate-600 dark:text-space-300 hover:bg-slate-200/50 dark:hover:bg-space-800/50 hover:text-slate-900 dark:hover:text-white',
                collapsed && 'justify-center px-0',
              )}
              title="Collections"
            >
              <HiOutlineSquares2X2 className="h-5 w-5" />
              {!collapsed && <span>Collections</span>}
            </Link>
          </div>

          <div className="w-full space-y-3">
            {!collapsed && <h3 className="px-1 text-sm font-semibold uppercase tracking-wide text-scheme-muted-text">Chats</h3>}
            <Button
              onClick={handleCreateChat}
              iconLeft={<HiOutlinePencilSquare className="h-4 w-4" />}
              className={cn(
                'w-full rounded-lg bg-biosphere-500 text-sm font-bold text-white dark:text-space-900 shadow-[0_0_15px_rgba(0,231,179,0.3)] dark:shadow-neon-teal transition-all duration-300 hover:scale-[1.02] hover:bg-biosphere-600 dark:hover:bg-white active:scale-[0.98]',
                collapsed ? 'h-10 justify-center px-0' : 'h-11',
              )}
              size={collapsed ? 'icon' : 'default'}
              title="Start a new chat"
              aria-label="Start a new chat"
            >
              {collapsed ? <span className="sr-only">New Chat</span> : 'New Chat'}
            </Button>
          </div>

          <ScrollArea className="flex-1 w-full overflow-y-auto pr-1">
            <div className={cn('flex flex-col pb-2', collapsed ? 'gap-2' : 'gap-6')}>
              {CHAT_SECTIONS.map(({ label, key }) => {
                const items = chatSections[key]
                if (!items.length && key === 'starredChats') {
                  return null
                }

                return (
                  <div key={key} className={cn('space-y-3', collapsed && 'flex flex-col items-center gap-1')}>
                    {!collapsed && (
                      <div className="px-1 text-xs font-semibold uppercase tracking-wide text-scheme-muted-text">
                        {label}
                      </div>
                    )}

                    {items.length === 0 && !collapsed && !chatsLoading ? (
                      <div className="rounded-lg border border-dashed border-scheme-border px-4 py-3 text-xs text-scheme-muted-text">
                        Start chatting to see your history here.
                      </div>
                    ) : (
                      <div className={cn(collapsed ? 'flex flex-col items-center gap-1.5' : 'space-y-1.5')}>
                        {items.map((chat: ChatSummary) => {
                          const isActive = chat.id === selectedChatId
                          return (
                            <SidebarChatPill
                              key={chat.id}
                              chat={chat}
                              isActive={isActive}
                              collapsed={collapsed}
                              onSelect={handleSelectChat}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}

              {chatsLoading && (
                <div className="rounded-lg border border-dashed border-scheme-border px-4 py-3 text-xs text-scheme-muted-text">
                  Loading chats…
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="mt-auto p-4">
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn('group flex w-full items-center gap-3 rounded-2xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-space-800/40 p-2 transition-all hover:bg-white/80 dark:hover:bg-space-800/80 hover:shadow-md dark:shadow-none shadow-sm backdrop-blur-md', collapsed && 'justify-center p-2')}>
              <Avatar className="h-10 w-10 ring-2 ring-white/50 dark:ring-space-700/50 shadow-sm transition-all group-hover:ring-biosphere-500/50">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback className="bg-gradient-to-br from-biosphere-500 to-cosmic-500 text-white font-bold">{getInitials(userName)}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 text-left overflow-hidden">
                  <div className="truncate text-sm font-bold text-slate-900 dark:text-white transition-colors group-hover:text-biosphere-600 dark:group-hover:text-biosphere-400">{userName}</div>
                  <div className="truncate text-xs font-medium text-slate-500 dark:text-space-400">{userEmail}</div>
                </div>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-64 mb-2 rounded-2xl border-black/5 dark:border-white/10 bg-white/90 dark:bg-space-900/90 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] p-3">
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-1 pb-1">
                <Avatar className="h-10 w-10 ring-2 ring-biosphere-500/20">
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-biosphere-500 to-cosmic-500 text-white font-bold">{getInitials(userName)}</AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                  <div className="truncate text-sm font-bold text-slate-900 dark:text-white">{userName}</div>
                  <div className="truncate text-xs font-medium text-slate-500 dark:text-space-400 group-hover:text-slate-600 dark:group-hover:text-space-300">{userEmail}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/5 dark:border-white/10">
                <Button variant="ghost" className="h-9 w-full justify-center rounded-xl bg-slate-100/50 dark:bg-space-800/50 text-xs font-semibold text-slate-700 dark:text-space-200 hover:bg-slate-200 focus:bg-slate-200 dark:hover:bg-space-700 dark:focus:bg-space-700 transition-all border border-transparent hover:border-black/5 dark:hover:border-white/5" onClick={() => setSettingsOpen(true)}>
                  <HiOutlineCog6Tooth className="mr-1.5 h-4 w-4" />
                  Settings
                </Button>

                <Button
                  variant="ghost"
                  className="h-9 w-full justify-center rounded-xl bg-red-50/50 dark:bg-red-500/10 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                  onClick={handleSignOut}
                >
                  <HiOutlineArrowRightOnRectangle className="mr-1.5 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )

  return (
    <AppShellContext.Provider value={appShellValue}>
      <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-space-950 transition-colors duration-500">
        <aside
          className={cn(
            'hidden border-r border-black/5 dark:border-white/10 bg-slate-50/70 dark:bg-space-900/40 backdrop-blur-2xl transition-[width] duration-300 ease-in-out md:flex md:flex-col relative z-20',
            sidebarCollapsed ? 'md:w-24' : 'md:w-72',
          )}
        >
          <SidebarContent collapsed={sidebarCollapsed} />
        </aside>

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-80 max-w-full p-0">
            <SidebarContent collapsed={false} />
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-auto">{children}</main>
        </div>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-md border-black/5 dark:border-white/10 bg-white/80 dark:bg-space-900/80 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] rounded-3xl p-6 sm:p-8">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-2xl font-bold font-display text-slate-900 dark:text-white">Settings</DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-space-300">Preferences and account details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-space-400">Account</h3>
                <div className="flex items-center gap-4 rounded-2xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-space-800/40 p-4 shadow-sm backdrop-blur-sm">
                  <Avatar className="h-12 w-12 ring-2 ring-biosphere-500/20 shadow-inner">
                    <AvatarImage src={avatarUrl} alt={userName} />
                    <AvatarFallback className="bg-gradient-to-br from-biosphere-500 to-cosmic-500 text-white font-bold">{getInitials(userName)}</AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <div className="truncate font-bold text-slate-900 dark:text-white">{userName}</div>
                    <div className="truncate text-sm font-medium text-slate-500 dark:text-space-300">{userEmail}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-space-400">Appearance</h3>
                <div className="flex items-center justify-between rounded-2xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-space-800/40 p-2 shadow-sm backdrop-blur-sm">
                  <div className="flex w-full items-center gap-2 p-1 relative">
                    {/* Animated background pill component simulating a segment control */}
                    <div
                      className={cn(
                        "absolute inset-y-1 block w-[calc(50%-0.375rem)] rounded-xl bg-white dark:bg-space-700 shadow-sm transition-all duration-300 ease-out",
                        theme === 'light' ? "left-1" : "left-[calc(50%+0.125rem)]"
                      )}
                    />

                    <button
                      onClick={() => { if (theme !== 'light') toggleTheme() }}
                      className={cn(
                        "relative z-10 flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors",
                        theme === 'light' ? "text-slate-900" : "text-slate-500 hover:text-slate-700 dark:text-space-300 dark:hover:text-white"
                      )}
                    >
                      <span className="text-lg leading-none">☀️</span> Light
                    </button>
                    <button
                      onClick={() => { if (theme !== 'dark') toggleTheme() }}
                      className={cn(
                        "relative z-10 flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors",
                        theme === 'dark' ? "text-white" : "text-slate-500 hover:text-slate-700 dark:text-space-300 dark:hover:text-white"
                      )}
                    >
                      <span className="text-lg leading-none">🌙</span> Dark
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={onboardingOpen} onOpenChange={() => { }}>
          <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
            <div className="grid overflow-hidden rounded-3xl bg-scheme-surface text-scheme-text shadow-xl transition-theme md:grid-cols-[1.15fr_1fr]">
              <div className="flex flex-col justify-between p-8 md:p-10">
                <div>
                  <div className="mb-4 inline-flex items-center rounded-full bg-biosphere-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-biosphere-500">
                    {ONBOARDING_SLIDES[onboardingStep].tag}
                  </div>
                  <h2 className="heading-h3 mb-4 font-bold md:mb-5">
                    {ONBOARDING_SLIDES[onboardingStep].title}
                  </h2>
                  <p className="text-scheme-muted-text mb-6 md:mb-8">
                    {ONBOARDING_SLIDES[onboardingStep].description}
                  </p>
                  <ul className="space-y-3 text-sm text-scheme-text">
                    {ONBOARDING_SLIDES[onboardingStep].points.map((point) => (
                      <li key={point} className="flex items-center gap-3 rounded-2xl bg-scheme-muted/60 px-4 py-3">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-biosphere-500/20 text-biosphere-500">
                          •
                        </span>
                        <span className="leading-snug">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ONBOARDING_SLIDES.map((slide, index) => (
                      <span
                        key={slide.id}
                        className={cn(
                          'h-2.5 w-2.5 rounded-full transition-all duration-300',
                          index === onboardingStep ? 'w-8 bg-biosphere-500' : 'bg-scheme-muted/70',
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOnboardingBack}
                      disabled={onboardingStep === 0 || onboardingSaving}
                    >
                      Back
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleOnboardingAdvance}
                      disabled={onboardingSaving}
                    >
                      {onboardingStep === ONBOARDING_SLIDES.length - 1 ? 'Enter BioQuery' : 'Next'}
                    </Button>
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  'relative flex min-h-[320px] flex-col items-center justify-center gap-6 p-10 text-center text-white',
                  'bg-gradient-to-br',
                  ONBOARDING_SLIDES[onboardingStep].gradient,
                )}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_60%)]" aria-hidden="true" />
                <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-white/10 text-5xl shadow-lg backdrop-blur">
                  {ONBOARDING_SLIDES[onboardingStep].icon}
                </div>
                <div className="relative space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
                    Guided Tour
                  </p>
                  <p className="text-lg font-medium leading-snug text-white">
                    Slide {onboardingStep + 1} of {ONBOARDING_SLIDES.length}
                  </p>
                </div>
                <div className="relative grid w-full grid-cols-3 gap-3 text-left text-xs text-white/80">
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <p className="font-semibold">Search brilliance</p>
                    <p className="mt-1 leading-snug text-white/70">Grounded NASA publications every time you ask a question.</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <p className="font-semibold">Visual insights</p>
                    <p className="mt-1 leading-snug text-white/70">Turn summaries into charts, graphs, and storyboards.</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <p className="font-semibold">Team ready</p>
                    <p className="mt-1 leading-snug text-white/70">Share discoveries, star chats, and stay in sync.</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShellContext.Provider>
  )
}
