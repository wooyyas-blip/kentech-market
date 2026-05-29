'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'

// 상품 수정 페이지 (Client Component)
// products/new와 거의 동일하지만 :
// 1) 기존 상품 데이터를 useEffect로 fetch해 폼에 prefill
// 2) 본인 글이 아니거나 로그인 안 된 경우 차단 (RLS와 중복이지만 UX 좋음)
// 3) INSERT 대신 UPDATE
// 4) 이미지 업로드는 기존 사진 유지 + 추가 (간단 버전) — 풀 기능은 향후 작업
// MVP 기준이라 사진 수정은 일단 빼두고 텍스트 정보만 수정 가능하게 함
export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Next.js 16 — params is Promise, unwrap with use()
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  // 폼 상태
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')

  // 로딩/에러 상태
  const [initialLoading, setInitialLoading] = useState(true) // 초기 데이터 로딩
  const [submitting, setSubmitting] = useState(false) // 저장 중
  const [error, setError] = useState('')

  // 초기 데이터 fetch + 본인 글인지 검증
  useEffect(() => {
    const loadProduct = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !product) {
        setError('상품을 찾을 수 없어요.')
        setInitialLoading(false)
        return
      }

      // 본인 글이 아니면 차단
      if (product.user_id !== user.id) {
        setError('본인이 등록한 상품만 수정할 수 있어요.')
        setInitialLoading(false)
        return
      }

      // 폼 prefill
      setTitle(product.title)
      setDescription(product.description || '')
      setPrice(String(product.price))
      setCategory(product.category || '')
      setInitialLoading(false)
    }

    loadProduct()
    // supabase 인스턴스는 컴포넌트 마운트 동안 안정적이라 deps에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const priceNum = parseInt(price, 10)
    if (isNaN(priceNum) || priceNum < 0) {
      setError('가격을 올바르게 입력해주세요.')
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase
      .from('products')
      .update({
        title,
        description: description || null,
        price: priceNum,
        category: category || null,
      })
      .eq('id', id)
    setSubmitting(false)

    if (updateError) {
      setError('수정 실패: ' + updateError.message)
      return
    }

    // 성공 — 상세 페이지로
    router.push(`/products/${id}`)
    router.refresh()
  }

  // 초기 로딩 중
  if (initialLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 text-center text-gray-500">
        불러오는 중...
      </div>
    )
  }

  // 본인 글이 아니거나 못 찾은 경우
  if (error && !title) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
        <button
          onClick={() => router.push('/products')}
          className="mt-4 text-sm text-orange-600 hover:underline"
        >
          ← 상품 목록으로
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">✏️ 상품 수정</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">상품 설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">가격 (원) *</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min={0}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
          >
            <option value="">선택 안함</option>
            <option value="생활용품">생활용품</option>
            <option value="전자기기">전자기기</option>
            <option value="도서">도서</option>
            <option value="의류">의류</option>
            <option value="기타">기타</option>
          </select>
        </div>

        <p className="text-xs text-gray-500">
          💡 사진은 현재 페이지에서 수정할 수 없어요. 사진을 바꾸려면 상품을 삭제하고 새로 등록해주세요.
        </p>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push(`/products/${id}`)}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {submitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  )
}