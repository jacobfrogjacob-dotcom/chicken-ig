'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'
import { RARITY, CARDS_DATA } from '@/lib/constants'

interface UserCard {
  id: string
  name: string
  imageUrl: string
  rarity: 'N' | 'R' | 'SSR' | 'LOG'
  obtainedAt: Date
}

export default function CardsPage() {
  const { user } = useAuth()
  const [cards, setCards] = useState<UserCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'N' | 'R' | 'SSR' | 'LOG'>('all')

  useEffect(() => {
    fetchCards()
  }, [user, filter])

  async function fetchCards() {
    if (!user) return
    try {
      let q = query(collection(db, 'userCards'), where('uid', '==', user.uid))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        obtainedAt: doc.data().obtainedAt?.toDate(),
      }))
      
      if (filter !== 'all') {
        setCards(data.filter((c) => c.rarity === filter))
      } else {
        setCards(data)
      }
    } catch (error) {
      console.error('獲取卡牌失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const rarityColor = (rarity: string) => {
    switch (rarity) {
      case 'N': return 'text-gray-500 border-gray-400'
      case 'R': return 'text-blue-500 border-blue-400'
      case 'SSR': return 'text-purple-500 border-purple-400'
      case 'LOG': return 'text-yellow-500 border-yellow-400'
      default: return 'text-gray-500 border-gray-400'
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-chinese-red text-white p-4 text-center">
        <h1 className="text-2xl font-calligraphy">🎴 我的卡牌</h1>
        <p className="text-sm mt-1">共 {cards.length} 張</p>
      </div>

      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 border-2 ${filter === 'all' ? 'bg-chinese-red text-white' : 'bg-white'} border-ink-black text-sm`}
        >
          全部
        </button>
        {Object.keys(RARITY).map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r as any)}
            className={`px-3 py-1 border-2 ${filter === r ? 'bg-chinese-red text-white' : 'bg-white'} border-ink-black text-sm`}
          >
            {RARITY[r as keyof typeof RARITY].name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500">載入中...</p>
      ) : cards.length === 0 ? (
        <div className="text-center p-8 bg-white border-2 border-ink-black">
          <p className="text-gray-500 mb-4">尚未獲得任何卡牌</p>
          <a href="/draw" className="btn-calligraphy inline-block">去抽卡</a>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <div key={card.id} className={`bg-white border-2 ${rarityColor(card.rarity)} p-2`}>
              <div className="aspect-square bg-gray-50 mb-2 flex items-center justify-center">
                <img src={card.imageUrl} alt={card.name} className="w-full h-full object-contain p-2" />
              </div>
              <h3 className={`font-bold text-center ${rarityColor(card.rarity)}`}>{card.name}</h3>
              <p className="text-center text-sm text-gray-500">{RARITY[card.rarity].name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}