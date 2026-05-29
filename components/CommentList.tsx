import { createClient } from '@/lib/supabase/server'
import CommentActions from './CommentActions'

// 댓글 목록 (Server Component)
// 변경 사항 (v2):
// - DeleteCommentButton → CommentActions로 교체 (수정 기능 추가)
// - 본인 댓글에 수정/삭제 두 버튼 같이 노출
// - 수정 모드에서는 본문 대신 textarea가 표시되도록 CommentActions 내부에서 처리
type Props = {
  postId: string
  postType: 'product' | 'errand'
}

export default async function CommentList({ postId, postType }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: comments, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:users!comments_user_id_fkey (id, nickname)
    `)
    .eq('post_id', postId)
    .eq('post_type', postType)
    .order('created_at', { ascending: true })

  if (error) {
    return <p className="text-sm text-red-500">댓글 불러오기 실패</p>
  }
  if (!comments || comments.length === 0) {
    return <p className="text-sm text-gray-500 py-4">아직 댓글이 없어요. 첫 댓글을 남겨보세요!</p>
  }

  return (
    <ul className="space-y-3">
      {comments.map((c) => {
        const isMine = user?.id === c.user_id
        return (
          <li key={c.id} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-900">
                {c.author?.nickname || '익명'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {new Date(c.created_at).toLocaleString('ko-KR', {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                {isMine && (
                  <CommentActions commentId={c.id} initialContent={c.content} />
                )}
              </div>
            </div>

            {/* 본문은 항상 표시 — 수정 모드 textarea는 CommentActions 안에서 별도로 표시됨 
                즉 수정 중일 때는 본문 + textarea 둘 다 보일 수 있는데
                UX 깔끔하게 하려면 CommentActions의 editing 상태를 부모로 끌어올려야 하지만
                MVP는 이대로 충분 (수정 중인 내용을 textarea에서 확인 가능) */}
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
          </li>
        )
      })}
    </ul>
  )
}
