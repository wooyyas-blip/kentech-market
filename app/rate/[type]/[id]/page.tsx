'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// 평가 페이지 — 거래 완료된 글에 대해 상대방 평가
// URL: /rate/product/[productId] 또는 /rate/errand/[errandId]
// 정책:
// - 본인이 본인을 평가 불가 (DB CHECK)
// - 동일 거래에 두 번 평가 불가 (DB UNIQUE + 클라 확인)
// - 거래가 완료(sold/done) 상태여야 평가 가능
const ratingOptions = [
  { type: 'great', emoji: '🤩', label: '정말 좋았어요', desc: '+0.5℃', color: 'border-green-400 bg-green-50 text-green-700' },
  { type: 'good', emoji: '😊', label: '좋았어요', desc: '+0.2℃', color: 'border-blue-400 bg-blue-50 text-blue-700' },
  { type: 'normal', emoji: '😐', label: '보통이에요', desc: '±0℃', color: 'border-gray-400 bg-gray-50 text-gray-700' },
  { type: 'bad', emoji: '😞', label: '아쉬웠어요', desc: '-0.5℃', color: 'border-orange-400 bg-orange-50 text-orange-700' },
  { type: 'terrible', emoji: '😡', label: '불쾌했어요', desc: '-1.0℃', color: 'border-red-400 bg-red-50 text-red-700' },
]

export default function RatePage({
  params,
}: {
  params: Promise<{ type: string; id: string }>
}) {
  const { type, id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [initialLoading, setInitialLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 평가 대상 정보
  const [targetUserId, setTargetUserId] = useState<string | null>(null)
  const [targetNickname, setTargetNickname] = useState('')
  const [postTitle, setPostTitle] = useState('')

  // 폼 상태
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [comment, setComment] = useState('')

  // type 유효성 (product 또는 errand)
  const isProduct = type === 'product'
  const isErrand = type === 'errand'

  useEffect(() => {
    const load = async () => {
      if (!isProduct && !isErrand) {
        setError('잘못된 평가 경로예요.')
        setInitialLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // 글 정보 조회
      const tableName = isProduct ? 'products' : 'errands'
      const { data: post, error: postErr } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (postErr || !post) {
        setError('대상을 찾을 수 없어요.')
        setInitialLoading(false)
        return
      }

      // 거래 완료 상태인지 확인
      if (isProduct && post.status !== 'sold') {
        setError('거래완료된 상품에만 후기를 남길 수 있어요.')
        setInitialLoading(false)
        return
      }
      if (isErrand && post.status !== 'done') {
        setError('완료된 심부름에만 후기를 남길 수 있어요.')
        setInitialLoading(false)
        return
      }

      // 평가 대상 결정
      // 상품: 본인이 글쓴이면 → 평가 불가 (구매자 식별 어려움, MVP)
      //       본인이 글쓴이가 아니면 → 글쓴이(판매자) 평가
      // 심부름: 본인이 글쓴이(요청자)면 → 수락자 평가
      //         본인이 수락자면 → 요청자 평가
      let ratedUserId: string | null = null
      if (isProduct) {
        if (post.user_id === user.id) {
          setError('본인이 등록한 상품엔 후기를 남길 수 없어요. (MVP 한계 — 구매자 평가는 다음 버전에서)')
          setInitialLoading(false)
          return
        }
        ratedUserId = post.user_id
      } else {
        // 심부름
        if (post.user_id === user.id) {
          // 요청자 → 수락자 평가
          if (!post.accepted_by) {
            setError('수락자가 없는 심부름은 평가할 수 없어요.')
            setInitialLoading(false)
            return
          }
          ratedUserId = post.accepted_by
        } else if (post.accepted_by === user.id) {
          // 수락자 → 요청자 평가
          ratedUserId = post.user_id
        } else {
          setError('이 심부름과 관련이 없어요.')
          setInitialLoading(false)
          return
        }
      }

      // 이미 평가한 적 있는지 확인 (이중 안전망)
      const fkColumn = isProduct ? 'product_id' : 'errand_id'
      const { data: existing } = await supabase
        .from('ratings')
        .select('id')
        .eq('rater_id', user.id)
        .eq('rated_id', ratedUserId)
        .eq(fkColumn, id)
        .maybeSingle()

      if (existing) {
        setError('이미 이 거래에 후기를 남겼어요.')
        setInitialLoading(false)
        return
      }

      // 평가 대상 닉네임 조회
      const { data: targetUser } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', ratedUserId)
        .single()

      setTargetUserId(ratedUserId)
      setTargetNickname(targetUser?.nickname || '익명')
      setPostTitle(post.title)
      setInitialLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, type])

  const handleSubmit = async () => {
    if (!selectedType || !targetUserId) return
    setError('')
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const insertData: {
      rater_id: string
      rated_id: string
      rating_type: string
      comment: string | null
      product_id?: string
      errand_id?: string
    } = {
      rater_id: user.id,
      rated_id: targetUserId,
      rating_type: selectedType,
      comment: comment.trim() || null,
    }
    if (isProduct) insertData.product_id = id
    else insertData.errand_id = id

    const { error: insertErr } = await supabase.from('ratings').insert(insertData)
    setSubmitting(false)

    if (insertErr) {
      // UNIQUE 제약 위반
      if (insertErr.message.includes('duplicate')) {
        setError('이미 이 거래에 후기를 남겼어요.')
      } else {
        setError('후기 작성 실패: ' + insertErr.message)
      }
      return
    }

    // 성공 → 원래 상세 페이지로
    router.push(isProduct ? `/products/${id}` : `/errands/${id}`)
    router.refresh()
  }

  if (initialLoading) {
    return <div className="max-w-md mx-auto p-8 text-center text-gray-500">불러오는 중...</div>
  }

  if (error && !targetUserId) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/" className="text-orange-600 hover:underline">홈으로</Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">📝 거래 후기</h1>
      <p className="text-sm text-gray-600 mb-1">
        <span className="font-medium text-gray-900">{targetNickname}</span>님과의 거래는 어땠나요?
      </p>
      <p className="text-xs text-gray-500 mb-6">"{postTitle}"</p>

      <div className="space-y-2 mb-6">
        {ratingOptions.map((opt) => (
          <button
            key={opt.type}
            onClick={() => setSelectedType(opt.type)}
            disabled={submitting}
            className={`w-full p-3 rounded-lg border-2 text-left transition ${
              selectedType === opt.type
                ? opt.color + ' font-medium'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            } disabled:opacity-50`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{opt.emoji}</span>
                <span>{opt.label}</span>
              </div>
              <span className="text-xs text-gray-500">{opt.desc}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          한마디 남기기 (선택)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={200}
          placeholder="이런 점이 좋았어요 / 아쉬웠어요"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">{comment.length}/200</p>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => router.back()}
          disabled={submitting}
          className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedType}
          className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          {submitting ? '제출 중...' : '후기 남기기'}
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        ⚠️ 후기는 수정/삭제할 수 없어요. 신중하게 작성해주세요.
      </p>
    </div>
  )
}
