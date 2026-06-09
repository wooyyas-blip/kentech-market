import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: recentProducts } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'selling')
    .order('created_at', { ascending: false })
    .limit(4)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* 히어로 */}
      <section className="relative overflow-hidden rounded-3xl bg-indigo-600 px-8 py-16 text-center text-white mb-10">
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-indigo-500/40"></div>
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-indigo-700/40"></div>
        <div className="relative">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium mb-4">
            🎓 @kentech.ac.kr 인증 학생 전용
          </span>
          <h1 className="text-4xl font-bold tracking-tight mb-3 sm:text-5xl">켄근마켓</h1>
          <p className="text-base text-indigo-100 mb-8 sm:text-lg">
            켄텍 캠퍼스 안에서, 중고거래부터 심부름까지
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/products" className="rounded-xl bg-white px-6 py-3 font-medium text-indigo-700 transition hover:bg-indigo-50">
              중고거래 둘러보기
            </Link>
            <Link href="/errands" className="rounded-xl border border-white/40 px-6 py-3 font-medium text-white transition hover:bg-white/10">
              심부름 보기
            </Link>
          </div>
        </div>
      </section>

      {/* 진입 카드 2개 */}
      <section className="grid gap-4 sm:grid-cols-2 mb-12">
        <Link href="/products" className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-sm">
          <div className="mb-3 text-3xl">🛍️</div>
          <h3 className="mb-1 text-lg font-bold text-gray-900">중고거래</h3>
          <p className="text-sm text-gray-500">안 쓰는 물건, 캠퍼스 안에서 사고팔기</p>
          <span className="mt-3 inline-block text-sm font-medium text-indigo-600 group-hover:underline">바로 가기 →</span>
        </Link>
        <Link href="/errands" className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-sm">
          <div className="mb-3 text-3xl">🏃</div>
          <h3 className="mb-1 text-lg font-bold text-gray-900">심부름</h3>
          <p className="text-sm text-gray-500">서로 돕고 보상 받는 캠퍼스 심부름</p>
          <span className="mt-3 inline-block text-sm font-medium text-indigo-600 group-hover:underline">바로 가기 →</span>
        </Link>
      </section>

      {/* 최근 상품 */}
      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-2xl font-bold tracking-tight">최근 올라온 상품</h2>
          <Link href="/products" className="text-sm font-medium text-indigo-600 hover:underline">
            전체보기 →
          </Link>
        </div>

        {recentProducts && recentProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {recentProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <p className="mb-1 font-medium text-gray-700">아직 등록된 상품이 없어요</p>
            <p className="text-sm text-gray-500">첫 판매자가 되어보세요!</p>
          </div>
        )}
      </section>
    </div>
  )
}
