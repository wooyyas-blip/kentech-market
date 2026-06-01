import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ErrandActions from './ErrandActions'
import CommentSection from '@/components/CommentSection'
import SendMessageButton from '@/components/SendMessageButton'

// 변경 사항 (v3):
// - 요청자 옆에 매너온도 + 받은 후기 개수 표시
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

  const { data: { user } } = await supabase.auth.getUser()

  const { data: errand, error } = await supabase
    .from('errands')
    .select(`
      *,
      requester:users!errands_user_id_fkey (id, nickname, email, manner_temperature),
      acceptor:users!errands_accepted_by_fkey (id, nickname, email, manner_temperature)
    `)
    .eq('id', id)
    .single()

  if (error || !errand) notFound()

  // 요청자가 받은 후기 개수
  const { count: requesterRatingCount } = await supabase
    .from('ratings')
    .select('id', { count: 'exact', head: true })
    .eq('rated_id', errand.user_id)

  const status = statusLabels[(errand.status as keyof typeof statusLabels) || 'open']
  const isRequester = user?.id === errand.user_id
  const isAcceptor = user?.id === errand.accepted_by
  const requesterTemp = Number(errand.requester?.manner_temperature ?? 36.5)

  const deadlineText = errand.deadline
    ? new Date(errand.deadline).toLocaleString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '미정'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-4">
        <span className={`text-sm px-3 py-1 rounded-full ${status.color}`}>
          {status.label}
        </span>
      </div>
      <h1 className="text-2xl font-bold mb-2">{errand.title}</h1>

      <p className="text-3xl font-bold text-orange-600 mb-6">
        💰 {errand.reward.toLocaleString()}원
      </p>

      <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-500">요청자: </span>
            <span className="font-medium">
              {errand.requester?.nickname || '알 수 없음'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
              🌡️ {requesterTemp.toFixed(1)}℃
            </span>
            <span className="text-xs text-gray-500">
              · 후기 {requesterRatingCount ?? 0}개
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

      {errand.description && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">상세 설명</h2>
          <p className="whitespace-pre-wrap text-gray-700">
            {errand.description}
          </p>
        </div>
      )}

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

      <CommentSection postId={errand.id} postType="errand" />
    </div>
  )
}
