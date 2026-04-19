'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'

interface Card {
  id: string
  name: string
  imageUrl: string
  rarity: 'N' | 'R' | 'SSR' | 'LOG'
  price: number
  ownerId: string
  ownerName: string
  forSale: boolean
}

interface Pack {
  id: string
  name: string
  price: number
  cardCount: number
  rarity: 'N' | 'R' | 'SSR' | 'LOG'
}

export default function ShopPage() {
  const { user } = useAuth()
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [shopTab, setShopTab] = useState<'cards' | 'packs'>('cards')

  const packs: Pack[] = [
    { id: 'pack1', name: '基礎包', price: 100, cardCount: 1, rarity: 'N' },
    { id: 'pack2', name: '稀有包', price: 300, cardCount: 1, rarity: 'R' },
    { id: 'pack3', name: '傳說包', price: 1000, cardCount: 1, rarity: 'SSR' },
    { id: 'pack4', name: '隱藏包', price: 5000, cardCount: 1, rarity: 'LOG' },
  ]

  useEffect(() => {
    fetchSaleCards()
  }, [user])

  async function fetchSaleCards() {
    try {
      const q = query(collection(db, 'cards'), where('forSale', '==', true))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCards(data)
    } catch (error) {
      console.error('獲取卡牌失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  async function buyCard(card: Card) {
    if (!user || user.coins < card.price) return
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        coins: user.coins - card.price,
      })
      await updateDoc(doc(db, 'cards', card.id), {
        ownerId: user.uid,
        ownerName: user.displayName,
        forSale: false,
      })
      await addDoc(collection(db, 'userCards'), {
        uid: user.uid,
        cardId: card.id,
        name: card.name,
        imageUrl: card.imageUrl,
        rarity: card.rarity,
        obtainedAt: new Date(),
      })
      alert(`購買成功！${card.name}`)
      fetchSaleCards()
    } catch (error) {
      console.error('購買失敗:', error)
    }
  }

  async function buyPack(pack: Pack) {
    if (!user || user.coins < pack.price) return
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        coins: user.coins - pack.price,
      })
      await addDoc(collection(db, 'userCards'), {
        uid: user.uid,
        name: pack.name.replace('包', ''),
        imageUrl: '',
        rarity: pack.rarity,
        obtainedAt: new Date(),
      })
      alert(`購買成功！獲得 ${pack.name}`)
    } catch (error) {
      console.error('購買失敗:', error)
    }
  }

  const rarityColor = (rarity: string) => {
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
        <h1 className="text-2xl font-calligraphy">🛒 商店</h1>
        <p className="text-sm mt-1">💰 餘額: {user?.coins || 0}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShopTab('cards')}
          className={`flex-1 p-3 border-2 border-ink-black ${shopTab === 'cards' ? 'bg-chinese-red text-white' : 'bg-white'}`}
        >
          購買卡牌
        </button>
        <button
          onClick={() => setShopTab('packs')}
          className={`flex-1 p-3 border-2 border-ink-black ${shopTab === 'packs' ? 'bg-chinese-red text-white' : 'bg-white'}`}
        >
          購買卡包
        </button>
      </div>

      {shopTab === 'cards' && (
        <>
          {loading ? (
            <p className="text-center text-gray-500">載入中...</p>
          ) : cards.length === 0 ? (
            <p className="text-center text-gray-500">目前沒有卡牌可購買</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {cards.map((card) => (
                <div key={card.id} className="bg-white border-2 border-ink-black p-2">
                  <div className="aspect-square bg-gray-100 mb-2 flex items-center justify-center">
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">🎴</span>
                    )}
                  </div>
                  <h3 className={`font-bold text-center ${rarityColor(card.rarity)}`}>{card.name}</h3>
                  <p className="text-center text-sm text-gray-500">{card.rarity}</p>
                  <button
                    onClick={() => buyCard(card)}
                    disabled={user!.coins < card.price}
                    className={`w-full mt-2 p-2 border-2 border-ink-black ${
                      user!.coins >= card.price ? 'bg-gold' : 'bg-gray-300'
                    }`}
                  >
                    💰 {card.price}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {shopTab === 'packs' && (
        <div className="grid grid-cols-2 gap-3">
          {packs.map((pack) => (
            <div key={pack.id} className="bg-white border-2 border-ink-black p-4 text-center">
              <span className="text-4xl block mb-2">🎁</span>
              <h3 className={`font-bold ${rarityColor(pack.rarity)}`}>{pack.name}</h3>
              <p className="text-sm text-gray-500">{pack.cardCount} 張卡</p>
              <button
                onClick={() => buyPack(pack)}
                disabled={user!.coins < pack.price}
                className={`w-full mt-2 p-2 border-2 border-ink-black ${
                  user!.coins >= pack.price ? 'bg-gold' : 'bg-gray-300'
                }`}
              >
                💰 {pack.price}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}