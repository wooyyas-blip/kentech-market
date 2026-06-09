import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/ProductCard'
import Link from 'next/link'

const CATEGORIES = ['전체', '생활용품', '전자기기', '도서', '의류', '기타']

// 상태 정렬 우선순위: 판매중 → 예약중 → 거래완료
const STATUS_ORDER: Record<string, number> = { selling: 0, reserved: 1, sold: 2 }

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const active = category && CATEGORIES.includes(category) ? category : '전체'

  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (active !== '전체') {
    query = query.eq('category', active)
  }

  const { data: products, error } = await query

  // 상태 우선순위로 정렬 (같은 상태면 최신순 유지)
  const sorted = (products ?? []).slice().sort((a, b) => {
    const sa = STATUS_ORDER[a.status || 'selling'] ?? 0
    const sb = STATUS_ORDER[b.status || 'selling'] ?? 0
    return sa - sb
  })

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">🛍️ 중고거래</h1>
        <Link
          href="/products/new"
          className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
        >
          + 상품 등록
        </Link>
      </div>

      {/* 카테고리 탭 */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const href = c === '전체' ? '/products' : `/products?category=${encodeURIComponent(c)}`
          const isActive = c === active
          return (
            <Link
              key={c}
              href={href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {c}
            </Link>
          )
        })}
      </div>

      {/* 에러 */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          상품을 불러오는 데 실패했어요: {error.message}
        </div>
      )}

      {/* 빈 상태 */}
      {!error && sorted.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="mb-2 text-4xl">🛒</p>
          <p className="font-medium text-gray-700">
            {active === '전체' ? '아직 등록된 상품이 없어요.' : `'${active}' 카테고리에 상품이 없어요.`}
          </p>
          <p className="mt-1 text-sm text-gray-500">첫 번째 상품을 등록해보세요!</p>
        </div>
      )}

      {/* 상품 그리드 */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
