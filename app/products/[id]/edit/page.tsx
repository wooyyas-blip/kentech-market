'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'

const TITLE_MAX = 50
const DESC_MAX = 500

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')

  const [initialLoading, setInitialLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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
      if (product.user_id !== user.id) {
        setError('본인이 등록한 상품만 수정할 수 있어요.')
        setInitialLoading(false)
        return
      }
      setTitle(product.title)
      setDescription(product.description || '')
      setPrice(String(product.price))
      setCategory(product.category || '')
      setInitialLoading(false)
    }
    loadProduct()
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
    router.push(`/products/${id}`)
    router.refresh()
  }

  if (initialLoading) {
    return <div className="max-w-xl mx-auto px-4 py-8 text-center text-gray-500">불러오는 중...</div>
  }
  if (error && !title) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
        <button onClick={() => router.push('/products')} className="mt-4 text-sm text-orange-600 hover:underline">← 상품 목록으로</button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">✏️ 상품 수정</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">제목 *</label>
            <span className="text-xs text-gray-400">{title.length}/{TITLE_MAX}</span>
          </div>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={TITLE_MAX} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">상품 설명</label>
            <span className="text-xs text-gray-400">{description.length}/{DESC_MAX}</span>
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={DESC_MAX} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">가격 (원) *</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min={0} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">카테고리</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500">
            <option value="">선택 안함</option>
            <option value="생활용품">생활용품</option>
            <option value="전자기기">전자기기</option>
            <option value="도서">도서</option>
            <option value="의류">의류</option>
            <option value="기타">기타</option>
          </select>
        </div>

        <p className="text-xs text-gray-500">💡 사진은 현재 페이지에서 수정할 수 없어요.</p>
        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={() => router.push(`/products/${id}`)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">취소</button>
          <button type="submit" disabled={submitting} className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">{submitting ? '저장 중...' : '저장'}</button>
        </div>
      </form>
    </div>
  )
}
