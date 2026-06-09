'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const FLAGS = [
  { type: 'unpaid', label: '⚠️ 미입금' },
  { type: 'noshow', label: '🚫 노쇼' },
  { type: 'fake',   label: '📛 허위매물' },
  { type: 'rude',   label: '😤 매너나쁨' },
  { type: 'abuse',  label: '🤬 욕설·비방' },
]

type Props = {
  reportId: string
  reportedId: string
  status: string
}

export default function AdminReportActions({ reportId, reportedId, status }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [myFlags, setMyFlags] = useState<string[]>([])

  const loadFlags = async () => {
    const { data } = await supabase.from('user_flags').select('flag_type').eq('user_id', reportedId)
    setMyFlags((data ?? []).map((f) => f.flag_type))
  }

  useEffect(() => {
    loadFlags()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addFlag = async (type: string) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('user_flags').insert({
      user_id: reportedId,
      flag_type: type,
      created_by: user?.id ?? null,
    })
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId)
    setLoading(false)
    if (error) return alert('표식 실패: ' + error.message)
    await loadFlags()
    router.refresh()
  }

  const removeFlag = async (type: string) => {
    setLoading(true)
    // 같은 유형이 여러 개면 하나만 지우기 위해 id 하나 찾아서 삭제
    const { data: rows } = await supabase
      .from('user_flags').select('id').eq('user_id', reportedId).eq('flag_type', type).limit(1)
    const targetId = rows?.[0]?.id
    if (targetId) {
      const { error } = await supabase.from('user_flags').delete().eq('id', targetId)
      if (error) { setLoading(false); return alert('해제 실패: ' + error.message) }
    }
    setLoading(false)
    await loadFlags()
    router.refresh()
  }

  const handleDismiss = async () => {
    setLoading(true)
    const { error } = await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId)
    setLoading(false)
    if (error) return alert('처리 실패: ' + error.message)
    router.refresh()
  }

  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      <p className="text-xs text-gray-500">표식 달기 (누르면 추가 / 이미 있으면 ✓):</p>
      <div className="flex flex-wrap gap-1.5">
        {FLAGS.map((f) => {
          const has = myFlags.includes(f.type)
          return (
            <button
              key={f.type}
              onClick={() => (has ? removeFlag(f.type) : addFlag(f.type))}
              disabled={loading}
              className={`px-2.5 py-1 text-xs rounded-full border disabled:opacity-50 ${
                has
                  ? 'border-red-400 bg-red-50 text-red-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {has ? '✓ ' : '+ '}{f.label}
            </button>
          )
        })}
      </div>
      {status === 'pending' && (
        <button onClick={handleDismiss} disabled={loading}
          className="px-3 py-1.5 bg-white border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50">
          기각
        </button>
      )}
    </div>
  )
}
