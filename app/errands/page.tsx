import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ErrandCard from '@/components/ErrandCard'

// 심부름 목록 페이지 (Server Component)
// products/page.tsx와 같은 패턴이지만 status='open'을 위로 정렬
export default async function ErrandsPage() {
  const supabase = await createClient()

  const { data: errands, error } = await supabase
    .from('errands')
    .select('*')
    .order('status', { ascending: true })  // open이 먼저 (알파벳순 우연히 맞음)
    .order('created_at', { ascending: false })

  if (error) {
    return <p className="text-red-500 p-8">에러: {error.message}</p>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">🏃 심부름 게시판</h1>
          <p className="text-sm text-gray-500 mt-1">
            켄텍 캠퍼스 안에서 서로 돕고, 보상 받아요
          </p>
        </div>
        <Link
          href="/errands/new"
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          + 심부름 요청
        </Link>
      </div>

      {errands && errands.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {errands.map((e) => (
            <ErrandCard key={e.id} errand={e} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg mb-2">아직 등록된 심부름이 없어요</p>
          <p className="text-sm">첫 요청자가 되어보세요!</p>
        </div>
      )}
    </div>
  )
}