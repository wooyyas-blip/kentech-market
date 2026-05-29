import Link from 'next/link'
import { ErrandWithUsers } from '@/lib/types'

// 변경 사항 (v2):
// - props 타입: Errand → ErrandWithUsers (수락자 닉네임 표시용)
// - 진행중/완료 카드에 "🏃 누구님이 도와주는 중" / "✅ 누구님이 도와줬어요" 추가
// - 목록 페이지의 쿼리도 acceptor JOIN 필요 (errands page.tsx 함께 수정)
const statusLabels = {
  open: { label: '🙋 요청중', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: '🏃 진행중', color: 'bg-yellow-100 text-yellow-700' },
  done: { label: '✅ 완료', color: 'bg-gray-200 text-gray-600' },
}

export default function ErrandCard({ errand }: { errand: ErrandWithUsers }) {
  const status = statusLabels[errand.status || 'open']
  const dDayText = errand.deadline
    ? getDDay(errand.deadline)
    : '마감 미정'

  // 수락자 안내 문구 (진행중/완료일 때만 의미 있음)
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
      className="block p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 line-clamp-1">
          {errand.title}
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${status.color}`}>
          {status.label}
        </span>
      </div>
      <p className="text-lg font-bold text-orange-600 mb-1">
        💰 {errand.reward.toLocaleString()}원
      </p>
      <p className="text-xs text-gray-500">⏰ {dDayText}</p>

      {/* 수락자 정보 (진행중/완료일 때만) */}
      {acceptorNote && (
        <p className="mt-2 text-xs text-gray-700 bg-gray-50 rounded px-2 py-1 inline-block">
          {acceptorNote}
        </p>
      )}
    </Link>
  )
}

function getDDay(deadline: string): string {
  const now = new Date()
  const dl = new Date(deadline)
  const diffMs = dl.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return '⌛ 마감됨'
  if (diffDays === 0) return '🔥 오늘 마감'
  return `D-${diffDays}`
}
