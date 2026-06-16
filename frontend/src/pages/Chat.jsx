import { useState, useRef, useEffect } from 'react'
import {
  Send,
  User,
  TrendingUp,
  Package,
  Wallet,
  AlertTriangle,
  Receipt,
  MessageCircle,
  Mic,
  Type,
} from 'lucide-react'
import { chatAPI } from '../services/api'
import VoiceChat from '../components/VoiceChat'

const SUGGESTIONS = [
  { text: 'Who owes me the most money?', icon: Wallet },
  { text: 'Am I profitable this month?', icon: TrendingUp },
  { text: 'What are my top selling products?', icon: Package },
  { text: 'How much cash do I have available?', icon: Receipt },
  { text: 'Which products are low on stock?', icon: AlertTriangle },
  { text: 'What are my biggest expenses?', icon: Receipt },
]

const WELCOME =
  "Hello! I'm Mumu, your business assistant. I have access to your real-time sales, inventory, and finance data — ask me anything."

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="mumu-typing-dot h-2 w-2 rounded-full bg-primary-500"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <span className="text-sm text-gray-500">Mumu is typing…</span>
    </div>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isError = message.isError

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100">
          <User className="h-4 w-4 text-primary-700" />
        </div>
      )}

      <div
        className={`max-w-[min(100%,36rem)] ${
          isUser ? 'items-end ml-auto' : 'items-start'
        } flex flex-col gap-1`}
      >
        {!isUser && (
          <span className="px-1 text-xs font-medium text-primary-700">Mumu</span>
        )}
        <div
          className={`px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'rounded-2xl rounded-tr-md bg-primary-600 text-white shadow-sm shadow-primary-600/15'
              : isError
              ? 'rounded-2xl rounded-tl-md border border-red-200 bg-red-50 text-red-800'
              : 'rounded-2xl rounded-tl-md border border-gray-100 bg-white text-gray-800 shadow-sm'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatMode, setChatMode] = useState('text') // 'text' or 'voice'
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const showSuggestions = messages.length === 1 && !loading

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const buildConversationContext = (chatMessages) =>
    chatMessages
      .filter((message) => !message.isError)
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .filter((message) => message.content !== WELCOME)
      .map((message) => ({ role: message.role, content: message.content }))

  const sendMessage = async (text) => {
    const userMessage = text.trim()
    if (!userMessage || loading) return

    const nextMessages = [...messages, { role: 'user', content: userMessage }]
    setInput('')
    setMessages(nextMessages)
    setLoading(true)

    try {
      const response = await chatAPI.sendMessage(
        userMessage,
        buildConversationContext(nextMessages),
      )
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.response },
      ])
    } catch (error) {
      const detail = error.response?.data?.error
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          isError: true,
          content:
            typeof detail === 'string'
              ? detail
              : 'Sorry, I could not reach the server. Check that the backend is running and your AI API key is set.',
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7.5rem)] max-w-6xl flex-col">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Mumu</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-100">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              Online
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            AI assistant powered by your live business data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setChatMode('text')}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                chatMode === 'text'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Type className="h-3.5 w-3.5" />
              <span>Text</span>
            </button>
            <button
              onClick={() => setChatMode('voice')}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                chatMode === 'voice'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Voice</span>
            </button>
          </div>
          <div className="hidden items-center gap-2 text-xs text-gray-400 sm:flex">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Sales · Inventory · Credits · Expenses</span>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Suggestions sidebar — desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-gray-900">Quick questions</h2>
            <p className="mb-4 text-xs text-gray-500">Tap to ask Mumu</p>
            <div className="space-y-2">
              {SUGGESTIONS.map(({ text, icon: Icon }) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => sendMessage(text)}
                  disabled={loading}
                  className="group flex w-full items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-left text-sm text-gray-700 transition-all hover:border-primary-200 hover:bg-primary-50/60 hover:text-primary-900 disabled:opacity-50"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-primary-600 shadow-sm ring-1 ring-gray-100 group-hover:ring-primary-100">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="leading-snug">{text}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Chat panel */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {chatMode === 'text' ? (
            <>
              {/* Messages */}
              <div className="relative min-h-0 flex-1 overflow-y-auto">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-50/30 via-transparent to-transparent" />
                <div className="relative space-y-6 p-4 sm:p-6">
                  {messages.map((message, index) => (
                    <MessageBubble key={index} message={message} />
                  ))}

                  {loading && (
                    <div className="flex flex-col gap-1">
                      <span className="px-1 text-xs font-medium text-primary-700">Mumu</span>
                      <div className="w-fit rounded-2xl rounded-tl-md border border-gray-100 bg-white px-4 py-3 shadow-sm">
                        <TypingIndicator />
                      </div>
                    </div>
                  )}

                  {showSuggestions && (
                    <div className="pt-2 lg:hidden">
                      <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-gray-400">
                        Try asking
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {SUGGESTIONS.slice(0, 4).map(({ text, icon: Icon }) => (
                          <button
                            key={text}
                            type="button"
                            onClick={() => sendMessage(text)}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800 disabled:opacity-50"
                          >
                            <Icon className="h-3 w-3 text-primary-600" />
                            {text.length > 28 ? `${text.slice(0, 28)}…` : text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="border-t border-gray-100 bg-gray-50/80 p-4">
                <form
                  onSubmit={handleSubmit}
                  className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-500/20"
                >
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                    placeholder="Ask Mumu about sales, stock, debts, or profits…"
                    className="max-h-32 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition-all hover:bg-primary-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                <p className="mt-2 text-center text-xs text-gray-400">
                  Enter to send · Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            <VoiceChat
              messages={messages}
              addMessage={(message) => setMessages((prev) => [...prev, message])}
              isLoading={loading}
              setIsLoading={setLoading}
              buildConversationContext={buildConversationContext}
            />
          )}
        </div>
      </div>
    </div>
  )
}
