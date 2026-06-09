"use client"

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = { reportId: string; reportedId: string; status: string; isUnpaid: boolean }

export default function AdminReportActions({ reportId, reportedId, status, isUnpaid }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleMark = async (mark: boolean) => {
    if (!confirm(mark ? '이 사용자에게 미입금자 표식을 달까요?' : '미입금자 표식을 해제할까요?')) return
    setLoading(true)
    const { error } = await supabase.from('users').update({
      is_unpaid: mark,
      unpaid_reason: mark ? '미입금 신고 처리' : null,
      unpaid_marked_at: mark ? new Date().toISOString() : null,
    }).eq('id', reportedId)
    if (error) { setLoading(false); return alert('표식 변경 실패: ' + error.message) }
    if (mark) await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId)
    setLoading(false); router.refresh()
  }

  const handleDismiss = async () => {
    setLoading(true)
    const { error } = await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId)
    setLoading(false)
    if (error) return alert('처리 실패: ' + error.message)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
      {!isUnpaid ? (
        <button onClick={() => handleMark(true)} disabled={loading}
          className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50">
          ⚠️ 미입금자 표식 달기
        </button>
      ) : (
        <button onClick={() => handleMark(false)} disabled={loading}
          className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50">
          표식 해제
        </button>
      )}
      {status === 'pending' && (
        <button onClick={handleDismiss} disabled={loading}
          className="px-3 py-1.5 bg-white border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50">
          기각
        </button>
      )}
    </div>
  )
}
