'use client'

import { useState, useEffect, useRef } from 'react'
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'

interface Message {
  id: string
  userId: string
  userName: string
  userPhoto?: string
  content: string
  createdAt: Date
}

export default function ChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = query(
      collection(db, 'chat'),
      orderBy('createdAt', 'desc'),
      limit(100)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }))
      setMessages(data.reverse())
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!newMessage.trim() || !user) return
    setSending(true)

    try {
      await addDoc(collection(db, 'chat'), {
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        content: newMessage.trim(),
        createdAt: serverTimestamp(),
      })
      setNewMessage('')
    } catch (error) {
      console.error('發送失敗:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-chinese-red text-white p-4 text-center">
        <h1 className="text-2xl font-calligraphy">💬 公開聊天室</h1>
      </div>

      <div className="bg-white border-2 border-ink-black h-96 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500">尚無訊息</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.userId === user?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] ${
                  msg.userId === user?.uid
                    ? 'bg-chinese-red text-white'
                    : 'bg-gray-100'
                } p-3 rounded-lg`}
              >
                {msg.userId !== user?.uid && (
                  <p className="text-xs font-bold mb-1">{msg.userName}</p>
                )}
                <p>{msg.content}</p>
                <p className="text-xs opacity-50">
                  {msg.createdAt?.toLocaleTimeString('zh-TW', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="輸入訊息..."
          className="input-calligraphy flex-1"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="btn-calligraphy"
        >
          {sending ? '...' : '發送'}
        </button>
      </div>
    </div>
  )
}