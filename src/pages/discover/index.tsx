import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { HiMiniSparkles } from 'react-icons/hi2'

import { useChat } from '@/contexts/chat-context-types'
import { Button } from '@/components/ui/button'

import ChatComposer from './components/ChatComposer'
import ConversationView from './components/ConversationView'
import HeroState from './components/HeroState'

export default function DiscoverPage() {
  const {
    selectedChatId,
    selectChat,
    messages,
    messagesLoading,
    sendMessage,
    createChat,
  } = useChat()
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const chatParam = searchParams.get('chat')
    if (chatParam && chatParam !== selectedChatId) {
      selectChat(chatParam)
    }
  }, [searchParams, selectChat, selectedChatId])

  const hasMessages = messages.length > 0
  const showConversation = hasMessages || messagesLoading

  const handleSelectPrompt = (prompt: string) => {
    setInputValue(prompt)
    const composer = document.getElementById('discover-composer') as HTMLTextAreaElement | null
    composer?.focus()
  }

  const handleStartFresh = async () => {
    const chat = await createChat('New exploration')
    if (chat) {
      setSearchParams({ chat: chat.id })
    }
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
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
            <div className="flex items-center gap-2">
              <HiMiniSparkles className="h-4 w-4 text-biosphere-500" />
              <span className="text-sm font-medium text-scheme-text">BioQuery</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-scheme-muted-text hover:text-biosphere-500"
              onClick={handleStartFresh}
            >
              New chat
            </Button>
          </div>
        </section>
      )}

      {/* Main content area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {showConversation ? (
          <ConversationView messages={messages} isLoading={messagesLoading} />
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
