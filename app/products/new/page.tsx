'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const MAX_IMAGES = 3
const TITLE_MAX = 50
const DESC_MAX = 500
const PRICE_MAX = 10000000

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')

  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const newFiles = Array.from(files)
    const totalCount = images.length + newFiles.length
    if (totalCount > MAX_IMAGES) {
      alert(`사진은 최대 ${MAX_IMAGES}장까지만 올릴 수 있어요.`)
      return
    }
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
    setImages([...images, ...newFiles])
    setPreviews([...previews, ...newPreviews])
    e.target.value = ''
  }

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setImages(images.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('로그인이 필요해요.')
      return
    }

    const priceNum = parseInt(price, 10)
    if (isNaN(priceNum) || priceNum < 0) {
      setError('가격을 올바르게 입력해주세요.')
      return
    }
    if (priceNum > PRICE_MAX) {
      setError(`가격은 최대 ${PRICE_MAX.toLocaleString()}원까지 등록할 수 있어요.`)
      return
    }

    setLoading(true)
    try {
      const uploadedUrls: string[] = []
      for (const file of images) {
        const ext = file.name.split('.').pop()
        const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
        const filepath = `${user.id}/${filename}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filepath, file)

        if (uploadError) throw new Error(`사진 업로드 실패: ${uploadError.message}`)

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filepath)
        uploadedUrls.push(publicUrl)
      }

      const { data, error: insertError } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          price: priceNum,
          category: category || null,
          status: 'selling',
          image_urls: uploadedUrls,
        })
        .select()
        .single()

      if (insertError) throw new Error(`등록 실패: ${insertError.message}`)
      router.push(`/products/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">🛍️ 상품 등록</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            사진 ({images.length}/{MAX_IMAGES})
          </label>
          <div className="flex gap-2 flex-wrap">
            {previews.map((url, index) => (
              <div key={index} className="relative w-24 h-24">
                <img src={url} alt={`미리보기 ${index + 1}`} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                >✕</button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition">
                <span className="text-2xl text-gray-400">📷</span>
                <span className="text-xs text-gray-500 mt-1">사진 추가</span>
                <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">제목 *</label>
            <span className="text-xs text-gray-400">{title.length}/{TITLE_MAX}</span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={TITLE_MAX}
            placeholder="예: 자취방 의자 팝니다"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">상품 설명</label>
            <span className="text-xs text-gray-400">{description.length}/{DESC_MAX}</span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={DESC_MAX}
            placeholder="상품 상태, 거래 가능한 장소 등을 적어주세요"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
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
            max={PRICE_MAX}
            placeholder="0이면 나눔"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">최대 {PRICE_MAX.toLocaleString()}원까지 등록할 수 있어요.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          >
            <option value="">선택 안함</option>
            <option value="생활용품">생활용품</option>
            <option value="전자기기">전자기기</option>
            <option value="도서">도서</option>
            <option value="의류">의류</option>
            <option value="기타">기타</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
        >
          {loading ? '등록 중... (사진 업로드 시간이 걸려요)' : '상품 등록'}
        </button>
      </form>
    </div>
  )
}
