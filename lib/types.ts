export type User = {
  id: string
  email: string
  nickname: string
  manner_temperature: number | null
  created_at: string
}
export type Product = {
  id: string
  user_id: string
  buyer_id: string | null
  title: string
  description: string | null
  price: number
  category: string | null
  status: 'selling' | 'reserved' | 'sold'
  image_urls: string[]
  created_at: string
}
export type Errand = {
  id: string
  user_id: string
  accepted_by: string | null
  title: string
  description: string | null
  reward: number
  status: 'open' | 'in_progress' | 'done' | null
  deadline: string | null
  created_at: string
}
export type ErrandWithUsers = Errand & {
  requester?: { id: string; nickname: string; email: string; manner_temperature?: number | null } | null
  acceptor?: { id: string; nickname: string; email: string; manner_temperature?: number | null } | null
}
export type Comment = {
  id: string
  user_id: string
  post_id: string
  post_type: 'product' | 'errand'
  content: string
  created_at: string
}
export type CommentWithAuthor = Comment & {
  author?: { id: string; nickname: string } | null
}
export type Message = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean | null
  created_at: string
}
export type Conversation = {
  partnerId: string
  partnerNickname: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}
