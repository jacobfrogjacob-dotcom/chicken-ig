'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

export default function ProfilePage() {
  const { user } = useAuth()
  const [coins, setCoins] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [user])

  async function fetchUserData() {
    if (!user) return
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        setCoins(userDoc.data().coins || 0)
      }
    } catch (error) {
      console.error('獲取資料失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center p-4">
        <p>請先登入</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-chinese-red text-white p-8 text-center">
        {user.photoURL && (
          <img src={user.photoURL} alt="" className="w-24 h-24 rounded-full mx-auto border-4 border-white mb-4" />
        )}
        <h1 className="text-2xl font-calligraphy">{user.displayName}</h1>
        <p className="text-sm opacity-80">{user.email}</p>
        {user.isAdmin && <span className="seal inline-block mt-2">管理員</span>}
      </div>

      <div className="bg-white p-4 border-2 border-ink-black">
        <h2 className="text-xl mb-3">💰 金幣餘額</h2>
        <div className="text-3xl text-center text-chinese-red font-bold">{coins}</div>
      </div>

      <div className="space-y-2">
        <Link href="/cards" className="block bg-white p-4 border-2 border-ink-black">
          <span className="text-xl mr-2">🎴</span>
          我的卡牌
        </Link>
        <Link href="/draw" className="block bg-white p-4 border-2 border-ink-black">
          <span className="text-xl mr-2">🎰</span>
          抽卡記錄
        </Link>
        <Link href="/shop" className="block bg-white p-4 border-2 border-ink-black">
          <span className="text-xl mr-2">🛒</span>
          商店
        </Link>
        <Link href="/community" className="block bg-white p-4 border-2 border-ink-black">
          <span className="text-xl mr-2">👥</span>
          我的社團
        </Link>
        <Link href="/chat" className="block bg-white p-4 border-2 border-ink-black">
          <span className="text-xl mr-2">💬</span>
          聊天室
        </Link>
        <Link href="/service" className="block bg-white p-4 border-2 border-ink-black">
          <span className="text-xl mr-2">📞</span>
          客服
        </Link>
        {user.isAdmin && (
          <Link href="/admin" className="block bg-white p-4 border-2 border-chinese-red">
            <span className="text-xl mr-2">⚙️</span>
            管理員後台
          </Link>
        )}
      </div>
    </div>
  )
}