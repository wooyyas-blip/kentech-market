import { createClient } from '@/lib/supabase/server'

// 특정 사용자가 받은 후기 목록 (Server Component)
// 마이페이지, 향후 프로필 페이지에서 재사용
type Props = {
  userId: string
  limit?: number // 기본 전체, 일부만 보이고 싶으면 5 등
}

const typeLabels: Record<string, { emoji: string; label: string; color: string }> = {
  great: { emoji: '🤩', label: '정말 좋았어요', color: 'text-green-700 bg-green-50' },
  good: { emoji: '😊', label: '좋았어요', color: 'text-blue-700 bg-blue-50' },
  normal: { emoji: '😐', label: '보통이에요', color: 'text-gray-700 bg-gray-100' },
  bad: { emoji: '😞', label: '아쉬웠어요', color: 'text-indigo-700 bg-indigo-50' },
  terrible: { emoji: '😡', label: '불쾌했어요', color: 'text-red-700 bg-red-50' },
}

export default async function RatingList({ userId, limit }: Props) {
  const supabase = await createClient()

  // 받은 후기 + 작성자 닉네임 JOIN
  let query = supabase
    .from('ratings')
    .select(`
      id, rating_type, comment, created_at,
      rater:users!ratings_rater_id_fkey (id, nickname)
    `)
    .eq('rated_id', userId)
    .order('created_at', { ascending: false })

  if (limit) query = query.limit(limit)

  const { data: ratings, error } = await query

  if (error) {
    return <p className="text-sm text-red-500">후기 불러오기 실패</p>
  }

  if (!ratings || ratings.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-6 text-center">
        아직 받은 후기가 없어요
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {ratings.map((r) => {
        const typeInfo = typeLabels[r.rating_type] || typeLabels.normal
        // Supabase JOIN 결과는 배열 또는 단일 객체 — 안전하게 처리
        const rater = Array.isArray(r.rater) ? r.rater[0] : r.rater
        const raterNickname = rater?.nickname || '익명'
        return (
          <li key={r.id} className="p-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{typeInfo.emoji}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
                <span className="text-xs text-gray-500">by {raterNickname}</span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(r.created_at).toLocaleDateString('ko-KR', {
                  month: 'short', day: 'numeric',
                })}
              </span>
            </div>
            {r.comment && (
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                {r.comment}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
