'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// 로그인 페이지 (Client Component) — v2
// 변경 사항:
// - useSearchParams() 사용하는 부분을 LoginFormInner로 분리하고 Suspense로 감쌈
//   (Next.js 16에서 prerender 시 suspense boundary 필수)
// - 로직 자체는 v1과 동일 (signInWithPassword)
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-3xl font-bold">🥕 켄근마켓</h1>
        <p className="mb-6 text-gray-600">로그인해서 거래를 시작해요</p>
        <Suspense fallback={<div className="text-sm text-gray-500">로딩 중...</div>}>
          <LoginFormInner />
        </Suspense>
      </div>
    </div>
  )
}

// 실제 폼 로직 — useSearchParams를 쓰니까 Suspense 안에 있어야 함
function LoginFormInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const justSignedUp = searchParams.get('signup') === 'success'
  const authError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.endsWith('@kentech.ac.kr')) {
      setError('켄텍 이메일(@kentech.ac.kr)만 사용할 수 있어요.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        setError('이메일 또는 비밀번호가 올바르지 않아요.')
      } else if (signInError.message.includes('Email not confirmed')) {
        setError('이메일 인증이 완료되지 않았어요. 가입 시 받은 메일을 확인해주세요.')
      } else {
        setError(`로그인 실패: ${signInError.message}`)
      }
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <>
      {justSignedUp && (
        <div className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
          📬 가입 확인 메일을 보냈어요! 메일의 링크를 클릭한 뒤 로그인해주세요.
        </div>
      )}

      {authError === 'auth_failed' && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          인증에 실패했어요. 다시 시도해주세요.
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@kentech.ac.kr"
            required
            autoComplete="email"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-600 disabled:bg-gray-400"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-600">
        켄근마켓이 처음이세요?{' '}
        <Link href="/signup" className="font-medium text-indigo-600 hover:underline">
          회원가입
        </Link>
      </div>

      <p className="mt-6 text-xs text-gray-500">
        🔐 켄텍 학생(@kentech.ac.kr)만 가입할 수 있어요
      </p>
    </>
  )
}
