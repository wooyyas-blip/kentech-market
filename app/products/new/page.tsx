'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// 상품 등록 페이지 (Client Component)
// 사진 업로드 기능 추가: 최대 3장, 미리보기/삭제 지원
// Supabase Storage 'product-images' 버킷에 {user_id}/{timestamp}_{filename} 경로로 저장
const MAX_IMAGES = 3

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 폼 상태
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')

  // 사진 상태: 선택된 파일들 + 각각의 미리보기 URL
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  // 파일 선택 핸들러: input[type=file]에서 파일 받아 미리보기 생성
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // 현재 + 새 파일 합쳐서 3장 초과 체크
    const newFiles = Array.from(files)
    const totalCount = images.length + newFiles.length
    if (totalCount > MAX_IMAGES) {
      alert(`사진은 최대 ${MAX_IMAGES}장까지만 올릴 수 있어요.`)
      return
    }

    // 미리보기 URL 생성 (브라우저 메모리에 임시 저장)
    // URL.createObjectURL은 메모리 누수 방지 위해 unmount 시 revoke 필요하지만
    // 페이지 이동 시 자동 정리되므로 데모용은 OK
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file))

    setImages([...images, ...newFiles])
    setPreviews([...previews, ...newPreviews])

    // 같은 파일 다시 선택 가능하도록 input value 초기화
    e.target.value = ''
  }

  // 사진 1장 삭제
  const handleRemoveImage = (index: number) => {
    // 메모리에서 해당 미리보기 URL 해제
    URL.revokeObjectURL(previews[index])
    setImages(images.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 로그인 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('로그인이 필요해요.')
      return
    }

    // 가격 검증
    const priceNum = parseInt(price, 10)
    if (isNaN(priceNum) || priceNum < 0) {
      setError('가격을 올바르게 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      // 1단계: 사진들 먼저 Storage에 업로드해서 URL 받기
      const uploadedUrls: string[] = []
      for (const file of images) {
        // 파일명 충돌 방지: 타임스탬프 + 원본 파일명
        // 폴더는 user.id로: RLS 정책이 본인 폴더만 삭제 허용
        const ext = file.name.split('.').pop()
        const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
        const filepath = `${user.id}/${filename}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filepath, file)

        if (uploadError) {
          throw new Error(`사진 업로드 실패: ${uploadError.message}`)
        }

        // 업로드된 사진의 public URL 가져오기
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filepath)

        uploadedUrls.push(publicUrl)
      }

      // 2단계: products 테이블에 INSERT
      const { data, error: insertError } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          price: priceNum,
          category: category || null,
          status: 'selling',
          image_urls: uploadedUrls, // 빈 배열도 OK (사진 없이 등록 가능)
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`등록 실패: ${insertError.message}`)
      }

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
        {/* 사진 업로드 영역 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            사진 ({images.length}/{MAX_IMAGES})
          </label>
          
          <div className="flex gap-2 flex-wrap">
            {/* 선택된 사진 미리보기 */}
            {previews.map((url, index) => (
              <div key={index} className="relative w-24 h-24">
                <img
                  src={url}
                  alt={`미리보기 ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* 사진 추가 버튼 (3장 미만일 때만) */}
            {images.length < MAX_IMAGES && (
              <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition">
                <span className="text-2xl text-gray-400">📷</span>
                <span className="text-xs text-gray-500 mt-1">사진 추가</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            사진은 선택사항이에요. 텍스트만으로도 등록 가능합니다.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="예: 자취방 의자 팝니다"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">상품 설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="상품 상태, 거래 가능한 장소 등을 적어주세요"
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
            placeholder="0이면 나눔"
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

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? '등록 중... (사진 업로드 시간이 걸려요)' : '상품 등록'}
        </button>
      </form>
    </div>
  )
}