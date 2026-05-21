// DB 테이블 타입 정의
export type User = {
  id: string
  email: string
  nickname: string
  created_at: string
}

export type Product = {
  id: string
  user_id: string
  title: string
  description: string | null
  price: number
  category: string | null
  status: 'selling' | 'reserved' | 'sold'
  image_url: string | null
  created_at: string
}

// errands 테이블과 정확히 매칭되는 타입
// status 값: 'open' (요청중) | 'in_progress' (진행중) | 'done' (완료)
export type Errand = {
  id: string
  user_id: string           // 요청자
  accepted_by: string | null // 수락자 (아직 없으면 null)
  title: string
  description: string | null
  reward: number             // 보상 금액 (원)
  status: 'open' | 'in_progress' | 'done' | null
  deadline: string | null    // ISO timestamp
  created_at: string
}

// 상세 페이지에서 JOIN으로 받아올 확장 타입
export type ErrandWithUsers = Errand & {
  requester?: { id: string; nickname: string; email: string } | null
  acceptor?: { id: string; nickname: string; email: string } | null
}

export type Comment = {
  id: string
  user_id: string
  post_id: string
  post_type: 'product' | 'errand'
  content: string
  created_at: string
}

// JOIN으로 작성자 정보까지 함께 가져올 때
export type CommentWithAuthor = Comment & {
  author?: { id: string; nickname: string } | null

// 쪽지: 1:1 DM
export type Message = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean | null
  created_at: string
}

// 대화 목록 화면용: 상대방 정보 + 마지막 메시지 정보
export type Conversation = {
  partnerId: string
  partnerNickname: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}
