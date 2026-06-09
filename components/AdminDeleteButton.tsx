'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = { table: 'products' | 'errands'; id: string; redirectTo: string }

export default function AdminDeleteButton({ table, id, redirectTo }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('[관리자] 이 게시글을 삭제할까요? 되돌릴 수 없어요.')) return
    setLoading(true)
    const { error } = await supabase.from(table).delete().eq('id', id)
    setLoading(false)
    if (error) return alert('삭제 실패: ' + error.message)
    router.push(redirectTo)
  }

  return (
    <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
      <p className="mb-2 text-xs font-medium text-red-700">🛡️ 관리자 전용</p>
      <button onClick={handleDelete} disabled={loading}
        className="w-full rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
        {loading ? '삭제 중...' : '🗑️ 게시글 삭제 (관리자)'}
      </button>
    </div>
  )
}
