import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Conversation } from '@/lib/types'

export default async function MessagesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_id_fkey (id, nickname),
      receiver:users!messages_receiver_id_fkey (id, nickname)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    return <p className="text-red-500 p-8">에러: {error.message}</p>
  }

  const conversationMap = new Map<string, Conversation>()
  for (const msg of messages || []) {
    const partner = msg.sender_id === user.id ? msg.receiver : msg.sender
    if (!partner) continue

    const partnerId = partner.id
    if (conversationMap.has(partnerId)) continue

    const unreadCount = (messages || []).filter(
      (m) => m.sender_id === partnerId && m.receiver_id === user.id && !m.is_read
    ).length

    conversationMap.set(partnerId, {
      partnerId,
      partnerNickname: partner.nickname,
      lastMessage: msg.content,
      lastMessageAt: msg.created_at,
      unreadCount,
    })
  }

  const conversations = Array.from(conversationMap.values())

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">✉️ 쪽지함</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg mb-2">아직 쪽지가 없어요</p>
          <p className="text-sm">상품/심부름 상세 페이지에서 쪽지를 보낼 수 있어요</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li
              key={c.partnerId}
              className="flex items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition"
            >
              {/* 대화 내용 → 대화방으로 */}
              <Link href={`/messages/${c.partnerId}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{c.partnerNickname}</span>
                  {c.unreadCount > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded-full">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">{c.lastMessage}</p>
              </Link>

              <div className="flex flex-col items-end gap-2 ml-2">
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(c.lastMessageAt).toLocaleDateString('ko-KR', {
                    month: 'numeric', day: 'numeric', timeZone: 'Asia/Seoul',
                  })}
                </span>
                {/* 상대 프로필로 */}
                <Link
                  href={`/users/${c.partnerId}`}
                  className="text-xs text-indigo-600 hover:underline whitespace-nowrap"
                >
                  👤 프로필
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
