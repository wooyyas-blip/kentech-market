'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('전자기기')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    // 현재 로그인된 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('로그인이 필요합니다.')
      setLoading(false)
      router.push('/login')
      return
    }

    // 가격 유효성 검사
    const priceNum = parseInt(price)
    if (isNaN(priceNum) || priceNum < 0) {
      setError('올바른 가격을 입력해주세요.')
      setLoading(false)
      return
    }

    // products 테이블에 INSERT
    const { data, error: insertError } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        title,
        description,
        price: priceNum,
        category,
        status: 'selling',
      })
      .select()
      .single()

    setLoading(false)

    if (insertError) {
      setError(`등록 실패: ${insertError.message}`)
      return
    }

    // 등록 성공 → 상세 페이지로 이동
    router.push(`/products/${data.id}`)
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">🥕 상품 등록</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 제목 */}
        <div>
          <label className="mb-1 block text-sm font-medium">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            placeholder="예: 자취방 의자 팝니다"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {/* 카테고리 */}
        <div>
          <label className="mb-1 block text-sm font-medium">카테고리 *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          >
            <option value="전자기기">전자기기</option>
            <option value="책/문구">책/문구</option>
            <option value="의류">의류</option>
            <option value="생활용품">생활용품</option>
            <option value="기숙사용품">기숙사용품</option>
            <option value="기타">기타</option>
          </select>
        </div>

        {/* 가격 */}
        <div>
          <label className="mb-1 block text-sm font-medium">가격 (원) *</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0"
            max="10000000"
            placeholder="예: 10000 (나눔이면 0)"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="mb-1 block text-sm font-medium">상품 설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="구매 시기, 사용 기간, 거래 장소(예: 기숙사 1층) 등을 적어주세요."
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-md bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600 disabled:bg-gray-400"
          >
            {loading ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  )
}