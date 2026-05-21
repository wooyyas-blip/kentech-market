import Link from 'next/link'
import { Errand } from '@/lib/types'

// 심부름 카드: 목록/홈에서 재사용
// products와 달리 마감기한과 보상이 강조됨
const statusLabels = {
  open: { label: '🙋 요청중', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: '🏃 진행중', color: 'bg-yellow-100 text-yellow-700' },
  done: { label: '✅ 완료', color: 'bg-gray-200 text-gray-600' },
}

export default function ErrandCard({ errand }: { errand: Errand }) {
  const status = statusLabels[errand.status || 'open']

  // 마감기한 D-day 계산 (발표 포인트: 날짜 차이 계산 로직)
  const dDayText = errand.deadline
    ? getDDay(errand.deadline)
    : '마감 미정'

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
    </Link>
  )
}

// 마감기한 → "D-3" / "D-day" / "마감됨" 형식 변환
function getDDay(deadline: string): string {
  const now = new Date()
  const dl = new Date(deadline)
  const diffMs = dl.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return '⌛ 마감됨'
  if (diffDays === 0) return '🔥 오늘 마감'
  return `D-${diffDays}`
}