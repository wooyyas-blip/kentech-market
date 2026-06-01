import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductActions from './ProductActions'
import CommentSection from '@/components/CommentSection'
import ProductGallery from '@/components/ProductGallery'

const statusLabels = {
  selling: { label: '판매중', color: 'bg-green-100 text-green-700' },
  reserved: { label: '예약중', color: 'bg-yellow-100 text-yellow-700' },
  sold: { label: '거래완료', color: 'bg-gray-200 text-gray-600' },
}

// 변경 사항 (v5):
// - buyer JOIN 추가 → 구매자 닉네임 표시
// - ProductActions에 새 props (buyerId, currentUserId) 전달
// - sold 상태에 구매자 정보 박스 추가
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      seller:users!products_user_id_fkey (id, nickname, email, manner_temperature),
      buyer:users!products_buyer_id_fkey (id, nickname, email, manner_temperature)
    `)
    .eq('id', id)
    .single()

  if (error || !product) {
    notFound()
  }

  const { count: sellerRatingCount } = await supabase
    .from('ratings')
    .select('id', { count: 'exact', head: true })
    .eq('rated_id', product.user_id)

  const statusInfo = statusLabels[product.status as keyof typeof statusLabels]
  const sellerTemp = Number(product.seller?.manner_temperature ?? 36.5)

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link href="/products" className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700">
        ← 목록으로
      </Link>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {product.image_urls && product.image_urls.length > 0 ? (
          <ProductGallery images={product.image_urls} title={product.title} />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-gray-100 text-6xl">🛍️</div>
        )}

        <div className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {product.category && (
              <span className="text-sm text-gray-500">{product.category}</span>
            )}
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-900">{product.title}</h1>

          <p className="mb-4 text-3xl font-bold text-orange-600">
            {product.price === 0 ? '나눔' : `${product.price.toLocaleString()}원`}
          </p>

          {/* 판매자 정보 */}
          <div className="mb-3 rounded-md bg-gray-50 p-3 text-sm">
            <p className="text-gray-500">판매자</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-gray-900">{product.seller?.nickname ?? '익명'}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                🌡️ {sellerTemp.toFixed(1)}℃
              </span>
              <span className="text-xs text-gray-500">· 후기 {sellerRatingCount ?? 0}개</span>
            </div>
            <p className="text-xs text-gray-500">{product.seller?.email}</p>
          </div>

          {/* 구매자 정보 (있을 때만) */}
          {product.buyer && (
            <div className="mb-4 rounded-md bg-blue-50 p-3 text-sm">
              <p className="text-blue-700">
                {product.status === 'sold' ? '구매자' : '구매 요청자'}
              </p>
              <p className="font-medium text-gray-900">{product.buyer.nickname}</p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="mb-2 text-sm font-medium text-gray-500">상품 설명</h2>
            <p className="whitespace-pre-wrap text-gray-800">
              {product.description || '(설명 없음)'}
            </p>
          </div>

          <p className="mb-6 text-xs text-gray-400">
            {new Date(product.created_at).toLocaleString('ko-KR')} 등록
          </p>

          <ProductActions
            productId={product.id}
            status={product.status}
            sellerId={product.user_id}
            buyerId={product.buyer_id}
            isLoggedIn={!!user}
            currentUserId={user?.id ?? null}
          />

          <CommentSection postId={product.id} postType="product" />
        </div>
      </div>
    </div>
  )
}
