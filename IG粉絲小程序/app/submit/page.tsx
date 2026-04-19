'use client'

import { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'

export default function SubmitPage() {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit() {
    if (!content.trim()) return
    setSubmitting(true)

    try {
      await addDoc(collection(db, 'submissions'), {
        userId: user!.uid,
        userName: user!.displayName,
        content: content.trim(),
        imageUrl: imageUrl.trim() || null,
        status: 'pending',
        createdAt: new Date(),
      })
      setSubmitted(true)
      setContent('')
      setImageUrl('')
    } catch (error) {
      console.error('投稿失敗:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl text-chinese-red">投稿成功</h1>
        <p className="text-gray-600">感謝您的投稿，管理員將盡快審核</p>
        <button
          onClick={() => setSubmitted(false)}
          className="btn-calligraphy"
        >
          繼續投稿
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-chinese-red text-white p-4 text-center">
        <h1 className="text-2xl font-calligraphy">📝 投稿系統</h1>
      </div>

      <div className="bg-white p-4 border-2 border-ink-black">
        <h2 className="text-xl mb-3">發布投稿</h2>
        <p className="text-sm text-gray-500 mb-4">
          投稿需要經過管理員審核后才會顯示
        </p>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="輸入投稿內容..."
          className="input-calligraphy w-full h-32 mb-3"
        />

        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="圖片網址（可選）"
          className="input-calligraphy w-full mb-3"
        />

        <button
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          className={`btn-calligraphy w-full ${
            submitting || !content.trim() ? 'opacity-50' : ''
          }`}
        >
          {submitting ? '投稿中...' : '提交投稿'}
        </button>
      </div>

      <div className="bg-white p-4 border-2 border-ink-black">
        <h2 className="text-xl mb-3">投稿須知</h2>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• 投稿內容需符合社群規範</li>
          <li>• 圖片需要提供網址或使用 Firebase Storage 上傳</li>
          <li>• 投稿後需等待管理員審核</li>
          <li>• 審核通過後會在卡牌區显示</li>
        </ul>
      </div>
    </div>
  )
}