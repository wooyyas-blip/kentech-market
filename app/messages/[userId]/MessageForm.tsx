'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// 쪽지 입력 폼 (Client Component)
export default function MessageForm({ receiverId }: { receiverId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setLoading(true)
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: trimmed,
        is_read: false,
      })
    setLoading(false)

    if (error) {
      alert('전송 실패: ' + error.message)
      return
    }
    setContent('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="메시지를 입력하세요..."
        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-indigo-500 text-sm"
      />
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="px-5 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:opacity-50 text-sm font-medium"
      >
        전송
      </button>
    </form>
  )
}