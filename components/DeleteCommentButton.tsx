'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// 댓글 삭제 버튼 (Client Component)
// 본인 댓글일 때만 부모에서 렌더링됨
// RLS가 백엔드에서 한 번 더 막아주므로 보안 이중화
export default function DeleteCommentButton({ commentId }: { commentId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!confirm('댓글을 삭제할까요?')) return
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) return alert('삭제 실패: ' + error.message)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-gray-400 hover:text-red-500"
    >
      삭제
    </button>
  )
}
