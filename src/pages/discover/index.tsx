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

import ChatComposer from './components/ChatComposer'
import ConversationView from './components/ConversationView'
import HeroState from './components/HeroState'

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
  const isStreaming = !!activeStream
  const showConversation = hasMessages || messagesLoading || isStreaming
  const isPersistedChat = Boolean(selectedChatId && !selectedChatId.startsWith('temp-'))
  const displayChatName = useMemo(
    () => (selectedChat?.chat_name?.trim() && selectedChat.chat_name.trim().length > 0 ? selectedChat.chat_name.trim() : 'Untitled chat'),
    [selectedChat?.chat_name],
  )

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
      <ChatComposer
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        disabled={submitting}
        placeholder="Ask about space biology, experiments, or mission planning..."
        isHeroMode={!showConversation}
      />
    </div>
  )
}
