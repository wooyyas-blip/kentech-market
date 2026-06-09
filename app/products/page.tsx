import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/ProductCard'
import Link from 'next/link'

// 중고거래 목록 페이지 (Server Component)
// 최신순으로 모든 상품 표시
export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">🛍️ 중고거래</h1>
        <Link
          href="/products/new"
          className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
        >
          + 상품 등록
        </Link>
      </div>

      {/* 에러 */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          상품을 불러오는 데 실패했어요: {error.message}
        </div>
      )}

      {/* 빈 상태 */}
      {!error && products?.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="mb-2 text-4xl">🛒</p>
          <p className="font-medium text-gray-700">아직 등록된 상품이 없어요.</p>
          <p className="mt-1 text-sm text-gray-500">
            첫 번째 상품을 등록해보세요!
          </p>
        </div>
      )}

      {/* 상품 그리드 */}
      {products && products.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
