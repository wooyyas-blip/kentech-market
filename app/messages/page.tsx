import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Conversation } from '@/lib/types'

// 쪽지함 (Server Component)
// 핵심 로직: 모든 메시지를 가져와서 "상대방별로 묶기"
// 같은 사람과 주고받은 메시지들의 가장 최근 1건만 표시
export default async function MessagesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 내가 보낸 것 + 받은 것 모두 가져오기
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

  // 상대방 ID 기준으로 대화 묶기 (가장 최근 메시지만)
  // 발표 포인트: messages 테이블에는 raw 데이터만 있지만 
  // UI에서는 "대화방" 단위로 그룹핑하는 로직 필요
  const conversationMap = new Map<string, Conversation>()
  for (const msg of messages || []) {
    const partner = msg.sender_id === user.id ? msg.receiver : msg.sender
    if (!partner) continue
    
    const partnerId = partner.id
    if (conversationMap.has(partnerId)) continue // 이미 최신 거 들어있음

    // 안 읽은 메시지 개수 (내가 받은 것 중 is_read=false)
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
            <li key={c.partnerId}>
              <Link
                href={`/messages/${c.partnerId}`}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{c.partnerNickname}</span>
                    {c.unreadCount > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded-full">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{c.lastMessage}</p>
                </div>
                <span className="text-xs text-gray-400 ml-3 whitespace-nowrap">
                  {new Date(c.lastMessageAt).toLocaleDateString('ko-KR', {
                    month: 'numeric', day: 'numeric',
                  })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}