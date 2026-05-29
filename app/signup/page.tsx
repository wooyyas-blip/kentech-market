'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// 회원가입 페이지 (Client Component) — v3
// 변경 사항:
// - v2까지: data.user/session 모양으로 성공/실패 판별 → Supabase 응답 형태 변동으로 오작동
// - v3: "명시적 에러가 없으면 성공"으로 단순화 (메일은 어차피 발송됨)
// - rate limit 에러도 한글화
// - 응답 형태 확인용 console.log 추가 (발표 후 제거 가능)
export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 1) 켄텍 이메일 검증
    if (!email.endsWith('@kentech.ac.kr')) {
      setError('켄텍 이메일(@kentech.ac.kr)만 가입할 수 있어요.')
      return
    }

    // 2) 비밀번호 길이
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 해요.')
      return
    }

    // 3) 비밀번호 일치
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않아요.')
      return
    }

    // 4) 닉네임 길이
    const trimmedNickname = nickname.trim()
    if (trimmedNickname.length < 2) {
      setError('닉네임은 2자 이상이어야 해요.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          nickname: trimmedNickname,
        },
      },
    })

    setLoading(false)

    // 디버깅용 — 발표 후엔 지워도 됨 (브라우저 콘솔에서 응답 형태 확인 가능)
    console.log('[Signup] response:', { data, signUpError })

    // [분기 1] 명시적 에러
    if (signUpError) {
      const msg = signUpError.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('user already')) {
        setError('이미 가입된 이메일이에요. 로그인 페이지에서 로그인해주세요.')
      } else if (msg.includes('rate limit')) {
        setError('잠시 후 다시 시도해주세요. (이메일 발송 한도 초과)')
      } else if (msg.includes('password')) {
        setError('비밀번호가 너무 약해요. 6자 이상으로 입력해주세요.')
      } else if (msg.includes('database error')) {
        // 트리거 에러 — DB 트리거 SQL이 안 돌아간 경우
        setError('서버 오류가 발생했어요. 관리자에게 문의해주세요.')
      } else {
        setError(`가입 실패: ${signUpError.message}`)
      }
      return
    }

    // [분기 2] 이미 가입된 이메일 (Supabase가 보안상 200으로 위장)
    //   → data.user.identities 배열이 비어있는 게 시그널
    //   ⚠️ 첫 가입 케이스랑 헷갈리면 안 됨: 첫 가입 시 identities는 1개 들어있음
    if (data?.user?.identities && data.user.identities.length === 0) {
      setError('이미 가입된 이메일이에요. 로그인 페이지에서 로그인해주세요.')
      return
    }

    // [분기 3] 이메일 인증 OFF 환경 — 즉시 세션 발급
    if (data?.session) {
      router.push('/')
      router.refresh()
      return
    }

    // [분기 4] 에러 없으면 = 성공으로 간주
    //   Supabase는 정상 가입 시 200 + user 객체 + null session을 반환하는데
    //   버전에 따라 user 객체 형태가 다양함. 명시적 에러가 없으면 메일이 발송된 거.
    setSuccess(true)
  }

  // 가입 성공 화면
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <div className="mb-4 text-5xl">📬</div>
          <h1 className="mb-3 text-2xl font-bold">가입 신청 완료!</h1>
          <p className="mb-2 text-gray-700">
            <span className="font-medium">{email}</span> 로
          </p>
          <p className="mb-6 text-gray-700">인증 메일을 보냈어요.</p>

          <div className="mb-6 rounded-lg bg-orange-50 p-4 text-left text-sm text-gray-700">
            <p className="mb-2 font-medium text-orange-700">📌 가입 완료 절차</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>메일함에서 켄근마켓 인증 메일을 열어요</li>
              <li>메일 안의 인증 링크를 클릭해요</li>
              <li>그리고 다시 돌아와서 <span className="font-medium">방금 정한 비밀번호</span>로 로그인하면 끝!</li>
            </ol>
          </div>

          <Link
            href="/login"
            className="inline-block rounded-md bg-orange-500 px-6 py-2 font-medium text-white hover:bg-orange-600"
          >
            로그인 페이지로
          </Link>

          <p className="mt-4 text-xs text-gray-400">
            메일이 안 오면 스팸함도 확인해보세요
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-3xl font-bold">🥕 켄근마켓 가입</h1>
        <p className="mb-6 text-gray-600">켄텍 학생만 가입할 수 있어요</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              이메일 *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@kentech.ac.kr"
              required
              autoComplete="email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              켄텍 이메일(@kentech.ac.kr)만 가능해요
            </p>
          </div>

          <div>
            <label htmlFor="nickname" className="mb-1 block text-sm font-medium">
              닉네임 *
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="다른 학생들에게 보일 이름"
              required
              minLength={2}
              maxLength={20}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              비밀번호 *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="mb-1 block text-sm font-medium">
              비밀번호 확인 *
            </label>
            <input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호 다시 입력"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600 disabled:bg-gray-400"
          >
            {loading ? '가입 처리 중...' : '회원가입'}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          이미 계정이 있으세요?{' '}
          <Link href="/login" className="font-medium text-orange-600 hover:underline">
            로그인
          </Link>
        </div>
      </div>
    </div>
  )
}