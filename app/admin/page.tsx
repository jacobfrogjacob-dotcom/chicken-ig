'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, limit, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: Date
}

interface Submission {
  id: string
  userId: string
  userName: string
  content: string
  imageUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
}

export default function AdminPage() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [newAnnTitle, setNewAnnTitle] = useState('')
  const [newAnnContent, setNewAnnContent] = useState('')
  const [activeTab, setActiveTab] = useState<'announcements' | 'submissions'>('announcements')

  useEffect(() => {
    if (user?.isAdmin) {
      fetchAnnouncements()
      fetchSubmissions()
    }
  }, [user])

  async function fetchAnnouncements() {
    try {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(20))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }))
      setAnnouncements(data)
    } catch (error) {
      console.error('獲取公告失敗:', error)
    }
  }

  async function fetchSubmissions() {
    try {
      const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'), limit(20))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }))
      setSubmissions(data)
    } catch (error) {
      console.error('獲取投稿失敗:', error)
    }
  }

  async function createAnnouncement() {
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return
    try {
      await addDoc(collection(db, 'announcements'), {
        title: newAnnTitle,
        content: newAnnContent,
        createdAt: new Date(),
      })
      setNewAnnTitle('')
      setNewAnnContent('')
      fetchAnnouncements()
    } catch (error) {
      console.error('發布公告失敗:', error)
    }
  }

  async function deleteAnnouncement(id: string) {
    try {
      await deleteDoc(doc(db, 'announcements', id))
      setAnnouncements(announcements.filter((a) => a.id !== id))
    } catch (error) {
      console.error('刪除公告失敗:', error)
    }
  }

  async function approveSubmission(id: string) {
    try {
      await updateDoc(doc(db, 'submissions', id), { status: 'approved' })
      setSubmissions(submissions.map((s) => (s.id === id ? { ...s, status: 'approved' } : s)))
    } catch (error) {
      console.error('審核失敗:', error)
    }
  }

  async function rejectSubmission(id: string) {
    try {
      await updateDoc(doc(db, 'submissions', id), { status: 'rejected' })
      setSubmissions(submissions.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s)))
    } catch (error) {
      console.error('審核失敗:', error)
    }
  }

  if (!user?.isAdmin) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl text-chinese-red">⚠️ 權限不足</h1>
        <p className="text-gray-600 mt-2">只有管理員可以訪問此頁面</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-chinese-red text-white p-4 text-center">
        <h1 className="text-2xl font-calligraphy">管理員系統</h1>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex-1 p-3 border-2 border-ink-black ${activeTab === 'announcements' ? 'bg-chinese-red text-white' : 'bg-white'}`}
        >
          📢 公告管理
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex-1 p-3 border-2 border-ink-black ${activeTab === 'submissions' ? 'bg-chinese-red text-white' : 'bg-white'}`}
        >
          📝 投稿審核 ({submissions.filter((s) => s.status === 'pending').length})
        </button>
      </div>

      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border-2 border-ink-black">
            <h2 className="text-xl mb-3">發布新公告</h2>
            <input
              type="text"
              value={newAnnTitle}
              onChange={(e) => setNewAnnTitle(e.target.value)}
              placeholder="公告標題"
              className="input-calligraphy w-full mb-2"
            />
            <textarea
              value={newAnnContent}
              onChange={(e) => setNewAnnContent(e.target.value)}
              placeholder="公告內容"
              className="input-calligraphy w-full mb-2 h-24"
            />
            <button onClick={createAnnouncement} className="btn-calligraphy w-full">
              發布公告
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl">現有公告</h2>
            {announcements.map((ann) => (
              <div key={ann.id} className="bg-white p-3 border-2 border-ink-black flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{ann.title}</h3>
                  <p className="text-sm text-gray-600">{ann.content}</p>
                  <p className="text-xs text-gray-400">
                    {ann.createdAt?.toLocaleDateString('zh-TW')}
                  </p>
                </div>
                <button
                  onClick={() => deleteAnnouncement(ann.id)}
                  className="text-red-500 text-xl"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="space-y-2">
          <h2 className="text-xl">待審核投稿</h2>
          {submissions.filter((s) => s.status === 'pending').length === 0 ? (
            <p className="text-gray-500">沒有待審核的投稿</p>
          ) : (
            submissions
              .filter((s) => s.status === 'pending')
              .map((sub) => (
                <div key={sub.id} className="bg-white p-4 border-2 border-ink-black">
                  <p className="font-bold">{sub.userName}</p>
                  <p className="mb-2">{sub.content}</p>
                  {sub.imageUrl && (
                    <img src={sub.imageUrl} alt="" className="w-full h-48 object-cover mb-2" />
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveSubmission(sub.id)}
                      className="flex-1 bg-green-500 text-white p-2 border-2 border-ink-black"
                    >
                      ✅ 通過
                    </button>
                    <button
                      onClick={() => rejectSubmission(sub.id)}
                      className="flex-1 bg-red-500 text-white p-2 border-2 border-ink-black"
                    >
                      ❌ 拒絕
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  )
}