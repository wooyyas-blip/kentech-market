'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Status = 'selling' | 'reserved' | 'sold'

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
  const isBuyer = !!buyerId && currentUserId === buyerId
  const hasRequest = !!buyerId

  // 구매 요청 (selling 유지, buyer_id만 채움 + 판매자에게 쪽지 알림)
  const handleRequest = async () => {
    if (!confirm('이 상품 구매를 요청할까요? 판매자가 승인하면 예약이 확정돼요.')) return
    if (!currentUserId) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .update({ buyer_id: currentUserId })
      .eq('id', productId)
    if (error) { setLoading(false); return alert('요청 실패: ' + error.message) }

    const { data: prod } = await supabase.from('products').select('title').eq('id', productId).single()
    const title = prod?.title ?? '상품'
    await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: sellerId,
      content: `[구매 요청] "${title}" 구매를 요청했어요! 상품 상세에서 승인해주세요 🙏`,
      is_read: false,
    })

    setLoading(false)
    router.refresh()
  }

  // 요청 취소 (구매자가 승인 전에 무름)
  const handleCancelRequest = async () => {
    if (!confirm('구매 요청을 취소할까요?')) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .update({ buyer_id: null })
      .eq('id', productId)
    setLoading(false)
    if (error) return alert('취소 실패: ' + error.message)
    router.refresh()
  }

  // 판매자 승인 (selling + 요청 → reserved) + 구매자에게 쪽지
  const handleApprove = async () => {
    if (!confirm('구매 요청을 승인하고 예약중으로 바꿀까요?')) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .update({ status: 'reserved' })
      .eq('id', productId)
    if (error) { setLoading(false); return alert('승인 실패: ' + error.message) }
    if (buyerId && currentUserId) {
      await supabase.from('messages').insert({
        sender_id: currentUserId,
        receiver_id: buyerId,
        content: '구매 요청이 승인됐어요! 예약이 확정됐습니다 🎉',
        is_read: false,
      })
    }
    setLoading(false)
    router.refresh()
  }

  // 판매자 거절 (요청 비우기) + 구매자에게 쪽지
  const handleReject = async () => {
    if (!confirm('이 구매 요청을 거절할까요?')) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .update({ buyer_id: null })
      .eq('id', productId)
    if (error) { setLoading(false); return alert('거절 실패: ' + error.message) }
    if (buyerId && currentUserId) {
      await supabase.from('messages').insert({
        sender_id: currentUserId,
        receiver_id: buyerId,
        content: '아쉽지만 이번 구매 요청은 거절되었어요.',
        is_read: false,
      })
    }
    setLoading(false)
    router.refresh()
  }

  // 예약 취소 (구매자가 승인 후 무름 → selling 복귀)
  const handleCancelBuy = async () => {
    if (!confirm('예약을 취소할까요?')) return
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

  const handleComplete = async () => {
    if (!confirm('판매가 완료됐나요? 완료 후엔 되돌릴 수 없어요.')) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('products').update({ status: 'sold' }).eq('id', productId)
    setLoading(false)
    if (error) return alert('판매완료 실패: ' + error.message)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm('정말 삭제할까요? 되돌릴 수 없어요.')) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', productId)
    setLoading(false)
    if (error) return alert('삭제 실패: ' + error.message)
    router.push('/products')
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-md bg-indigo-50 p-3 text-sm text-indigo-800">
        💡 구매하려면 로그인이 필요해요.
      </div>
    )
  }

  const editDeleteRow = (
    <div className="flex gap-2">
      <Link href={`/products/${productId}/edit`} className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm text-gray-700 hover:bg-gray-50">
        ✏️ 수정
      </Link>
      <button onClick={handleDelete} disabled={loading} className="flex-1 rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">
        {loading ? '처리 중...' : '🗑️ 삭제'}
      </button>
    </div>
  )

  // 판매자 본인
  if (isSeller) {
    return (
      <div className="space-y-3">
        {status === 'selling' && hasRequest && (
          <div className="rounded-md bg-indigo-50 p-3 text-sm">
            <p className="mb-2 font-medium text-indigo-800">🔔 구매 요청이 도착했어요!</p>
            <div className="flex gap-2">
              <button onClick={handleApprove} disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium">
                ✅ 승인 (예약중으로)
              </button>
              <button onClick={handleReject} disabled={loading} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm">
                거절
              </button>
            </div>
          </div>
        )}

        {status === 'selling' && !hasRequest && (
          <div className="p-3 bg-gray-50 text-gray-600 rounded-md text-sm">
            🔍 구매자를 기다리고 있어요. 누군가 살게요를 누르면 쪽지로 알려드려요.
          </div>
        )}

        {status === 'reserved' && (
          <button onClick={handleComplete} disabled={loading} className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium">
            ✅ 판매완료
          </button>
        )}

        {status === 'sold' && (
          <Link href={`/rate/product/${productId}`} className="block w-full rounded-md bg-indigo-500 px-4 py-3 text-center font-medium text-white hover:bg-indigo-600">
            📝 구매자에게 후기 남기기
          </Link>
        )}

        {status !== 'sold' && editDeleteRow}
      </div>
    )
  }

  // 구매자(요청자) 본인
  if (isBuyer) {
    if (status === 'selling') {
      return (
        <div className="space-y-2">
          <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm text-center">
            ⏳ 구매 요청을 보냈어요. 판매자 승인을 기다리는 중이에요.
          </div>
          <button onClick={handleCancelRequest} disabled={loading} className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm">
            요청 취소
          </button>
        </div>
      )
    }
    if (status === 'reserved') {
      return (
        <div className="space-y-2">
          <div className="p-3 bg-indigo-50 text-indigo-800 rounded-md text-sm text-center">
            🎉 예약 확정! 판매자와 거래를 진행하세요.
          </div>
          <button onClick={handleCancelBuy} disabled={loading} className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm">
            예약 취소
          </button>
        </div>
      )
    }
    if (status === 'sold') {
      return (
        <Link href={`/rate/product/${productId}`} className="block w-full rounded-md bg-indigo-500 px-4 py-3 text-center font-medium text-white hover:bg-indigo-600">
          📝 판매자에게 후기 남기기
        </Link>
      )
    }
  }

  // 제3자
  if (status === 'selling') {
    if (hasRequest) {
      return (
        <div className="p-3 bg-gray-100 text-gray-600 rounded-md text-sm text-center">
          🛒 다른 사람이 구매 요청 중이에요
        </div>
      )
    }
    return (
      <button onClick={handleRequest} disabled={loading} className="w-full py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 font-medium">
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

  return (
    <div className="p-3 bg-gray-100 text-gray-500 rounded-md text-sm text-center">
      ✨ 판매완료된 상품이에요
    </div>
  )
}
