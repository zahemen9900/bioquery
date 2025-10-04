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
    <div className="flex h-full flex-1 flex-col bg-scheme-background">
      {/* Compact header only shown in conversation mode */}
      {showConversation && (
        <section className="border-b border-scheme-border/40 bg-scheme-surface/50 px-4 py-3 backdrop-blur-sm">
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
                    className="group inline-flex items-center gap-2 rounded-lg bg-transparent px-2 py-1 text-left text-sm font-medium text-scheme-text transition hover:bg-scheme-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biosphere-500"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    {selectedChat?.is_starred ? (
                      <HiMiniStar className="h-4 w-4 text-amber-400" />
                    ) : (
                      <HiMiniSparkles className="h-4 w-4 text-biosphere-500" />
                    )}
                    <span>{displayChatName}</span>
                    <HiMiniChevronDown className="h-4 w-4 text-scheme-muted-text transition group-hover:text-scheme-text" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-scheme-muted-text">Conversation name</p>
                      <Input
                        value={chatNameDraft}
                        onChange={(event) => setChatNameDraft(event.target.value)}
                        placeholder="Untitled chat"
                        disabled={!isPersistedChat || menuBusy}
                      />
                      {!isPersistedChat ? (
                        <p className="text-xs text-scheme-muted-text/80">Options unlock once the first assistant reply is saved.</p>
                      ) : null}
                    </div>

                    {menuError ? (
                      <p className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">{menuError}</p>
                    ) : null}

                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleRenameChat}
                        disabled={!isPersistedChat || menuBusy}
                        iconLeft={<HiMiniPencilSquare className="h-4 w-4" />}
                      >
                        Save name
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleStar}
                        disabled={!isPersistedChat || menuBusy}
                        iconLeft={selectedChat?.is_starred ? <HiMiniStar className="h-4 w-4 text-amber-400" /> : <HiOutlineStar className="h-4 w-4" />}
                        className="text-xs text-scheme-muted-text hover:text-amber-400"
                      >
                        {selectedChat?.is_starred ? 'Unstar' : 'Star chat'}
                      </Button>
                    </div>

                    <Separator />

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteChat}
                      disabled={!isPersistedChat || deleteBusy}
                      iconLeft={<HiMiniTrash className="h-4 w-4 text-red-400" />}
                      className="w-full justify-start text-xs text-red-400 hover:text-red-300"
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
