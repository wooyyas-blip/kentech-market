import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RatingList from '@/components/RatingList'
import SendMessageButton from '@/components/SendMessageButton'
import ReportButton from '@/components/ReportButton'
import UserFlags from '@/components/UserFlags'

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, nickname, manner_temperature, created_at')
    .eq('id', id)
    .single()

  if (error || !profile) notFound()

  const { count: ratingCount } = await supabase
    .from('ratings')
    .select('id', { count: 'exact', head: true })
    .eq('rated_id', id)

  const { data: flags } = await supabase
    .from('user_flags').select('flag_type').eq('user_id', id)

  const temp = Number(profile.manner_temperature ?? 36.5)
  const isSelf = user?.id === id

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 mb-6 text-center border border-indigo-100">
        <h1 className="text-2xl font-bold mb-1 flex items-center justify-center gap-2 flex-wrap">
          {profile.nickname}
          <UserFlags flags={flags ?? []} />
        </h1>
        <p className="text-4xl font-bold text-indigo-600 my-2">🌡️ {temp.toFixed(1)}℃</p>
        <p className="text-xs text-gray-500">받은 후기 {ratingCount ?? 0}개</p>
        {user && !isSelf && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <SendMessageButton partnerId={id} />
            <ReportButton reportedId={id} />
          </div>
        )}
      </div>

      <section>
        <h2 className="text-lg font-bold mb-3">💬 받은 후기 ({ratingCount ?? 0})</h2>
        <RatingList userId={id} />
      </section>
    </div>
  )
}
