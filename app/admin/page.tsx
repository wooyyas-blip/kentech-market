import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AdminReportActions from './AdminReportActions'

const statusLabels: Record<string, { label: string; color: string }> = {
  pending:   { label: '대기중', color: 'bg-yellow-100 text-yellow-700' },
  resolved:  { label: '처리됨', color: 'bg-green-100 text-green-700' },
  dismissed: { label: '기각됨', color: 'bg-gray-200 text-gray-600' },
}

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase
    .from('users').select('is_admin').eq('id', user.id).single()
  if (!me?.is_admin) notFound()

  const { data: reports, error } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:users!reports_reporter_id_fkey (id, nickname, email),
      reported:users!reports_reported_id_fkey (id, nickname, email, is_unpaid)
    `)
    .order('created_at', { ascending: false })

  if (error) return <p className="text-red-500 p-8">에러: {error.message}</p>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">🛡️ 관리자 — 신고 관리</h1>
      {!reports || reports.length === 0 ? (
        <p className="text-center py-20 text-gray-500">아직 신고가 없어요.</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => {
            const status = statusLabels[r.status] ?? statusLabels.pending
            const link = r.product_id ? `/products/${r.product_id}`
              : r.errand_id ? `/errands/${r.errand_id}` : null
            return (
              <li key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString('ko-KR')}</span>
                </div>
                <p className="text-sm"><span className="text-gray-500">신고자: </span>{r.reporter?.nickname ?? '알 수 없음'}</p>
                <p className="text-sm">
                  <span className="text-gray-500">대상: </span>
                  <span className="font-medium">{r.reported?.nickname ?? '알 수 없음'}</span>
                  {r.reported?.is_unpaid && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">⚠️ 미입금자</span>
                  )}
                </p>
                <p className="text-sm mt-1 whitespace-pre-wrap"><span className="text-gray-500">사유: </span>{r.reason}</p>
                {link && <Link href={link} className="text-xs text-orange-600 hover:underline">관련 게시글 보기 →</Link>}
                <AdminReportActions reportId={r.id} reportedId={r.reported_id} status={r.status} isUnpaid={!!r.reported?.is_unpaid} />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
