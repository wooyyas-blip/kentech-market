import Link from 'next/link'
import { ErrandWithUsers } from '@/lib/types'

const statusLabels = {
  open: { label: '🙋 요청중', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: '🏃 진행중', color: 'bg-yellow-100 text-yellow-700' },
  done: { label: '✅ 완료', color: 'bg-gray-200 text-gray-600' },
}

export default function ErrandCard({ errand }: { errand: ErrandWithUsers }) {
  const status = statusLabels[errand.status || 'open']
  const isExpired =
    !!errand.deadline &&
    new Date(errand.deadline).getTime() < Date.now() &&
    errand.status !== 'done'
  const dDayText = errand.deadline ? getDDay(errand.deadline) : '마감 미정'

  const acceptorNote = (() => {
    if (!errand.acceptor) return null
    const nick = errand.acceptor.nickname
    if (errand.status === 'in_progress') return `🏃 ${nick}님이 도와주는 중`
    if (errand.status === 'done') return `✅ ${nick}님이 도와줬어요`
    return null
  })()

  return (
    <Link
      href={`/errands/${errand.id}`}
      className={`block p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition ${
        isExpired ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 line-clamp-1">{errand.title}</h3>
        {isExpired ? (
          <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2 bg-red-100 text-red-700">
            ⌛ 마감됨
          </span>
        ) : (
          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${status.color}`}>
            {status.label}
          </span>
        )}
      </div>
      <p className="text-lg font-bold text-indigo-600 mb-1">
        💰 {errand.reward.toLocaleString()}원
      </p>
      <p className={`text-xs ${isExpired ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
        ⏰ {dDayText}
      </p>

      {acceptorNote && (
        <p className="mt-2 text-xs text-gray-700 bg-gray-50 rounded px-2 py-1 inline-block">
          {acceptorNote}
        </p>
      )}
    </Link>
  )
}

function getDDay(deadline: string): string {
  // 한국시간 기준 '날짜'만 뽑아서 비교 (시:분 무시)
  const toKstDate = (d: Date) => {
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
    return Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate())
  }
  const today = toKstDate(new Date())
  const dl = toKstDate(new Date(deadline))
  const diffDays = Math.round((dl - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return '⌛ 마감됨'
  if (diffDays === 0) return '🔥 오늘 마감'
  return `D-${diffDays}`
}
