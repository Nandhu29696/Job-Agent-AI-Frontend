import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { agentApi } from '../api/client'

const SUGGESTIONS = [
  'What skills are most in demand for software engineers?',
  'How do I negotiate a higher salary?',
  'Review my approach to applying for remote jobs',
  'What should I include in a cover letter?',
]

export default function AgentPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your Job Agent AI. I can help you find jobs, write cover letters, review your resume, and prep for interviews. What can I help you with today?" },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const message = text || input.trim()
    if (!message) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: message }])
    setLoading(true)
    try {
      const { data } = await agentApi.chat({ message })
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Agent</h1>

      {/* Chat window */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-none'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={16} className="text-gray-600" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3">
              <Loader2 size={16} className="animate-spin text-brand-500" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 py-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              className="text-xs rounded-full border border-brand-200 bg-brand-50 text-brand-700 px-3 py-1.5 hover:bg-brand-100 transition-colors"
              onClick={() => sendMessage(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        className="flex gap-2 pt-3 border-t border-gray-200"
        onSubmit={(e) => { e.preventDefault(); sendMessage() }}
      >
        <input
          className="input flex-1"
          placeholder="Ask the AI agent anything…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
