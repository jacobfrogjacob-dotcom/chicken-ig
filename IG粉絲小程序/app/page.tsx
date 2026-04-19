'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, where, getDocs, orderBy, limit, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: Date
}

export default function HomePage() {
  const router = useRouter()
  const { user, login, logout, loading } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loadingAnn, setLoadingAnn] = useState(true)
  const [currentPage, setCurrentPage] = useState('home')

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const q = query(
          collection(db, 'announcements'),
          orderBy('createdAt', 'desc'),
          limit(5)
        )
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        }))
        setAnnouncements(data)
      } catch (error) {
        console.error('獲取公告失敗:', error)
      } finally {
        setLoadingAnn(false)
      }
    }
    if (!loading && user) {
      fetchAnnouncements()
    }
  }, [loading, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-2xl animate-pulse">載入中...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-paper p-4">
        <div className="calligraphy-border p-8 text-center max-w-md w-full bg-paper">
          <h1 className="text-4xl mb-2 text-chinese-red font-calligraphy">IG粉絲小程序</h1>
          <p className="text-lg mb-8 text-gray-600">書法風格抽卡系統</p>
          <button onClick={login} className="btn-calligraphy w-full">
            使用 Google 帳號登入
          </button>
        </div>
      </div>
    )
  }

  const pages = {
    home: (
      <div className="space-y-4">
        <div className="calligraphy-border p-6 text-center bg-white">
          <h1 className="text-3xl text-chinese-red mb-2">歡迎回來</h1>
          <p className="text-xl">{user.displayName}</p>
          {user.isAdmin && <Link href="/admin" className="seal inline-block mt-2">管理員</Link>}
        </div>

        <div className="bg-white p-4 border-2 border-ink-black">
          <h2 className="text-2xl mb-4 text-chinese-red">📢 公告</h2>
          {loadingAnn ? (
            <p className="text-gray-500">載入中...</p>
          ) : announcements.length === 0 ? (
            <p className="text-gray-500">目前沒有公告</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="border-l-4 border-chinese-red pl-3">
                  <h3 className="font-bold">{ann.title}</h3>
                  <p className="text-sm text-gray-600">{ann.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/cards" className="bg-white p-4 border-2 border-ink-black text-center hover:bg-red-50">
            <span className="text-3xl block mb-1">🎴</span>
            <span className="font-bold">我的卡牌</span>
          </Link>
          <Link href="/draw" className="bg-white p-4 border-2 border-ink-black text-center hover:bg-red-50">
            <span className="text-3xl block mb-1">🎰</span>
            <span className="font-bold">抽卡</span>
          </Link>
          <Link href="/submit" className="bg-white p-4 border-2 border-ink-black text-center hover:bg-red-50">
            <span className="text-3xl block mb-1">📝</span>
            <span className="font-bold">投稿</span>
          </Link>
          <Link href="/profile" className="bg-white p-4 border-2 border-ink-black text-center hover:bg-red-50">
            <span className="text-3xl block mb-1">👤</span>
            <span className="font-bold">個人資料</span>
          </Link>
        </div>
      </div>
    ),
    service: (
      <div className="space-y-4">
        <div className="bg-white p-4 border-2 border-ink-black">
          <h2 className="text-2xl mb-4 text-chinese-red">📞 客服中心</h2>
          <p className="text-gray-600 mb-4">有問題可以私訊管理員</p>
          <Link href="/service/chat" className="btn-calligraphy block text-center">
            開始對話
          </Link>
        </div>
      </div>
    ),
    community: (
      <div className="space-y-4">
        <div className="bg-white p-4 border-2 border-ink-black">
          <h2 className="text-2xl mb-4 text-chinese-red">👥 粉絲團</h2>
          <Link href="/community/create" className="btn-calligraphy block text-center mb-4">
            創建粉絲團
          </Link>
          <p className="text-gray-500">這裡會顯示你加入的粉絲團</p>
        </div>
      </div>
    ),
    shop: (
      <div className="space-y-4">
        <div className="bg-white p-4 border-2 border-ink-black">
          <h2 className="text-2xl mb-4 text-chinese-red">🛒 商店</h2>
          <Link href="/shop/cards" className="block bg-white p-4 border-2 border-ink-black mb-3 text-center hover:bg-red-50">
            <span className="text-2xl">🎴</span>
            <p className="font-bold">購買卡牌</p>
          </Link>
          <Link href="/shop/packs" className="block bg-white p-4 border-2 border-ink-black text-center hover:bg-red-50">
            <span className="text-2xl">🎁</span>
            <p className="font-bold">購買卡包</p>
          </Link>
        </div>
      </div>
    ),
  }

  const navItems = [
    { key: 'home', label: '首頁', icon: '🏠' },
    { key: 'service', label: '客服', icon: '📞' },
    { key: 'community', label: '社團', icon: '👥' },
    { key: 'shop', label: '商店', icon: '🛒' },
  ]

  return (
    <div className="min-h-screen bg-paper pb-20">
      <header className="bg-chinese-red text-white p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-calligraphy">IG粉絲小程序</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm bg-gold text-ink-black px-2 py-1 rounded">
              💰 {user.coins}
            </span>
            {user?.photoURL && (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border-2 border-white" />
            )}
          </div>
        </div>
      </header>

      <main className="p-4">{pages[currentPage as keyof typeof pages]}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-ink-black">
        <div className="flex justify-around py-3">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setCurrentPage(item.key)}
              className={`flex flex-col items-center text-xs ${
                currentPage === item.key ? 'text-chinese-red font-bold' : 'text-gray-600'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <button
            onClick={logout}
            className="flex flex-col items-center text-xs text-gray-600"
          >
            <span className="text-2xl">🚪</span>
            <span>登出</span>
          </button>
        </div>
      </nav>
    </div>
  )
}