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
} from 'react-icons/hi2'

import { useAuth } from '../contexts/auth-context-types'
import { useChat, type ChatSummary } from '../contexts/chat-context-types'
import { AppShellContext, type AppShellContextValue } from '@/contexts/app-shell-context'
import supabase from '@/lib/supabase-client'
import { cn } from '@/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                location.pathname.startsWith('/discover')
                  ? 'bg-biosphere-500/20 text-biosphere-500 shadow-sm'
                  : 'text-scheme-text hover:bg-scheme-muted/70 hover:text-scheme-text',
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
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                location.pathname === '/collections'
                  ? 'bg-biosphere-500/20 text-biosphere-500 shadow-sm'
                  : 'text-scheme-text hover:bg-scheme-muted/70',
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
                'w-full rounded-lg bg-gradient-to-r from-biosphere-500 to-cosmic-500 text-sm font-semibold text-space-900 shadow hover:from-biosphere-500/90 hover:to-cosmic-500/90',
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
            <div className="flex flex-col gap-6 pb-2">
              {CHAT_SECTIONS.map(({ label, key }) => {
                const items = chatSections[key]
                if (!items.length && key === 'starredChats') {
                  return null
                }

                return (
                  <div key={key} className="space-y-3">
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
                      <div className="space-y-1.5">
                        {items.map((chat: ChatSummary) => {
                          const isActive = chat.id === selectedChatId
                          return (
                            <button
                              key={chat.id}
                              type="button"
                              onClick={() => handleSelectChat(chat.id)}
                              className={cn(
                                'group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                                isActive
                                  ? 'bg-biosphere-500/25 text-biosphere-600 ring-1 ring-inset ring-biosphere-500/40'
                                  : 'text-scheme-text hover:bg-scheme-muted/60',
                                collapsed && 'justify-center px-0',
                              )}
                              title={chat.chat_name ?? 'Untitled chat'}
                            >
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-scheme-surface/70 text-scheme-muted-text">
                                {chat.is_starred ? (
                                  <HiMiniStar className="h-4 w-4 text-biosphere-500" />
                                ) : (
                                  <HiOutlineStar className="h-4 w-4" />
                                )}
                              </span>
                              {!collapsed && (
                                <span className="flex-1 truncate font-medium leading-tight" style={{ maxWidth: '10.5rem' }}>
                                  {chat.chat_name?.trim() || 'Untitled chat'}
                                </span>
                              )}
                            </button>
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

      <div className="border-t border-scheme-border p-4">
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-scheme-muted', collapsed && 'justify-center px-0')}>
              <Avatar className="h-9 w-9">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback>{getInitials(userName)}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-scheme-text">{userName}</div>
                  <div className="text-xs text-scheme-muted-text">{userEmail}</div>
                </div>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-64">
            <div className="space-y-2">
              <div className="flex items-center gap-3 pb-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-scheme-text">{userName}</div>
                  <div className="text-xs text-scheme-muted-text">{userEmail}</div>
                </div>
              </div>

              <Separator />

              <Button variant="ghost" className="w-full justify-start" onClick={() => setSettingsOpen(true)}>
                <HiOutlineCog6Tooth className="mr-2 h-4 w-4" />
                Settings
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                onClick={handleSignOut}
              >
                <HiOutlineArrowRightOnRectangle className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )

  return (
    <AppShellContext.Provider value={appShellValue}>
      <div className="flex h-screen overflow-hidden bg-scheme-background">
      <aside
        className={cn(
          'hidden border-r border-scheme-border bg-scheme-surface transition-[width] duration-300 ease-in-out md:flex md:flex-col',
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Manage your account settings and preferences.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Account</h3>
              <p className="text-sm text-scheme-muted-text">Update your account information and preferences.</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Appearance</h3>
              <p className="text-sm text-scheme-muted-text">Customize how BioQuery looks on your device.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={onboardingOpen} onOpenChange={() => {}}>
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
