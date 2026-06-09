import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductActions from './ProductActions'
import CommentSection from '@/components/CommentSection'
import ProductGallery from '@/components/ProductGallery'
import SendMessageButton from '@/components/SendMessageButton'
import ReportButton from '@/components/ReportButton'
import AdminDeleteButton from '@/components/AdminDeleteButton'
import OfferSection from '@/components/OfferSection'

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

  const { data: { user } } = await supabase.auth.getUser()

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      seller:users!products_user_id_fkey (id, nickname, email, manner_temperature, is_unpaid),
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
  const isOwner = user?.id === product.user_id

  let isAdmin = false
  if (user) {
    const { data: me } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
    isAdmin = !!me?.is_admin
  }

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

          <p className="mb-4 text-3xl font-bold text-indigo-600">
            {product.price === 0 ? '나눔' : `${product.price.toLocaleString()}원`}
          </p>

          <div className="mb-3 rounded-md bg-gray-50 p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-gray-500">판매자</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/users/${product.user_id}`} className="font-medium text-gray-900 hover:underline">
                    {product.seller?.nickname ?? '익명'}
                  </Link>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    🌡️ {sellerTemp.toFixed(1)}℃
                  </span>
                  <span className="text-xs text-gray-500">· 후기 {sellerRatingCount ?? 0}개</span>
                  {product.seller?.is_unpaid && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">⚠️ 미입금자</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{product.seller?.email}</p>
              </div>
              {user && !isOwner && (
                <SendMessageButton partnerId={product.user_id} />
              )}
            </div>
            {user && !isOwner && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <ReportButton reportedId={product.user_id} productId={product.id} />
              </div>
            )}
          </div>

          {product.buyer && (
            <div className="mb-4 rounded-md bg-blue-50 p-3 text-sm">
              <p className="text-blue-700">
                {product.status === 'sold' ? '구매자' : '구매 요청자'}
              </p>
              <Link href={`/users/${product.buyer_id}`} className="font-medium text-gray-900 hover:underline">
                {product.buyer.nickname}
              </Link>
            </div>
          )}

          <div className="mb-6">
            <h2 className="mb-2 text-sm font-medium text-gray-500">상품 설명</h2>
            <p className="whitespace-pre-wrap text-gray-800">
              {product.description || '(설명 없음)'}
            </p>
          </div>

          <p className="mb-6 text-xs text-gray-400">
            {new Date(product.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} 등록
          </p>

          <ProductActions
            productId={product.id}
            status={product.status}
            sellerId={product.user_id}
            buyerId={product.buyer_id}
            isLoggedIn={!!user}
            currentUserId={user?.id ?? null}
          />

          {product.status === 'selling' && (
            <OfferSection
              productId={product.id}
              sellerId={product.user_id}
              currentUserId={user?.id ?? null}
              isLoggedIn={!!user}
              listedPrice={product.price}
            />
          )}

          {isAdmin && !isOwner && (
            <AdminDeleteButton table="products" id={product.id} redirectTo="/products" />
          )}

          <CommentSection postId={product.id} postType="product" />
        </div>
      </div>
    </div>
  )
}
