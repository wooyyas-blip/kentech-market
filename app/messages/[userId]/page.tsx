import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import MessageForm from './MessageForm'

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId: partnerId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: partner } = await supabase
    .from('users')
    .select('id, nickname')
    .eq('id', partnerId)
    .single()

  if (!partner) notFound()

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true })

  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('sender_id', partnerId)
    .eq('receiver_id', user.id)
    .eq('is_read', false)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b">
        <Link href="/messages" className="text-gray-500 hover:text-gray-900">
          ←
        </Link>
        <h1 className="text-lg font-bold">{partner.nickname}</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {!messages || messages.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            아직 대화가 없어요. 첫 쪽지를 보내보세요!
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === user.id
            return (
              <div
                key={m.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                    isMine
                      ? 'bg-indigo-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-indigo-100' : 'text-gray-400'}`}>
                    {new Date(m.created_at).toLocaleTimeString('ko-KR', {
                      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul',
                    })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      <MessageForm receiverId={partnerId} />
    </div>
  )
}
