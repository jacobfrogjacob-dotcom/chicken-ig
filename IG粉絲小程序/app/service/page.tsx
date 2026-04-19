'use client'

import { useState, useEffect, useRef } from 'react'
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore'
import { getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'
import { ADMIN_EMAIL } from '@/lib/constants'

interface DM {
  id: string
  participants: string[]
  lastMessage: string
  updatedAt: Date
}

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: Date
}

export default function ServicePage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<DM[]>([])
  const [currentConvo, setCurrentConvo] = useState<DM | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showConvoList, setShowConvoList] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  useEffect(() => {
    if (currentConvo) {
      fetchMessages()
    }
  }, [currentConvo])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchConversations() {
    if (!user) return
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.uid),
        orderBy('updatedAt', 'desc')
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }))
      setConversations(data)
    } catch (error) {
      console.error('獲取對話失敗:', error)
    }
  }

  async function fetchMessages() {
    if (!currentConvo) return
    try {
      const q = query(
        collection(db, 'messages', currentConvo.id, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(100)
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }))
      setMessages(data)
    } catch (error) {
      console.error('獲取訊息失敗:', error)
    }
  }

  async function startNewConversation() {
    if (!user) return
    setSending(true)

    try {
      const convRef = await addDoc(collection(db, 'conversations'), {
        participants: [user.uid, 'admin'],
        lastMessage: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setCurrentConvo({ id: convRef.id, participants: [user.uid, 'admin'], lastMessage: '', updatedAt: new Date() })
      setShowConvoList(false)
    } catch (error) {
      console.error('創建對話失敗:', error)
    } finally {
      setSending(false)
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !user || !currentConvo) return
    setSending(true)

    try {
      const msgRef = await addDoc(collection(db, 'messages', currentConvo.id, 'messages'), {
        senderId: user.uid,
        content: newMessage.trim(),
        createdAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'conversations', currentConvo.id), {
        lastMessage: newMessage.trim(),
        updatedAt: new Date(),
      })
      setNewMessage('')
      fetchMessages()
    } catch (error) {
      console.error('發送失敗:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-chinese-red text-white p-4 text-center">
        <h1 className="text-2xl font-calligraphy">📞 客服中心</h1>
        <button onClick={() => setShowConvoList(true)} className="text-sm mt-1">
          ← 返回
        </button>
      </div>

      {showConvoList ? (
        <div className="space-y-3">
          <button onClick={startNewConversation} className="btn-calligraphy w-full">
            💬 開始對話
          </button>

          <h2 className="text-xl">對話紀錄</h2>
          {conversations.length === 0 ? (
            <p className="text-center text-gray-500">尚無對話</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setCurrentConvo(conv)
                    setShowConvoList(false)
                  }}
                  className="w-full bg-white p-4 border-2 border-ink-black text-left"
                >
                  <p className="font-bold">与管理員的對話</p>
                  <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white border-2 border-ink-black h-72 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500">尚無訊息</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] ${
                      msg.senderId === user?.uid
                        ? 'bg-chinese-red text-white'
                        : 'bg-gray-100'
                    } p-3 rounded-lg`}
                  >
                    <p>{msg.content}</p>
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
      )}
    </div>
  )
}