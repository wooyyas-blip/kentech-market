'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

type Props = { reportedId: string; productId?: string; errandId?: string }

export default function ReportButton({ reportedId, productId, errandId }: Props) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
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
          <textarea
            value={reason} onChange={(e) => setReason(e.target.value)}
            rows={2} maxLength={200}
            placeholder="신고 사유 (예: 거래 후 입금하지 않음)"
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
