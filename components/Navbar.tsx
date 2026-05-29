import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

// 변경 사항 (v2):
// - 로그인된 사용자에게 "쪽지함" 링크 추가 (김서정 피드백)
// - 심부름 옆에 배치 — 메뉴 동선 자연스럽게
export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* 로고 */}
        <Link href="/" className="text-xl font-bold">
          🥕 켄근마켓
        </Link>
        {/* 메뉴 */}
        <div className="flex items-center gap-4 text-sm">
          <Link href="/products" className="hover:text-orange-500">
            중고거래
          </Link>
          <Link href="/errands" className="hover:text-orange-500">
            심부름
          </Link>
          {/* 로그인된 사용자만 쪽지함 보임 (비로그인은 의미 없음) */}
          {user && (
            <Link href="/messages" className="hover:text-orange-500">
              ✉️ 쪽지함
            </Link>
          )}
          {user ? (
            <>
              <Link
                href="/products/new"
                className="rounded bg-orange-500 px-3 py-1 text-white hover:bg-orange-600"
              >
                + 글쓰기
              </Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className="text-gray-500 hover:text-red-500">
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded bg-orange-500 px-3 py-1 text-white hover:bg-orange-600"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
