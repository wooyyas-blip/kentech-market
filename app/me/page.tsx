import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RatingList from '@/components/RatingList'

// 변경 사항 (v2):
// - "받은 후기" 섹션 추가 (매너온도 산정 근거 보여주기)
// - 후기 개수도 함께 표시
export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nickname, email, created_at, manner_temperature')
    .eq('id', user.id)
    .single()

  // 받은 후기 개수
  const { count: ratingCount } = await supabase
    .from('ratings')
    .select('id', { count: 'exact', head: true })
    .eq('rated_id', user.id)

  const temp = Number(profile?.manner_temperature ?? 36.5)
  const tempLabel = getTempLabel(temp)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">👤 내 정보</h1>

      {/* 매너온도 카드 */}
      <div className="rounded-xl bg-gradient-to-br from-orange-50 to-yellow-50 p-6 mb-6 text-center border border-orange-100">
        <p className="text-sm text-gray-600 mb-2">매너온도</p>
        <p className="text-5xl font-bold text-orange-600 mb-2">
          🌡️ {temp.toFixed(1)}℃
        </p>
        <p className="text-sm text-gray-700 font-medium">{tempLabel}</p>
        <p className="text-xs text-gray-500 mt-2">
          받은 후기 {ratingCount ?? 0}개 기준 · 거래마다 자동 갱신돼요
        </p>
      </div>

      {/* 기본 정보 */}
      <div className="rounded-xl bg-white border border-gray-200 p-4 mb-6 space-y-3">
        <Row label="닉네임" value={profile?.nickname || '-'} />
        <Row label="이메일" value={profile?.email || user.email || '-'} sub="🔒 켄텍 이메일은 변경 불가" />
        <Row
          label="가입일"
          value={profile?.created_at
            ? new Date(profile.created_at).toLocaleDateString('ko-KR')
            : '-'}
        />
      </div>

      {/* 메뉴 */}
      <div className="space-y-2 mb-6">
        <Link
          href="/me/edit-nickname"
          className="block p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
        >
          ✏️ 닉네임 변경
        </Link>
        <Link
          href="/me/edit-password"
          className="block p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
        >
          🔑 비밀번호 변경
        </Link>
        <Link
          href="/messages"
          className="block p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
        >
          ✉️ 쪽지함
        </Link>
      </div>

      {/* 받은 후기 */}
      <section>
        <h2 className="text-lg font-bold mb-3">💬 받은 후기 ({ratingCount ?? 0})</h2>
        <RatingList userId={user.id} />
      </section>
    </div>
  )
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function getTempLabel(t: number): string {
  if (t >= 50) return '🔥 칭찬받는 켄텍러'
  if (t >= 40) return '😊 친절한 켄텍러'
  if (t >= 36.5) return '🙂 정직한 켄텍러'
  if (t >= 30) return '😐 무난한 켄텍러'
  return '🥶 주의가 필요한 켄텍러'
}
