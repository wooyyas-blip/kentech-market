import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ErrandCard from '@/components/ErrandCard'

// 변경 사항 (v2):
// - select 절에 acceptor JOIN 추가 → ErrandCard에서 수락자 닉네임 표시 가능
// - 카드 컴포넌트의 ErrandWithUsers 타입과 일치하게 됨
export default async function ErrandsPage() {
  const supabase = await createClient()

  const { data: errands, error } = await supabase
    .from('errands')
    .select(`
      *,
      acceptor:users!errands_accepted_by_fkey (id, nickname, email)
    `)
    .order('status', { ascending: true })
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
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
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
