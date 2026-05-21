import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ErrandActions from './ErrandActions'
import CommentSection from '@/components/CommentSection'
import SendMessageButton from '@/components/SendMessageButton'

// 심부름 상세 페이지 (Server Component)
// products/[id]/page.tsx와 같은 패턴, JOIN으로 요청자/수락자 정보 함께 조회
const statusLabels = {
  open: { label: '🙋 요청중', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: '🏃 진행중', color: 'bg-yellow-100 text-yellow-700' },
  done: { label: '✅ 완료', color: 'bg-gray-200 text-gray-600' },
}

export default async function ErrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 현재 로그인된 사용자
  const { data: { user } } = await supabase.auth.getUser()

  // 심부름 + 요청자 + 수락자 정보를 한 번에 JOIN
  // ⚠️ FK 관계가 자동 추론 안 되면 컬럼명!fkey 형태로 명시
  const { data: errand, error } = await supabase
    .from('errands')
    .select(`
      *,
      requester:users!errands_user_id_fkey (id, nickname, email),
      acceptor:users!errands_accepted_by_fkey (id, nickname, email)
    `)
    .eq('id', id)
    .single()

  if (error || !errand) notFound()

  const status = statusLabels[(errand.status as keyof typeof statusLabels) || 'open']
  const isRequester = user?.id === errand.user_id
  const isAcceptor = user?.id === errand.accepted_by

  // 마감기한 표시
  const deadlineText = errand.deadline
    ? new Date(errand.deadline).toLocaleString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '미정'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 상태 뱃지 + 제목 */}
      <div className="mb-4">
        <span className={`text-sm px-3 py-1 rounded-full ${status.color}`}>
          {status.label}
        </span>
      </div>
      <h1 className="text-2xl font-bold mb-2">{errand.title}</h1>

      <p className="text-3xl font-bold text-orange-600 mb-6">
        💰 {errand.reward.toLocaleString()}원
      </p>

      {/* 상세 정보 박스 */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
        {/* 요청자 줄 + 쪽지 버튼 (본인 글 아닐 때만) */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-500">요청자: </span>
            <span className="font-medium">
              {errand.requester?.nickname || '알 수 없음'}
            </span>
          </div>
          {user && !isRequester && (
            <SendMessageButton partnerId={errand.user_id} />
          )}
        </div>
        <div>
          <span className="text-gray-500">수락자: </span>
          <span className="font-medium">
            {errand.acceptor?.nickname || '아직 없음'}
          </span>
        </div>
        <div>
          <span className="text-gray-500">마감기한: </span>
          <span className="font-medium">⏰ {deadlineText}</span>
        </div>
        <div>
          <span className="text-gray-500">등록일: </span>
          <span className="font-medium">
            {new Date(errand.created_at).toLocaleDateString('ko-KR')}
          </span>
        </div>
      </div>

      {/* 설명 */}
      {errand.description && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">상세 설명</h2>
          <p className="whitespace-pre-wrap text-gray-700">
            {errand.description}
          </p>
        </div>
      )}

      {/* 액션 버튼 (역할별로 다르게 표시) */}
      {user && (
        <ErrandActions
          errandId={errand.id}
          currentStatus={errand.status || 'open'}
          isRequester={isRequester}
          isAcceptor={isAcceptor}
          hasAcceptor={!!errand.accepted_by}
          currentUserId={user.id}
        />
      )}

      {!user && (
        <p className="text-sm text-gray-500 text-center py-4">
          심부름을 수락하려면 로그인이 필요해요.
        </p>
      )}

      {/* 댓글 섹션 */}
      <CommentSection postId={errand.id} postType="errand" />
    </div>
  )
}