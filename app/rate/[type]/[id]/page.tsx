'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// 변경 사항 (v2):
// - 상품 평가도 심부름처럼 양방향 평가 가능 (판매자 ↔ 구매자)
// - 구매자가 있으면 판매자/구매자 서로 평가 가능
const ratingOptions = [
  { type: 'great', emoji: '🤩', label: '정말 좋았어요', desc: '+0.5℃', color: 'border-green-400 bg-green-50 text-green-700' },
  { type: 'good', emoji: '😊', label: '좋았어요', desc: '+0.2℃', color: 'border-blue-400 bg-blue-50 text-blue-700' },
  { type: 'normal', emoji: '😐', label: '보통이에요', desc: '±0℃', color: 'border-gray-400 bg-gray-50 text-gray-700' },
  { type: 'bad', emoji: '😞', label: '아쉬웠어요', desc: '-0.5℃', color: 'border-indigo-400 bg-indigo-50 text-indigo-700' },
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

  const [targetUserId, setTargetUserId] = useState<string | null>(null)
  const [targetNickname, setTargetNickname] = useState('')
  const [postTitle, setPostTitle] = useState('')

  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [comment, setComment] = useState('')

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

      // 평가 대상 결정 (양방향)
      let ratedUserId: string | null = null
      if (isProduct) {
        // 상품: 판매자(user_id) ↔ 구매자(buyer_id)
        if (post.user_id === user.id) {
          // 본인이 판매자 → 구매자 평가
          if (!post.buyer_id) {
            setError('구매자가 지정되지 않은 상품은 평가할 수 없어요.')
            setInitialLoading(false)
            return
          }
          ratedUserId = post.buyer_id
        } else if (post.buyer_id === user.id) {
          // 본인이 구매자 → 판매자 평가
          ratedUserId = post.user_id
        } else {
          setError('이 거래와 관련이 없어요.')
          setInitialLoading(false)
          return
        }
      } else {
        // 심부름: 요청자(user_id) ↔ 수락자(accepted_by)
        if (post.user_id === user.id) {
          if (!post.accepted_by) {
            setError('수락자가 없는 심부름은 평가할 수 없어요.')
            setInitialLoading(false)
            return
          }
          ratedUserId = post.accepted_by
        } else if (post.accepted_by === user.id) {
          ratedUserId = post.user_id
        } else {
          setError('이 심부름과 관련이 없어요.')
          setInitialLoading(false)
          return
        }
      }

      // 이미 평가한 적 있는지
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
      if (insertErr.message.includes('duplicate')) {
        setError('이미 이 거래에 후기를 남겼어요.')
      } else {
        setError('후기 작성 실패: ' + insertErr.message)
      }
      return
    }

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
        <Link href="/" className="text-indigo-600 hover:underline">홈으로</Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">📝 거래 후기</h1>
      <p className="text-sm text-gray-600 mb-1">
        <span className="font-medium text-gray-900">{targetNickname}</span>님과의 거래는 어땠나요?
      </p>
      <p className="text-xs text-gray-500 mb-6">&ldquo;{postTitle}&rdquo;</p>

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
        <label className="block text-sm font-medium mb-1">한마디 남기기 (선택)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={200}
          placeholder="이런 점이 좋았어요 / 아쉬웠어요"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
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
          className="flex-1 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
        >
          {submitting ? '제출 중...' : '후기 남기기'}
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        ⚠️ 후기는 수정/삭제할 수 없어요.
      </p>
    </div>
  )
}
