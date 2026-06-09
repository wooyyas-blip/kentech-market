'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

type Props = { reportedId: string; productId?: string; errandId?: string }

const TYPES = [
  { value: 'unpaid', label: '💸 미입금' },
  { value: 'noshow', label: '🚫 노쇼(약속 불이행)' },
  { value: 'other', label: '❓ 기타' },
]

export default function ReportButton({ reportedId, productId, errandId }: Props) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('noshow')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    const trimmed = reason.trim()
    if (!trimmed) return alert('신고 사유를 입력해주세요.')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('로그인이 필요해요.')
    if (user.id === reportedId) return alert('본인은 신고할 수 없어요.')

    setLoading(true)
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_id: reportedId,
      product_id: productId ?? null,
      errand_id: errandId ?? null,
      report_type: type,
      reason: trimmed,
    })
    setLoading(false)
    if (error) return alert('신고 실패: ' + error.message)
    setDone(true); setOpen(false); setReason('')
  }

  if (done) return <p className="text-xs text-gray-500">🚨 신고가 접수됐어요. 관리자가 확인할게요.</p>

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} className="text-xs text-gray-400 hover:text-red-500">
        🚨 신고
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-lg border border-gray-200 p-3">
          <div className="flex flex-wrap gap-1">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`px-2 py-1 text-xs rounded-full border ${
                  type === t.value
                    ? 'border-red-400 bg-red-50 text-red-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={reason} onChange={(e) => setReason(e.target.value)}
            rows={2} maxLength={200}
            placeholder="신고 사유 (예: 약속 시간에 안 나타남)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-400 text-sm"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm text-gray-500">취소</button>
            <button onClick={handleSubmit} disabled={loading || !reason.trim()}
              className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50">
              {loading ? '접수 중...' : '신고하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
