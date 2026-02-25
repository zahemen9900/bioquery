import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  HiMiniChevronDown,
  HiMiniBars3CenterLeft,
  HiMiniPencil,
  HiMiniPencilSquare,
  HiMiniSparkles,
  HiMiniStar,
  HiMiniTrash,
  HiOutlineStar,
} from 'react-icons/hi2'

import { useChat } from '@/contexts/chat-context-types'
import { useAppShell } from '@/contexts/app-shell-context'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent } from '@/components/ui/dialog'

import ChatComposer from './components/ChatComposer'
import ConversationView from './components/ConversationView'
import HeroState from './components/HeroState'
import { useUserPreferences } from '@/hooks/use-user-preferences'

export default function DiscoverPage() {
  const {
    selectedChatId,
    selectedChat,
    selectChat,
    messages,
    messagesLoading,
    sendMessage,
    createChat,
    activeStream,
    renameChat,
    toggleStar,
    deleteChat,
  } = useChat()
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [chatNameDraft, setChatNameDraft] = useState('')
  const [menuError, setMenuError] = useState<string | null>(null)
  const [menuBusy, setMenuBusy] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const { openMobileSidebar } = useAppShell()
  const { prefs, updatePrefs } = useUserPreferences()
  const [toolHintVisible, setToolHintVisible] = useState(false)
  const [toolShowcaseOpen, setToolShowcaseOpen] = useState(false)
  const [toolShowcaseStep, setToolShowcaseStep] = useState(0)
  const [toolShowcaseSaving, setToolShowcaseSaving] = useState(false)
  const mobileMenuButtonClasses =
    'md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg bg-scheme-surface/80 text-scheme-text shadow-sm ring-1 ring-inset ring-scheme-border/60 transition hover:text-biosphere-500 hover:ring-biosphere-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biosphere-500/60'

  useEffect(() => {
    const chatParam = searchParams.get('chat')
    if (chatParam && chatParam !== selectedChatId) {
      selectChat(chatParam)
    }
  }, [searchParams, selectChat, selectedChatId])

  useEffect(() => {
    if (selectedChatId) {
      setChatNameDraft(selectedChat?.chat_name ?? '')
    } else {
      setChatNameDraft('')
    }
  }, [selectedChat?.chat_name, selectedChatId])

  const hasMessages = messages.length > 0
  const hasAssistantReply = useMemo(() => messages.some((message) => message.sender === 'assistant'), [messages])
  const isStreaming = !!activeStream
  const showConversation = hasMessages || messagesLoading || isStreaming
  const isPersistedChat = Boolean(selectedChatId && !selectedChatId.startsWith('temp-'))
  const displayChatName = useMemo(
    () => (selectedChat?.chat_name?.trim() && selectedChat.chat_name.trim().length > 0 ? selectedChat.chat_name.trim() : 'Untitled chat'),
    [selectedChat?.chat_name],
  )

  useEffect(() => {
    if (!hasAssistantReply) {
      setToolHintVisible(false)
      return
    }

    const shouldShow = prefs ? (typeof prefs.show_available_tools === 'boolean' ? prefs.show_available_tools : true) : true
    if (shouldShow && !toolShowcaseOpen) {
      setToolHintVisible(true)
    } else if (!shouldShow) {
      setToolHintVisible(false)
    }
  }, [hasAssistantReply, prefs, toolShowcaseOpen])

  const handleSelectPrompt = (prompt: string) => {
    setInputValue(prompt)
    const composer = document.getElementById('discover-composer') as HTMLTextAreaElement | null
    composer?.focus()
  }

  const handleStartFresh = async () => {
    setMenuOpen(false)
    const chat = await createChat('New exploration')
    if (chat) {
      setSearchParams({ chat: chat.id })
    }
  }

  const handleRenameChat = async () => {
    if (!isPersistedChat || !selectedChatId) return
    const nextName = chatNameDraft.trim()

    if (nextName === (selectedChat?.chat_name?.trim() ?? '')) {
      setMenuOpen(false)
      return
    }

    setMenuBusy(true)
    setMenuError(null)

    const result = await renameChat(selectedChatId, nextName.length > 0 ? nextName : null)

    if (!result) {
      setMenuError('We could not rename this chat. Please try again.')
    } else {
      setMenuOpen(false)
    }

    setMenuBusy(false)
  }

  const handleToggleStar = async () => {
    if (!isPersistedChat || !selectedChatId || !selectedChat) return
    setMenuBusy(true)
    setMenuError(null)

    const result = await toggleStar(selectedChatId, !selectedChat.is_starred)

    if (!result) {
      setMenuError('Updating the star failed. Please retry.')
    }

    setMenuBusy(false)
  }

  const handleDeleteChat = async () => {
    if (!isPersistedChat || !selectedChatId) return
    const confirmed = window.confirm('Delete this conversation? This action cannot be undone.')
    if (!confirmed) return

    setDeleteBusy(true)
    setMenuError(null)

    const success = await deleteChat(selectedChatId)

    if (!success) {
      setMenuError('Delete failed. Please try again later.')
      setDeleteBusy(false)
      return
    }

    setDeleteBusy(false)
    setMenuOpen(false)
    setSearchParams({})
  }

  const handleSubmit = async () => {
    if (!inputValue.trim()) return
    setSubmitting(true)
    setError(null)

    const response = await sendMessage(inputValue.trim())
    if (!response) {
      setError('We could not send your question. Please try again.')
    } else {
      setInputValue('')
      setSearchParams({ chat: response.chat_id })
    }

    setSubmitting(false)
  }

  const TOOL_SHOWCASE_SLIDES: Array<{
    id: string
    tag: string
    title: string
    description: string
    example: string
    accent: string
    gradient: string
  }> = [
    {
      id: 'documents',
      tag: 'Document creation',
      title: 'Turn findings into polished reports in seconds',
      description:
        'Let BioQuery draft mission summaries, experiment rundowns, and reference sheets grounded in your conversations.',
      example: '“Create a technical brief summarizing microgravity effects on plant growth with citations.”',
      accent: 'text-biosphere-100',
      gradient: 'from-biosphere-500/80 via-cosmic-500/60 to-space-900/80',
    },
    {
      id: 'timelines',
      tag: 'Timelines & visuals',
      title: 'Map experiments, metrics, and relationships visually',
      description:
        'Ask for charts, timelines, or knowledge graphs to reveal the story behind your datasets and research threads.',
      example: '“Build a timeline of key Artemis plant biology milestones with a short description for each.”',
      accent: 'text-space-50',
      gradient: 'from-cosmic-500/80 via-biosphere-500/60 to-space-900/80',
    },
    {
      id: 'imagery',
      tag: 'Creative assets',
      title: 'Generate concept imagery to explain your insights',
      description:
        'Bring complex bioscience ideas to life with AI-generated visuals you can share with teammates and stakeholders.',
      example: '“Design a widescreen illustration of astronauts tending to a microgravity greenhouse.”',
      accent: 'text-biosphere-100',
      gradient: 'from-biosphere-500/80 via-cosmic-500/50 to-space-900/70',
    },
  ]

  const handleOpenToolShowcase = () => {
    setToolHintVisible(false)
    setToolShowcaseStep(0)
    setToolShowcaseOpen(true)
  }

  const handleAdvanceToolShowcase = async () => {
    if (toolShowcaseStep < TOOL_SHOWCASE_SLIDES.length - 1) {
      setToolShowcaseStep((prev) => Math.min(prev + 1, TOOL_SHOWCASE_SLIDES.length - 1))
      return
    }

    setToolShowcaseSaving(true)
    await updatePrefs({ show_available_tools: false })
    setToolShowcaseSaving(false)
    setToolShowcaseOpen(false)
  }

  const handleBackToolShowcase = () => {
    setToolShowcaseStep((prev) => Math.max(prev - 1, 0))
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-slate-50 dark:bg-space-950 transition-colors duration-500 relative">
      {/* Compact header only shown in conversation mode */}
      {showConversation && (
        <section className="relative z-20 border-b border-black/5 dark:border-white/10 bg-white/40 dark:bg-space-900/40 px-4 py-3 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openMobileSidebar}
                className={mobileMenuButtonClasses}
                aria-label="Open navigation"
              >
                <HiMiniBars3CenterLeft className="h-5 w-5" />
              </button>

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
                    className="group flex items-center gap-2.5 rounded-full border border-black/5 dark:border-white/10 bg-white/60 dark:bg-space-800/60 px-4 py-1.5 text-sm font-semibold text-slate-700 dark:text-space-200 shadow-sm backdrop-blur-md transition-all hover:border-black/10 dark:hover:border-white/20 hover:bg-white/80 dark:hover:bg-space-800/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biosphere-500/50"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    {selectedChat?.is_starred ? (
                      <HiMiniStar className="h-4 w-4 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-transform group-hover:scale-110" />
                    ) : (
                      <HiMiniSparkles className="h-4 w-4 text-biosphere-500 transition-transform group-hover:scale-110" />
                    )}
                    <span className="truncate max-w-[200px] md:max-w-[400px] transition-colors group-hover:text-slate-900 dark:group-hover:text-white">{displayChatName}</span>
                    <HiMiniChevronDown className="h-4 w-4 text-slate-400 dark:text-space-400 transition-all group-hover:text-slate-600 dark:group-hover:text-space-300 group-hover:translate-y-[1px]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 rounded-2xl border-black/5 dark:border-white/10 bg-white/95 dark:bg-space-900/95 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] p-5">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-space-400">Settings</p>
                      <Input
                        value={chatNameDraft}
                        onChange={(event) => setChatNameDraft(event.target.value)}
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
                        iconLeft={selectedChat?.is_starred ? <HiMiniStar className="h-4 w-4 text-amber-500" /> : <HiOutlineStar className="h-4 w-4" />}
                        className="flex-1 rounded-xl text-slate-500 dark:text-space-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                      >
                        {selectedChat?.is_starred ? 'Unstar' : 'Star'}
                      </Button>
                    </div>

                    <Separator className="bg-black/5 dark:bg-white/10" />

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteChat}
                      disabled={!isPersistedChat || deleteBusy}
                      iconLeft={<HiMiniTrash className="h-4 w-4 text-rose-500" />}
                      className="w-full justify-start rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    >
                      Delete conversation
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-scheme-muted-text hover:text-biosphere-500"
              onClick={handleStartFresh}
              iconLeft={<HiMiniPencil className="h-4 w-4" />}
            >
              New chat
            </Button>
          </div>
        </section>
      )}

      {!showConversation && (
        <div className="px-4 pt-4 md:hidden">
          <button
            type="button"
            onClick={openMobileSidebar}
            className={mobileMenuButtonClasses}
            aria-label="Open navigation"
          >
            <HiMiniBars3CenterLeft className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Main content area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {showConversation ? (
          <ConversationView messages={messages} isLoading={messagesLoading && !hasMessages} activeStream={activeStream} />
        ) : (
          <HeroState onSelectPrompt={handleSelectPrompt} />
        )}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-auto w-full max-w-3xl px-4 pb-2"
          >
            <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input composer */}
      <div className="relative">
        <AnimatePresence>
          {toolHintVisible && !toolShowcaseOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-none absolute inset-x-0 -top-14 z-10 flex justify-center px-4"
            >
              <button
                type="button"
                onClick={handleOpenToolShowcase}
                className="pointer-events-auto inline-flex items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-500/15 px-6 py-2 text-sm font-semibold text-emerald-700 shadow-lg backdrop-blur hover:bg-emerald-500/20 dark:text-emerald-100"
              >
                What can BioQuery craft for me?
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <ChatComposer
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          disabled={submitting}
          placeholder="Ask about space biology, experiments, or mission planning..."
          isHeroMode={!showConversation}
        />
      </div>

      <Dialog open={toolShowcaseOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
          <div className="overflow-hidden rounded-3xl bg-scheme-surface text-scheme-text shadow-xl">
            <div className="grid gap-0 md:grid-cols-[1fr_0.85fr]">
              <div className="flex flex-col justify-between p-8 md:p-10">
                <div className="space-y-4">
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                    {TOOL_SHOWCASE_SLIDES[toolShowcaseStep].tag}
                  </span>
                  <h2 className="heading-h3 font-bold">
                    {TOOL_SHOWCASE_SLIDES[toolShowcaseStep].title}
                  </h2>
                  <p className="text-sm leading-relaxed text-scheme-muted-text">
                    {TOOL_SHOWCASE_SLIDES[toolShowcaseStep].description}
                  </p>
                </div>
                <div className="mt-6 space-y-3 rounded-2xl border border-scheme-border/60 bg-scheme-muted/10 p-5 text-sm text-scheme-text/90">
                  <p className="text-xs font-semibold uppercase tracking-wide text-scheme-muted-text/70">Try this</p>
                  <p className="leading-relaxed">{TOOL_SHOWCASE_SLIDES[toolShowcaseStep].example}</p>
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {TOOL_SHOWCASE_SLIDES.map((slide, index) => (
                      <span
                        key={slide.id}
                        className={`h-2.5 rounded-full transition-all ${index === toolShowcaseStep ? 'w-8 bg-emerald-400' : 'w-2.5 bg-scheme-muted/60'}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToolShowcase}
                      disabled={toolShowcaseStep === 0}
                    >
                      Back
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAdvanceToolShowcase}
                      disabled={toolShowcaseSaving}
                    >
                      {toolShowcaseStep === TOOL_SHOWCASE_SLIDES.length - 1 ? 'Start exploring' : 'Next'}
                    </Button>
                  </div>
                </div>
              </div>
              <div
                className={`hidden min-h-[320px] flex-col items-center justify-center gap-6 p-8 text-center text-white md:flex md:p-10 bg-gradient-to-br ${TOOL_SHOWCASE_SLIDES[toolShowcaseStep].gradient}`}
              >
                <div className="rounded-3xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 backdrop-blur">
                  BioQuery tools
                </div>
                <p className="max-w-xs text-sm leading-relaxed text-white/85">
                  Unlock tailored copilots for documents, visuals, and assets—grounded in NASA bioscience knowledge.
                </p>
                <div className="grid w-full gap-3 text-left text-xs text-white/80">
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <p className="font-semibold">Ask anything</p>
                    <p className="mt-1 leading-snug text-white/70">BioQuery stays grounded with contextual search and citations.</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <p className="font-semibold">Build artifacts</p>
                    <p className="mt-1 leading-snug text-white/70">Generate documents, charts, graphs, and timelines on demand.</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <p className="font-semibold">Share fast</p>
                    <p className="mt-1 leading-snug text-white/70">Save outputs to collections and keep your team aligned.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
