import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  let unread = 0
  if (user) {
    const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
    isAdmin = !!data?.is_admin
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false)
    unread = count ?? 0
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold">
          🥕 켄근마켓
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/products" className="hover:text-indigo-500">중고거래</Link>
          <Link href="/errands" className="hover:text-indigo-500">심부름</Link>
          {user && (
            <Link href="/messages" className="relative hover:text-indigo-500">
              ✉️ 쪽지함
              {unread > 0 && (
                <span className="absolute -top-2 -right-3 min-w-[16px] rounded-full bg-red-500 px-1 text-center text-[10px] leading-4 text-white">
                  {unread}
                </span>
              )}
            </Link>
          )}
          {user && <Link href="/me" className="hover:text-indigo-500">👤 내 정보</Link>}
          {isAdmin && (
            <Link href="/admin" className="hover:text-indigo-500 font-medium text-red-600">
              🛡️ 관리자
            </Link>
          )}
          {user ? (
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-gray-500 hover:text-red-500">로그아웃</button>
            </form>
          ) : (
            <Link href="/login" className="rounded bg-indigo-500 px-3 py-1 text-white hover:bg-indigo-600">
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
