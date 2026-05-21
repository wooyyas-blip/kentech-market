import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductActions from './ProductActions'
import CommentSection from '@/components/CommentSection'
import SendMessageButton from '@/components/SendMessageButton'

const statusLabels = {
  selling: { label: '판매중', color: 'bg-green-100 text-green-700' },
  reserved: { label: '예약중', color: 'bg-yellow-100 text-yellow-700' },
  sold: { label: '거래완료', color: 'bg-gray-200 text-gray-600' },
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 현재 로그인된 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()

  // 상품 정보 조회 (판매자 정보도 join)
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      seller:users!products_user_id_fkey (
        id,
        nickname,
        email
      )
    `)
    .eq('id', id)
    .single()

  if (error || !product) {
    notFound()
  }

  const isOwner = user?.id === product.user_id
  const statusInfo = statusLabels[product.status as keyof typeof statusLabels]

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* 뒤로 가기 */}
      <Link
        href="/products"
        className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700"
      >
        ← 목록으로
      </Link>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {/* 이미지 영역 (placeholder) */}
        <div className="flex aspect-video w-full items-center justify-center bg-gray-100 text-6xl">
          🛍️
        </div>

        {/* 정보 영역 */}
        <div className="p-6">
          {/* 상태 + 카테고리 */}
          <div className="mb-3 flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {product.category && (
              <span className="text-sm text-gray-500">
                {product.category}
              </span>
            )}
          </div>

          {/* 제목 */}
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            {product.title}
          </h1>

          {/* 가격 */}
          <p className="mb-4 text-3xl font-bold text-orange-600">
            {product.price === 0 ? '나눔' : `${product.price.toLocaleString()}원`}
          </p>

          {/* 판매자 정보 + 쪽지 버튼 */}
          <div className="mb-4 rounded-md bg-gray-50 p-3 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500">판매자</p>
                <p className="font-medium text-gray-900">
                  {product.seller?.nickname ?? '익명'}
                </p>
                <p className="text-xs text-gray-500">
                  {product.seller?.email}
                </p>
              </div>
              {/* 본인 글이 아닐 때만 쪽지 버튼 표시 */}
              {user && !isOwner && (
                <SendMessageButton partnerId={product.user_id} />
              )}
            </div>
          </div>

          {/* 설명 */}
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-medium text-gray-500">상품 설명</h2>
            <p className="whitespace-pre-wrap text-gray-800">
              {product.description || '(설명 없음)'}
            </p>
          </div>

          {/* 등록일 */}
          <p className="mb-6 text-xs text-gray-400">
            {new Date(product.created_at).toLocaleString('ko-KR')} 등록
          </p>

          {/* 액션 버튼 (본인 글에만 표시) */}
          <ProductActions
            productId={product.id}
            status={product.status}
            isOwner={isOwner}
            isLoggedIn={!!user}
            sellerId={product.user_id}
          />

          {/* 댓글 섹션 */}
          <CommentSection postId={product.id} postType="product" />
        </div>
      </div>
    </div>
  )
}