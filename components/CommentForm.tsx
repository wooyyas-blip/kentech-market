'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// 댓글 입력 폼 (Client Component)
// 비로그인 사용자에게는 로그인 유도 메시지 표시
type Props = {
  postId: string
  postType: 'product' | 'errand'
  isLoggedIn: boolean
}

export default function CommentForm({ postId, postType, isLoggedIn }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-gray-500 text-center py-3 bg-gray-50 rounded-lg">
        💬 댓글을 남기려면 로그인이 필요해요
      </p>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setLoading(true)
    const { error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        post_id: postId,
        post_type: postType,
        content: content.trim(),
      })
    setLoading(false)

    if (error) {
      alert('댓글 작성 실패: ' + error.message)
      return
    }
    setContent('') // 입력창 비우기
    router.refresh() // 댓글 목록 새로고침
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="댓글을 입력하세요..."
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? '작성 중...' : '댓글 작성'}
        </button>
      </div>
    </form>
  )
}