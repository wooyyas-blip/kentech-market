'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const COMMENT_MAX = 200

type Props = {
  commentId: string
  initialContent: string
}

export default function CommentActions({ commentId, initialContent }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialContent)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('댓글을 삭제할까요?')) return
    setLoading(true)
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    setLoading(false)
    if (error) return alert('삭제 실패: ' + error.message)
    router.refresh()
  }

  const handleStartEdit = () => {
    setDraft(initialContent)
    setEditing(true)
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setDraft(initialContent)
  }

  const handleSaveEdit = async () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      alert('내용을 입력해주세요.')
      return
    }
    if (trimmed === initialContent) {
      setEditing(false)
      return
    }
    setLoading(true)
    const { error } = await supabase
      .from('comments')
      .update({ content: trimmed })
      .eq('id', commentId)
    setLoading(false)
    if (error) return alert('수정 실패: ' + error.message)
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="mt-2 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          maxLength={COMMENT_MAX}
          autoFocus
          className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{draft.length}/{COMMENT_MAX}</span>
          <div className="flex gap-2">
            <button onClick={handleCancelEdit} disabled={loading} className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900">취소</button>
            <button onClick={handleSaveEdit} disabled={loading || !draft.trim()} className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50">
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleStartEdit} className="text-xs text-gray-400 hover:text-orange-500">수정</button>
      <button onClick={handleDelete} disabled={loading} className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-50">삭제</button>
    </div>
  )
}
