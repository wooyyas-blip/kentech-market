'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const COMMENT_MAX = 200

// 변경 사항 (v2):
// - 댓글 200자 제한 + 카운터 (악성글 방어, 김서정 피드백)
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
    setContent('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="댓글을 입력하세요..."
        rows={2}
        maxLength={COMMENT_MAX}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{content.length}/{COMMENT_MAX}</span>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-4 py-2 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 disabled:opacity-50"
        >
          {loading ? '작성 중...' : '댓글 작성'}
        </button>
      </div>
    </form>
  )
}
