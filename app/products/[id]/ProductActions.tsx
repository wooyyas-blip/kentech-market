'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Status = 'selling' | 'reserved' | 'sold'

// 변경 사항 (v4):
// - 심부름과 동일한 "구매 요청 → 판매자 승인" 흐름
// - 케이스별 버튼:
//   1) 판매자 본인 + selling → 수정/삭제 (구매자 없으니까 판매완료 불가)
//   2) 판매자 본인 + reserved → 판매완료/수정/삭제
//   3) 판매자 본인 + sold → 후기 남기기
//   4) 구매자 본인 + reserved → 구매 취소 (마음 바뀜)
//   5) 구매자 본인 + sold → 후기 남기기
//   6) 제3자 + selling → "내가 살게요"
//   7) 제3자 + reserved/sold → 비활성 안내
type Props = {
  productId: string
  status: Status
  sellerId: string
  buyerId: string | null
  isLoggedIn: boolean
  currentUserId: string | null
}

export default function ProductActions({
  productId,
  status,
  sellerId,
  buyerId,
  isLoggedIn,
  currentUserId,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const isSeller = currentUserId === sellerId
  const isBuyer = currentUserId === buyerId

  // 구매 요청 (selling → reserved, buyer_id 본인으로)
  const handleBuy = async () => {
    if (!confirm('이 상품을 살게요. 판매자와 거래를 진행할까요?')) return
    if (!currentUserId) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .update({ buyer_id: currentUserId, status: 'reserved' })
      .eq('id', productId)
    setLoading(false)
    if (error) return alert('구매 요청 실패: ' + error.message)
    router.refresh()
  }

  // 구매 취소 (reserved → selling, buyer_id 비우기)
  const handleCancelBuy = async () => {
    if (!confirm('구매를 취소할까요?')) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .update({ buyer_id: null, status: 'selling' })
      .eq('id', productId)
    setLoading(false)
    if (error) return alert('취소 실패: ' + error.message)
    router.refresh()
  }

  // 판매 완료 (판매자만)
  const handleComplete = async () => {
    if (!confirm('판매가 완료됐나요? 완료 후엔 되돌릴 수 없어요.')) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .update({ status: 'sold' })
      .eq('id', productId)
    setLoading(false)
    if (error) return alert('판매완료 실패: ' + error.message)
    router.refresh()
  }

  // 삭제 (판매자만)
  const handleDelete = async () => {
    if (!confirm('정말 삭제할까요? 되돌릴 수 없어요.')) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', productId)
    setLoading(false)
    if (error) return alert('삭제 실패: ' + error.message)
    router.push('/products')
  }

  // 비로그인
  if (!isLoggedIn) {
    return (
      <div className="rounded-md bg-orange-50 p-3 text-sm text-orange-800">
        💡 구매하려면 로그인이 필요해요.
      </div>
    )
  }

  // 판매자 본인
  if (isSeller) {
    return (
      <div className="space-y-3">
        {status === 'selling' && (
          <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
            🔍 구매자를 기다리고 있어요. 누군가 &ldquo;살게요&rdquo;를 누르면 알림이 와요.
          </div>
        )}

        {status === 'reserved' && (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium"
          >
            ✅ 판매완료
          </button>
        )}

        {status === 'sold' && (
          <Link
            href={`/rate/product/${productId}`}
            className="block w-full rounded-md bg-orange-500 px-4 py-3 text-center font-medium text-white hover:bg-orange-600"
          >
            📝 구매자에게 후기 남기기
          </Link>
        )}

        {status !== 'sold' && (
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
        )}
      </div>
    )
  }

  // 구매자 본인
  if (isBuyer) {
    if (status === 'reserved') {
      return (
        <div className="space-y-2">
          <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm text-center">
            🛒 구매 요청 중이에요. 판매자가 판매완료 처리할 때까지 기다려주세요.
          </div>
          <button
            onClick={handleCancelBuy}
            disabled={loading}
            className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm"
          >
            구매 취소
          </button>
        </div>
      )
    }
    if (status === 'sold') {
      return (
        <Link
          href={`/rate/product/${productId}`}
          className="block w-full rounded-md bg-orange-500 px-4 py-3 text-center font-medium text-white hover:bg-orange-600"
        >
          📝 판매자에게 후기 남기기
        </Link>
      )
    }
  }

  // 제3자
  if (status === 'selling') {
    return (
      <button
        onClick={handleBuy}
        disabled={loading}
        className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
      >
        🛒 살게요
      </button>
    )
  }

  if (status === 'reserved') {
    return (
      <div className="p-3 bg-gray-100 text-gray-600 rounded-md text-sm text-center">
        🔒 다른 사람과 거래 중인 상품이에요
      </div>
    )
  }

  // sold + 제3자
  return (
    <div className="p-3 bg-gray-100 text-gray-500 rounded-md text-sm text-center">
      ✨ 판매완료된 상품이에요
    </div>
  )
}
