import { createClient } from '@/lib/supabase/server'
import DeleteCommentButton from './DeleteCommentButton'

// 댓글 목록 (Server Component)
// products/errands 상세 페이지에서 재사용
// post_type으로 어느 도메인 댓글인지 구분
type Props = {
  postId: string
  postType: 'product' | 'errand'
}

export default async function CommentList({ postId, postType }: Props) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 작성자 닉네임까지 JOIN
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
      {comments.map((c) => (
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
              {/* 본인 댓글에만 삭제 버튼 (UI 1차) + RLS가 백엔드 2차 방어 */}
              {user?.id === c.user_id && (
                <DeleteCommentButton commentId={c.id} />
              )}
            </div>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
        </li>
      ))}
    </ul>
  )
}