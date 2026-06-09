const FLAG_META: Record<string, { label: string; color: string }> = {
  unpaid: { label: '⚠️ 미입금자', color: 'bg-red-100 text-red-700' },
  noshow: { label: '🚫 노쇼', color: 'bg-orange-100 text-orange-700' },
  fake:   { label: '📛 허위매물', color: 'bg-rose-100 text-rose-700' },
  rude:   { label: '😤 거래매너 나쁨', color: 'bg-amber-100 text-amber-700' },
  abuse:  { label: '🤬 욕설·비방', color: 'bg-red-100 text-red-700' },
}

export const FLAG_TYPES = Object.keys(FLAG_META)
export function flagLabel(type: string) {
  return FLAG_META[type]?.label ?? type
}

// 표식 목록(중복 제거 + 노쇼는 횟수 표시)
export default function UserFlags({ flags }: { flags: { flag_type: string }[] }) {
  if (!flags || flags.length === 0) return null

  const counts: Record<string, number> = {}
  for (const f of flags) counts[f.flag_type] = (counts[f.flag_type] ?? 0) + 1

  return (
    <>
      {Object.entries(counts).map(([type, count]) => {
        const meta = FLAG_META[type]
        if (!meta) return null
        return (
          <span key={type} className={`text-xs px-2 py-0.5 rounded-full ${meta.color}`}>
            {meta.label}{count > 1 ? ` ${count}회` : ''}
          </span>
        )
      })}
    </>
  )
}
