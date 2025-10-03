import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSearchParams } from 'react-router-dom'
import {
  HiMiniStar,
  HiOutlineBeaker,
  HiOutlinePaperAirplane,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlinePencilSquare,
  HiOutlineRocketLaunch,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineXMark,
} from 'react-icons/hi2'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useChat } from '@/contexts/chat-context-types'

const SUGGESTIONS = [
  { Icon: HiOutlineBeaker, text: 'Microgravity plant studies' },
  { Icon: HiOutlineRocketLaunch, text: 'Mars mission radiation' },
  { Icon: HiOutlineSparkles, text: 'Cell division in space' },
]

export default function DiscoverPage() {
  const {
    selectedChatId,
    selectedChat,
    selectChat,
    createChat,
    renameChat,
    toggleStarChat,
    sendUserMessage,
    messages,
    messagesLoading,
    chatsLoading,
  } = useChat()

  const [searchParams, setSearchParams] = useSearchParams()
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const chatFromParams = searchParams.get('chat')
    if (chatFromParams && chatFromParams !== selectedChatId) {
      selectChat(chatFromParams)
    }
  }, [searchParams, selectChat, selectedChatId])

  useEffect(() => {
    const chatParam = searchParams.get('chat')
    if (selectedChatId) {
      if (chatParam !== selectedChatId) {
        const next = new URLSearchParams(searchParams)
        next.set('chat', selectedChatId)
        setSearchParams(next, { replace: true })
      }
    } else if (chatParam) {
      const next = new URLSearchParams(searchParams)
      next.delete('chat')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, selectedChatId, setSearchParams])

  useEffect(() => {
    setTitleDraft(selectedChat?.chat_name ?? '')
    setIsRenaming(false)
  }, [selectedChat?.id, selectedChat?.chat_name])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const displayTitle = useMemo(() => {
    if (!selectedChat) return 'Start a new conversation'
    const name = selectedChat.chat_name?.trim()
    if (name && name.length > 0) return name
    return 'Untitled chat'
  }, [selectedChat])

  const subtitle = selectedChat
    ? 'Share mission context, upload files, and BioQuery will guide your exploration.'
    : 'Ask about microgravity, plant growth, and more. Attach papers or notes for richer answers.'

  const handleStartNewChat = async () => {
    const chat = await createChat()
    if (!chat) return
    const next = new URLSearchParams(searchParams)
    next.set('chat', chat.id)
    setSearchParams(next, { replace: true })
  }

  const handleToggleStar = async () => {
    if (!selectedChatId || !selectedChat) return
    await toggleStarChat(selectedChatId, !selectedChat.is_starred)
  }

  const handleRenameSubmit = async () => {
    if (!selectedChatId) return
    const trimmed = titleDraft.trim()
    if (!trimmed || trimmed === selectedChat?.chat_name) {
      setTitleDraft(selectedChat?.chat_name ?? '')
      setIsRenaming(false)
      return
    }
    await renameChat(selectedChatId, trimmed)
    setIsRenaming(false)
  }

  const handleSendMessage = async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isSending) return

    setIsSending(true)
    try {
      let chatId = selectedChatId
      if (!chatId) {
        const chatName = trimmed.slice(0, 80)
        const newChat = await createChat(chatName)
        if (!newChat) return
        chatId = newChat.id
        const next = new URLSearchParams(searchParams)
        next.set('chat', newChat.id)
        setSearchParams(next, { replace: true })
      }

      if (!chatId) return

      await sendUserMessage(chatId, trimmed, attachments.map((file) => file.name))
      setInputValue('')
      setAttachments([])
    } catch (error) {
      console.error('Failed to send message', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleSuggestionClick = (text: string) => {
    setInputValue(text)
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return
    setAttachments(Array.from(files))
    event.target.value = ''
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index))
  }

  const showHero = messages.length === 0 && !messagesLoading

  return (
    <div className="flex h-full flex-col bg-scheme-background">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-scheme-border bg-scheme-surface/80 px-6 py-4 backdrop-blur">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {isRenaming ? (
            <div className="flex max-w-xl items-center gap-2">
              <Input
                autoFocus
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleRenameSubmit()
                  }
                  if (event.key === 'Escape') {
                    setIsRenaming(false)
                    setTitleDraft(selectedChat?.chat_name ?? '')
                  }
                }}
                className="h-10 w-full"
                placeholder="Name this chat"
              />
              <Button variant="ghost" size="sm" onClick={() => setIsRenaming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold text-scheme-text">{displayTitle}</h1>
              {selectedChat && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsRenaming(true)
                      setTitleDraft(selectedChat.chat_name ?? '')
                    }}
                    title="Rename chat"
                    aria-label="Rename chat"
                  >
                    <HiOutlinePencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleStar}
                    title={selectedChat.is_starred ? 'Unstar chat' : 'Star chat'}
                    aria-label={selectedChat.is_starred ? 'Unstar chat' : 'Star chat'}
                  >
                    {selectedChat.is_starred ? (
                      <HiMiniStar className="h-4 w-4 text-biosphere-500" />
                    ) : (
                      <HiOutlineStar className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
            </div>
          )}
          <p className="text-sm text-scheme-muted-text">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            iconLeft={<HiOutlinePencilSquare className="h-4 w-4" />}
            onClick={handleStartNewChat}
            disabled={isSending || chatsLoading}
            title="Start a new chat"
          >
            New Chat
          </Button>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        {showHero ? (
          <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-biosphere-500/10 blur-3xl"
                animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-cosmic-500/10 blur-3xl"
                animate={{ scale: [1, 1.3, 1], x: [0, -50, 0], y: [0, 30, 0] }}
                transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            <div className="relative z-10 w-full max-w-3xl space-y-8 text-center">
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-biosphere-500 to-cosmic-500 shadow-2xl"
                >
                  <HiOutlineSparkles className="h-10 w-10 text-white" />
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-4xl font-bold text-scheme-text md:text-5xl"
                >
                  Discover Space Biology
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="mx-auto max-w-2xl text-lg text-scheme-muted-text"
                >
                  Ask questions about NASA&apos;s biological research in space. Attach mission files or notes so BioQuery can tailor its insights.
                </motion.p>
              </div>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}>
                <Card className="border-2 border-scheme-border bg-scheme-surface/80 p-3 shadow-xl backdrop-blur">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={handleAttachmentClick} title="Attach files">
                      <HiOutlinePlus className="h-5 w-5" />
                    </Button>
                    <Input
                      placeholder="Ask about microgravity, plant growth, radiation effects..."
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      className="flex-1 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isSending}>
                      <HiOutlinePaperAirplane className="h-5 w-5" />
                    </Button>
                  </div>
                  {attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <Badge key={`${file.name}-${index}`} variant="secondary" className="flex items-center gap-2">
                          <span>{file.name}</span>
                          <button type="button" onClick={() => removeAttachment(index)} className="rounded-full p-1 hover:bg-scheme-muted">
                            <HiOutlineXMark className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex flex-wrap justify-center gap-2"
              >
                {SUGGESTIONS.map(({ Icon, text }) => (
                  <button
                    key={text}
                    onClick={() => handleSuggestionClick(text)}
                    className="group flex items-center gap-2 rounded-full border border-scheme-border bg-scheme-surface px-4 py-2 text-sm font-medium text-scheme-text transition-all hover:border-biosphere-500 hover:bg-biosphere-500/10"
                  >
                    <Icon className="h-4 w-4 text-scheme-muted-text group-hover:text-biosphere-500" />
                    <span>{text}</span>
                  </button>
                ))}
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="mx-auto max-w-4xl space-y-6">
                <AnimatePresence mode="popLayout">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'}
                    >
                      {message.sender === 'assistant' ? (
                        <Card className="max-w-3xl space-y-3 bg-scheme-surface p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-biosphere-500 to-cosmic-500">
                              <HiOutlineSparkles className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <p className="text-sm leading-relaxed text-scheme-text">{message.content}</p>
                              {message.attached_files.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {message.attached_files.map((file, index) => (
                                    <Badge key={`${message.id}-attachment-${index}`} variant="secondary" className="text-xs">
                                      {file}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ) : (
                        <div className="max-w-2xl space-y-2 rounded-2xl bg-biosphere-500 px-4 py-3 text-white shadow-lg">
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          {message.attached_files.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {message.attached_files.map((file, index) => (
                                <Badge key={`${message.id}-user-attachment-${index}`} className="bg-white/20 text-xs text-white">
                                  {file}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {messagesLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <Card className="max-w-3xl bg-scheme-surface p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-biosphere-500 to-cosmic-500">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                              <HiOutlineSparkles className="h-4 w-4 text-white" />
                            </motion.div>
                          </div>
                          <div className="flex space-x-1">
                            {[0, 1, 2].map((idx) => (
                              <motion.div
                                key={idx}
                                className="h-2 w-2 rounded-full bg-scheme-muted-text"
                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1, repeat: Infinity, delay: idx * 0.2 }}
                              />
                            ))}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-scheme-border bg-scheme-surface/80 px-4 py-4 backdrop-blur">
              <div className="mx-auto max-w-4xl">
                <Card className="border-2 border-scheme-border bg-scheme-surface p-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleAttachmentClick}
                      title="Attach files"
                      disabled={isSending}
                    >
                      <HiOutlinePlus className="h-5 w-5" />
                    </Button>
                    <Input
                      placeholder="Ask a follow-up question..."
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isSending}>
                      <HiOutlinePaperAirplane className="h-5 w-5" />
                    </Button>
                  </div>
                  {attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <Badge key={`${file.name}-${index}`} variant="secondary" className="flex items-center gap-2">
                          <span>{file.name}</span>
                          <button type="button" onClick={() => removeAttachment(index)} className="rounded-full p-1 hover:bg-scheme-muted">
                            <HiOutlineXMark className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
    </div>
  )
}
