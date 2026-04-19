'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'

interface Community {
  id: string
  name: string
  description: string
  ownerId: string
  ownerName: string
  level: number
  memberCount: number
  members: string[]
  createdAt: Date
}

const LEVELS = [
  { level: 1, name: '銅級', memberLimit: 10, cost: 100 },
  { level: 2, name: '銀級', memberLimit: 30, cost: 300 },
  { level: 3, name: '金級', memberLimit: 50, cost: 500 },
  { level: 4, name: '鑽石級', memberLimit: 100, cost: 1000 },
]

const CREATE_COST = 500

export default function CommunityPage() {
  const { user } = useAuth()
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchCommunities()
  }, [user])

  async function fetchCommunities() {
    try {
      let q
      if (user) {
        q = query(collection(db, 'communities'))
      }
      if (q) {
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        }))
        setCommunities(data)
      }
    } catch (error) {
      console.error('獲取社團失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createCommunity() {
    if (!user || user.coins < CREATE_COST || !newName.trim()) return
    setCreating(true)

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        coins: user.coins - CREATE_COST,
      })
      await addDoc(collection(db, 'communities'), {
        name: newName.trim(),
        description: newDesc.trim(),
        ownerId: user.uid,
        ownerName: user.displayName,
        level: 1,
        memberCount: 1,
        members: [user.uid],
        createdAt: new Date(),
      })
      setNewName('')
      setNewDesc('')
      setShowCreate(false)
      fetchCommunities()
    } catch (error) {
      console.error('創建失敗:', error)
    } finally {
      setCreating(false)
    }
  }

  async function joinCommunity(community: Community) {
    if (!user || community.members.includes(user.uid)) return
    if (community.memberCount >= LEVELS[community.level - 1].memberLimit) return

    try {
      await updateDoc(doc(db, 'communities', community.id), {
        members: [...community.members, user.uid],
        memberCount: community.memberCount + 1,
      })
      fetchCommunities()
    } catch (error) {
      console.error('加入失敗:', error)
    }
  }

  async function upgradeCommunity(community: Community) {
    if (!user || community.ownerId !== user.uid) return
    if (community.level >= 4) return

    const nextLevel = LEVELS[community.level]
    if (user.coins < nextLevel.cost) return

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        coins: user.coins - nextLevel.cost,
      })
      await updateDoc(doc(db, 'communities', community.id), {
        level: community.level + 1,
      })
      fetchCommunities()
    } catch (error) {
      console.error('升級失敗:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-chinese-red text-white p-4 text-center">
        <h1 className="text-2xl font-calligraphy">👥 粉絲團</h1>
        <p className="text-sm mt-1">💰 餘額: {user?.coins || 0}</p>
      </div>

      <button
        onClick={() => setShowCreate(!showCreate)}
        className="btn-calligraphy w-full"
      >
        {showCreate ? '取消創建' : `創建粉絲團 (${CREATE_COST}💰)`}
      </button>

      {showCreate && (
        <div className="bg-white p-4 border-2 border-ink-black">
          <h2 className="text-xl mb-3">創建新社團</h2>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="社團名稱"
            className="input-calligraphy w-full mb-2"
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="社團描述"
            className="input-calligraphy w-full mb-2 h-24"
          />
          <button
            onClick={createCommunity}
            disabled={creating || !newName.trim() || user!.coins < CREATE_COST}
            className="btn-calligraphy w-full"
          >
            {creating ? '創建中...' : '確認創建'}
          </button>
        </div>
      )}

      <h2 className="text-xl">全部社團</h2>
      {loading ? (
        <p className="text-center text-gray-500">載入中...</p>
      ) : communities.length === 0 ? (
        <p className="text-center text-gray-500">尚無社團</p>
      ) : (
        <div className="space-y-3">
          {communities.map((comm) => (
            <div key={comm.id} className="bg-white p-4 border-2 border-ink-black">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{comm.name}</h3>
                  <p className="text-sm text-gray-500">{comm.description}</p>
                </div>
                <span className="seal">{LEVELS[comm.level - 1].name}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  成員: {comm.memberCount}/{LEVELS[comm.level - 1].memberLimit}
                </span>
                {comm.ownerId === user?.uid ? (
                  <button
                    onClick={() => upgradeCommunity(comm)}
                    disabled={comm.level >= 4 || user!.coins < LEVELS[comm.level].cost}
                    className="text-sm bg-gold px-3 py-1"
                  >
                    {comm.level >= 4 ? '最高級' : `升級 (${LEVELS[comm.level].cost}💰)`}
                  </button>
                ) : !comm.members.includes(user?.uid || '') ? (
                  <button
                    onClick={() => joinCommunity(comm)}
                    className="text-sm bg-chinese-red text-white px-3 py-1"
                  >
                    加入
                  </button>
                ) : (
                  <span className="text-sm text-green-500">已加入</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}