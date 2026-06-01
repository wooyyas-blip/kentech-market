'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Status = 'selling' | 'reserved' | 'sold'

const statusOptions: { value: Status; label: string }[] = [
  { value: 'selling', label: '판매중' },
  { value: 'reserved', label: '예약중' },
  { value: 'sold', label: '거래완료' },
]

// 변경 사항 (v3):
// - sold 상태 + 다른 사람 글이면 "후기 남기기" 버튼 추가
// - 본인 글이면 기존대로 상태 변경/수정/삭제
export default function ProductActions({
  productId,
  status,
  isOwner,
  isLoggedIn,
}: {
  productId: string
  status: Status
  isOwner: boolean
  isLoggedIn: boolean
  sellerId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: Status) => {
    if (!confirm(`상태를 "${statusOptions.find(s => s.value === newStatus)?.label}"(으)로 바꿀까요?`)) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .update({ status: newStatus })
      .eq('id', productId)
    setLoading(false)
    if (error) return alert(`상태 변경 실패: ${error.message}`)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm('정말 삭제할까요? 되돌릴 수 없어요.')) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', productId)
    setLoading(false)
    if (error) return alert(`삭제 실패: ${error.message}`)
    router.push('/products')
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-md bg-orange-50 p-3 text-sm text-orange-800">
        💡 쪽지를 보내려면 로그인이 필요해요.
      </div>
    )
  }

  if (isOwner) {
    return (
      <div className="space-y-3">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">거래 상태 변경</p>
          <div className="flex gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                disabled={loading || status === option.value}
                className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
                  status === option.value
                    ? 'border-orange-500 bg-orange-50 font-medium text-orange-600'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/products/${productId}/edit`}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm text-gray-700 hover:bg-gray-50"
          >
            ✏️ 수정
          </Link>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {loading ? '처리 중...' : '🗑️ 삭제'}
          </button>
        </div>
      </div>
    )
  }

  // 다른 사람 상품 + 거래완료 → 후기 남기기 버튼
  if (status === 'sold') {
    return (
      <Link
        href={`/rate/product/${productId}`}
        className="block w-full rounded-md bg-orange-500 px-4 py-3 text-center font-medium text-white hover:bg-orange-600"
      >
        📝 후기 남기기
      </Link>
    )
  }

  // 다른 사람 상품 + 판매중/예약중 → 쪽지
  return (
    <Link
      href={`/messages/${productId}`}
      className="block w-full rounded-md bg-orange-500 px-4 py-3 text-center font-medium text-white hover:bg-orange-600"
    >
      💬 쪽지 보내기
    </Link>
  )
}
