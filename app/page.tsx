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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <section className="text-center py-12 mb-8 bg-orange-50 rounded-2xl">
        <h1 className="text-4xl font-bold mb-3">🥕 켄근마켓</h1>
        <p className="text-lg text-gray-700 mb-2">
          켄텍 학생들의 중고거래 & 심부름 플랫폼
        </p>
        <p className="text-sm text-gray-500 mb-6">
          @kentech.ac.kr 인증된 학생만 이용할 수 있어요
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/products"
            className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            중고거래 둘러보기
          </Link>
          <Link
  href="/errands"
  className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
>
  심부름 보기
</Link>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-2xl font-bold">최근 올라온 상품</h2>
          <Link href="/products" className="text-sm text-orange-600 hover:underline">
            전체보기 →
          </Link>
        </div>

        {recentProducts && recentProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">
            아직 등록된 상품이 없어요. 첫 판매자가 되어보세요!
          </p>
        )}
      </section>
    </div>
  )
}