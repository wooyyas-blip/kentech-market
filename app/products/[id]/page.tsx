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
import UserFlags from '@/components/UserFlags'

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

  // 판매자/구매자 표식 조회
  const flagUserIds = [product.user_id, product.buyer_id].filter(Boolean) as string[]
  const flagsByUser: Record<string, { flag_type: string }[]> = {}
  if (flagUserIds.length > 0) {
    const { data: flags } = await supabase
      .from('user_flags').select('user_id, flag_type').in('user_id', flagUserIds)
    for (const f of flags ?? []) {
      (flagsByUser[f.user_id] ??= []).push({ flag_type: f.flag_type })
    }
  }

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

          {/* 판매자 */}
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
                  <UserFlags flags={flagsByUser[product.user_id] ?? []} />
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

          {/* 구매자/구매요청자 */}
          {product.buyer && (
            <div className="mb-4 rounded-md bg-blue-50 p-3 text-sm">
              <p className="mb-2 text-blue-700">
                {product.status === 'sold' ? '구매자' : '구매 요청자'}
              </p>
              <Link
                href={`/users/${product.buyer_id}`}
                className="flex items-center justify-between rounded-lg bg-white border border-blue-200 px-3 py-2 hover:bg-blue-50 transition"
              >
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{product.buyer.nickname}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    🌡️ {Number(product.buyer.manner_temperature ?? 36.5).toFixed(1)}℃
                  </span>
                  <UserFlags flags={flagsByUser[product.buyer_id] ?? []} />
                </span>
                <span className="text-xs text-blue-600 whitespace-nowrap">프로필 보기 →</span>
              </Link>
              {user && isOwner && (
                <div className="mt-2">
                  <ReportButton reportedId={product.buyer_id} productId={product.id} />
                </div>
              )}
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
