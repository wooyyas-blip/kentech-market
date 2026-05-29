'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// 회원가입 페이지 (Client Component)
// 핵심 정책:
// 1) @kentech.ac.kr 이메일만 — 클라 1차 + DB 트리거 2차 방어
// 2) 비밀번호 최소 6자 (Supabase 기본 정책에 맞춤)
// 3) 닉네임을 user_metadata로 함께 전달 → handle_new_user 트리거가 users 테이블에 INSERT 시 사용
// 4) 가입 후 이메일 인증 메일 발송 (Supabase에서 "Confirm email" ON 가정)
//    → 사용자는 메일 링크 클릭 → /auth/callback → 자동 로그인 → 홈
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

    // 1. 켄텍 이메일 검증 (UX용 즉시 피드백)
    if (!email.endsWith('@kentech.ac.kr')) {
      setError('켄텍 이메일(@kentech.ac.kr)만 가입할 수 있어요.')
      return
    }

    // 2. 비밀번호 길이 검증
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 해요.')
      return
    }

    // 3. 비밀번호 일치 검증
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않아요.')
      return
    }

    // 4. 닉네임 검증
    const trimmedNickname = nickname.trim()
    if (trimmedNickname.length < 2) {
      setError('닉네임은 2자 이상이어야 해요.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    // Supabase 회원가입
    // - emailRedirectTo: 이메일 인증 링크 클릭 시 돌아올 URL
    // - data: user_metadata에 들어감 → handle_new_user 트리거에서 raw_user_meta_data로 읽기 가능
    //   (트리거에서 nickname을 users 테이블에 함께 INSERT하도록 수정 필요할 수 있음 — 아래 SQL 참고)
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

    if (signUpError) {
      // 자주 보이는 에러 한글화
      if (signUpError.message.includes('already registered')) {
        setError('이미 가입된 이메일이에요. 로그인 페이지로 이동해주세요.')
      } else if (signUpError.message.includes('Password should be')) {
        setError('비밀번호가 너무 약해요. 6자 이상으로 입력해주세요.')
      } else {
        setError(`가입 실패: ${signUpError.message}`)
      }
      return
    }

    // 성공 — 보통 user 객체는 있는데 session은 null (이메일 인증 대기 상태)
    if (data.user && !data.session) {
      setSuccess(true)
      return
    }

    // (드물게) 이메일 인증 OFF 상태면 즉시 세션이 발급됨 → 바로 홈으로
    if (data.session) {
      router.push('/')
      router.refresh()
    }
  }

  // 가입 성공 후 안내 화면
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <div className="mb-4 text-5xl">📬</div>
          <h1 className="mb-3 text-2xl font-bold">메일을 확인해주세요!</h1>
          <p className="mb-2 text-gray-700">
            <span className="font-medium">{email}</span> 로
          </p>
          <p className="mb-6 text-gray-700">가입 확인 메일을 보냈어요.</p>
          <p className="mb-6 text-sm text-gray-500">
            메일의 링크를 클릭하시면 가입이 완료되고 자동으로 로그인돼요.
          </p>
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
