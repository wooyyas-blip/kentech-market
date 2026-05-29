'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// 댓글 수정 + 삭제 액션 컴포넌트 (Client Component)
// 변경 사항 (v2):
// - 기존 DeleteCommentButton에서 확장: 수정 기능 추가 (박은규 형 피드백)
// - 본인 댓글일 때만 부모에서 렌더링됨 (UI 1차) + RLS가 백엔드 2차 방어
// - 수정 모드: 댓글이 textarea로 바뀌고 저장/취소 버튼 노출
type Props = {
  commentId: string
  initialContent: string
  // 수정 모드 진입 시 부모 li에서 본문 영역을 숨길지 결정용
  // 간단하게 가려면 이 컴포넌트가 본문도 렌더링하도록 만들어도 됨 — 여기선 후자 선택
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
    setDraft(initialContent) // 혹시 모를 동기화
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
      // 바뀐 게 없으면 그냥 닫기
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

  // 수정 모드: textarea + 저장/취소
  if (editing) {
    return (
      <div className="mt-2 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          autoFocus
          className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={handleCancelEdit}
            disabled={loading}
            className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900"
          >
            취소
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={loading || !draft.trim()}
            className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    )
  }

  // 평소: 수정/삭제 버튼만
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleStartEdit}
        className="text-xs text-gray-400 hover:text-orange-500"
      >
        수정
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-50"
      >
        삭제
      </button>
    </div>
  )
}
