'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'
import { RARITY, FREE_DRAW_COUNT, MIN_PRICE, CARDS_DATA } from '@/lib/constants'

interface Card {
  id: string
  name: string
  imageUrl: string
  rarity: 'N' | 'R' | 'SSR' | 'LOG'
}

export default function DrawPage() {
  const { user } = useAuth()
  const [freeDraws, setFreeDraws] = useState(FREE_DRAW_COUNT)
  const [lastDrawDate, setLastDrawDate] = useState<string | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [drawnCard, setDrawnCard] = useState<Card | null>(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [user])

  async function fetchUserData() {
    if (!user) return
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        const today = new Date().toLocaleDateString('zh-TW')
        if (data.lastDrawDate === today) {
          setFreeDraws(0)
        } else {
          setFreeDraws(FREE_DRAW_COUNT)
        }
        setLastDrawDate(data.lastDrawDate)
      }
    } catch (error) {
      console.error('獲取用戶資料失敗:', error)
    }
  }

  function getRandomRarity(): 'N' | 'R' | 'SSR' | 'LOG' {
    const rand = Math.random() * 100
    let cumulative = 0
    for (const [key, value] of Object.entries(RARITY)) {
      cumulative += value.probability
      if (rand <= cumulative) {
        return key as 'N' | 'R' | 'SSR' | 'LOG'
      }
    }
    return 'N'
  }

  async function doDraw() {
    if (freeDraws <= 0 && (user?.coins || 0) < 100) return
    setDrawing(true)
    setShowResult(false)

    let currentFreeDraws = freeDraws

    if (freeDraws <= 0) {
      const cost = 100
      await updateDoc(doc(db, 'users', user!.uid), {
        coins: (user!.coins || 0) - cost,
      })
    } else {
      currentFreeDraws--
      setFreeDraws(currentFreeDraws)
      const today = new Date().toLocaleDateString('zh-TW')
      await updateDoc(doc(db, 'users', user!.uid), {
        lastDrawDate: today,
      })
    }

    await new Promise((resolve) => setTimeout(resolve, 1500))

    const rarity = getRandomRarity()
    const availableCards = CARDS_DATA.filter((c) => c.rarity === rarity)
    
    let newCard: Card | null = null
    
    if (availableCards.length > 0) {
      const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)]
      newCard = randomCard
    } else {
      newCard = CARDS_DATA[0]
    }

    if (newCard) {
      await addDoc(collection(db, 'userCards'), {
        uid: user!.uid,
        name: newCard.name,
        imageUrl: newCard.imageUrl,
        rarity: newCard.rarity,
        obtainedAt: new Date(),
      })
    }

    setDrawnCard(newCard)
    setShowResult(true)
    setDrawing(false)
  }

  const rarityColor = (rarity: string) => {
    switch (rarity) {
      case 'N': return 'border-gray-400 bg-gray-100'
      case 'R': return 'border-blue-400 bg-blue-100'
      case 'SSR': return 'border-purple-400 bg-purple-100'
      case 'LOG': return 'border-yellow-400 bg-yellow-100'
      default: return 'border-gray-400 bg-gray-100'
    }
  }

  const rarityText = (rarity: string) => {
    switch (rarity) {
      case 'N': return 'text-gray-500'
      case 'R': return 'text-blue-500'
      case 'SSR': return 'text-purple-500'
      case 'LOG': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-chinese-red text-white p-4 text-center">
        <h1 className="text-2xl font-calligraphy">🎰 抽卡系統</h1>
        <p className="text-sm mt-1">💰 餘額: {user?.coins || 0}</p>
      </div>

      <div className="bg-white p-4 border-2 border-ink-black text-center">
        <p className="text-lg mb-2">
          今日剩餘免費抽卡次數: <span className="text-chinese-red font-bold">{freeDraws}</span>
        </p>
        <p className="text-sm text-gray-500">需要更多抽卡？請至商店購買卡包</p>
      </div>

      <div className="flex justify-center py-8">
        {drawing ? (
          <div className="text-6xl animate-pulse">🎰</div>
        ) : drawnCard && showResult ? (
          <div className={`w-64 h-80 border-4 rounded-lg flex flex-col items-center justify-center ${rarityColor(drawnCard.rarity)}`}>
            <div className="text-6xl mb-4">
              <img src={drawnCard.imageUrl} alt={drawnCard.name} className="w-40 h-40 object-contain" />
            </div>
            <h3 className={`text-xl font-bold ${rarityText(drawnCard.rarity)}`}>{drawnCard.name}</h3>
            <p className={`text-sm ${rarityText(drawnCard.rarity)}`}>{RARITY[drawnCard.rarity].name}</p>
          </div>
        ) : (
          <div className="text-6xl">🎰</div>
        )}
      </div>

      <button
        onClick={doDraw}
        disabled={drawing || (freeDraws <= 0 && (user?.coins || 0) < 100)}
        className={`btn-calligraphy w-full text-center block ${
          drawing || (freeDraws <= 0 && (user?.coins || 0) < 100) 
            ? 'opacity-50 cursor-not-allowed' 
            : ''
        }`}
      >
        {drawing 
          ? '抽卡中...' 
          : freeDraws > 0 
            ? '免費抽卡' 
            : '花費 100 金幣抽卡'
        }
      </button>

      {showResult && (
        <button
          onClick={() => {
            setDrawnCard(null)
            setShowResult(false)
          }}
          className="w-full bg-white border-2 border-ink-black p-3 mt-2"
        >
          繼續抽卡
        </button>
      )}

      <div className="bg-white p-4 border-2 border-ink-black">
        <h2 className="text-xl mb-3">卡牌稀有度</h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          {Object.entries(RARITY).map(([key, value]) => (
            <div key={key} className="p-2">
              <div className={`text-2xl font-bold ${value.color}`}>{value.name}</div>
              <div className="text-xs text-gray-500">{value.probability}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}