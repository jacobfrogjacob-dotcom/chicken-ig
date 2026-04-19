'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '@/lib/firebase'
import { ADMIN_EMAIL } from '@/lib/constants'
import Link from 'next/link'

interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  isAdmin: boolean
  coins: number
}

interface AuthContextType {
  user: User | null
  login: () => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

const navItems = [
  { href: '/', label: '首頁', icon: '🏠' },
  { href: '/service', label: '客服', icon: '📞' },
  { href: '/community', label: '社團', icon: '👥' },
  { href: '/shop', label: '商店', icon: '🛒' },
]

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('/')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isAdmin = firebaseUser.email === ADMIN_EMAIL
        
        let coins = 0
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          coins = userDoc.data().coins || 0
        } else {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            coins: 0,
            createdAt: new Date(),
          })
        }
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAdmin,
          coins,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error('登入失敗:', error)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('登出失敗:', error)
    }
  }

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

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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

        <main className="p-4">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-ink-black">
          <div className="flex justify-around py-3">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => setCurrentPage(item.href)}
                className={`flex flex-col items-center text-xs ${
                  currentPage === item.href ? 'text-chinese-red font-bold' : 'text-gray-600'
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
    </AuthContext.Provider>
  )
}