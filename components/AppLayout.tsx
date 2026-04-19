'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

const navItems = [
  { href: '/', label: '首頁', icon: '🏠' },
  { href: '/service', label: '客服', icon: '📞' },
  { href: '/community', label: '社團', icon: '👥' },
  { href: '/shop', label: '商店', icon: '🛒' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-paper pb-20">
      <header className="bg-chinese-red text-white p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-calligraphy">IG粉絲小程序</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm">{user?.displayName}</span>
            {user?.photoURL && (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border-2 border-white" />
            )}
            <button onClick={logout} className="text-sm bg-white text-chinese-red px-2 py-1 rounded">
              登出
            </button>
          </div>
        </div>
      </header>

      <main className="p-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-ink-black">
        <div className="flex justify-around py-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center text-xs ${
                pathname === item.href ? 'text-chinese-red font-bold' : 'text-gray-600'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}