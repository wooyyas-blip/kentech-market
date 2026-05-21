'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    // 켄텍 이메일 검증
    if (!email.endsWith('@kentech.ac.kr')) {
      setError('켄텍 이메일(@kentech.ac.kr)만 가입할 수 있어요.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (error) {
      setError(`로그인 실패: ${error.message}`)
    } else {
      setMessage('📬 이메일을 확인해주세요! 로그인 링크를 보냈어요.')
      setEmail('')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-3xl font-bold">🥕 켄근마켓</h1>
        <p className="mb-6 text-gray-600">
          켄텍 이메일로 로그인하세요
        </p>

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
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600 disabled:bg-gray-400"
          >
            {loading ? '전송 중...' : '매직링크 받기'}
          </button>
        </form>

        {message && (
          <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <p className="mt-6 text-xs text-gray-500">
          💡 매직링크: 이메일에 도착한 링크를 클릭하면 자동으로 로그인됩니다. 비밀번호 필요 없음!
        </p>
      </div>
    </div>
  )
}