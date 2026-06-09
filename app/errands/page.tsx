import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ErrandCard from '@/components/ErrandCard'

// 정렬 우선순위: 요청중(0) → 진행중(1) → 마감됨(2) → 완료(3)
function sortRank(errand: { status?: string | null; deadline?: string | null }): number {
  const status = errand.status || 'open'
  if (status === 'done') return 3
  const expired = !!errand.deadline && new Date(errand.deadline).getTime() < Date.now()
  if (expired) return 2
  if (status === 'in_progress') return 1
  return 0 // open
}

export default async function ErrandsPage() {
  const supabase = await createClient()

  const { data: errands, error } = await supabase
    .from('errands')
    .select(`
      *,
      acceptor:users!errands_accepted_by_fkey (id, nickname, email)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return <p className="text-red-500 p-8">에러: {error.message}</p>
  }

  const sorted = (errands ?? []).slice().sort((a, b) => sortRank(a) - sortRank(b))

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

      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sorted.map((e) => (
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
