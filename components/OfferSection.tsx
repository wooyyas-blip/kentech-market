'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const OFFER_MAX = 10000000

type Offer = {
  id: string
  amount: number
  status: string
  buyer_id: string
  buyer: { nickname: string } | { nickname: string }[] | null
}

type Props = {
  productId: string
  sellerId: string
  currentUserId: string | null
  isLoggedIn: boolean
  listedPrice: number
}

export default function OfferSection({ productId, sellerId, currentUserId, isLoggedIn, listedPrice }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [offers, setOffers] = useState<Offer[]>([])
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)

  const isSeller = currentUserId === sellerId

  const load = async () => {
    const { data } = await supabase
      .from('offers')
      .select('id, amount, status, buyer_id, buyer:users!offers_buyer_id_fkey (nickname)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
    setOffers((data as Offer[]) ?? [])
  }

  useEffect(() => {
    if (isLoggedIn) load()
  }, [])

  const nameOf = (o: Offer) => {
    const b = Array.isArray(o.buyer) ? o.buyer[0] : o.buyer
    return b?.nickname ?? '익명'
  }

  const submitOffer = async () => {
    const amt = parseInt(amount, 10)
    if (isNaN(amt) || amt < 0) return alert('금액을 올바르게 입력해주세요.')
    if (amt > listedPrice) return alert('제안가는 정가보다 높을 수 없어요.')
    if (!currentUserId) return
    setBusy(true)
    const { error } = await supabase.from('offers').insert({
      product_id: productId,
      buyer_id: currentUserId,
      seller_id: sellerId,
      amount: amt,
      status: 'pending',
    })
    if (error) { setBusy(false); return alert('제안 실패: ' + error.message) }
    await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: sellerId,
      content: `💰 가격 제안: ${amt.toLocaleString()}원을 제안했어요! 상품 상세에서 확인해주세요.`,
      is_read: false,
    })
    setBusy(false)
    setAmount('')
    load()
  }

  const accept = async (o: Offer) => {
    if (!confirm(`${o.amount.toLocaleString()}원 제안을 수락할까요? 가격이 이 금액으로 바뀌고 예약중이 돼요.`)) return
    if (!currentUserId) return
    setBusy(true)
    await supabase.from('offers').update({ status: 'accepted' }).eq('id', o.id)
    await supabase.from('offers').update({ status: 'rejected' }).eq('product_id', productId).eq('status', 'pending')
    const { error } = await supabase
      .from('products')
      .update({ price: o.amount, buyer_id: o.buyer_id, status: 'reserved' })
      .eq('id', productId)
    if (error) { setBusy(false); return alert('수락 실패: ' + error.message) }
    await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: o.buyer_id,
      content: `가격 제안(${o.amount.toLocaleString()}원)을 수락했어요! 예약이 확정됐습니다 🎉`,
      is_read: false,
    })
    setBusy(false)
    router.refresh()
  }

  const reject = async (o: Offer) => {
    if (!confirm('이 제안을 거절할까요?')) return
    if (!currentUserId) return
    setBusy(true)
    const { error } = await supabase.from('offers').update({ status: 'rejected' }).eq('id', o.id)
    if (error) { setBusy(false); return alert('거절 실패: ' + error.message) }
    await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: o.buyer_id,
      content: `${o.amount.toLocaleString()}원 가격 제안이 거절되었어요.`,
      is_read: false,
    })
    setBusy(false)
    load()
  }

  if (!isLoggedIn) return null

  const statusBadge = (s: string) => {
    if (s === 'accepted') return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">수락됨</span>
    if (s === 'rejected') return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">거절됨</span>
    return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">대기중</span>
  }

  // 판매자: 받은 제안 목록 + 수락/거절
  if (isSeller) {
    const pending = offers.filter((o) => o.status === 'pending')
    return (
      <div className="mt-4 rounded-md border border-gray-200 p-3">
        <p className="mb-2 text-sm font-medium text-gray-700">💬 받은 가격 제안 ({pending.length})</p>
        {offers.length === 0 ? (
          <p className="text-sm text-gray-500">아직 받은 제안이 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {offers.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{nameOf(o)}</span>
                  <span className="text-indigo-600 font-medium">{o.amount.toLocaleString()}원</span>
                  {statusBadge(o.status)}
                </div>
                {o.status === 'pending' && (
                  <div className="flex gap-1">
                    <button onClick={() => accept(o)} disabled={busy} className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 disabled:opacity-50">수락</button>
                    <button onClick={() => reject(o)} disabled={busy} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 disabled:opacity-50">거절</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  // 구매자: 제안 폼 + 내 제안 상태
  return (
    <div className="mt-4 rounded-md border border-gray-200 p-3">
      <p className="mb-2 text-sm font-medium text-gray-700">💬 가격 제안하기</p>
      <div className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={0}
          max={listedPrice}
          placeholder="제안할 금액을 입력하세요"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
        />
        <button onClick={submitOffer} disabled={busy || !amount} className="px-4 py-2 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 disabled:opacity-50">
          제안
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1">정가 {listedPrice.toLocaleString()}원</p>

      {offers.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-gray-100 pt-2">
          {offers.map((o) => (
            <li key={o.id} className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">내 제안</span>
              <span className="font-medium text-indigo-600">{o.amount.toLocaleString()}원</span>
              {statusBadge(o.status)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
