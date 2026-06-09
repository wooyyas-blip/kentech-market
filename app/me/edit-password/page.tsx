'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// 비밀번호 변경 페이지 (Client Component)
// 정책:
// - 새 비밀번호 6자 이상
// - 새 비밀번호 + 확인 일치
// - 현재 비밀번호도 요구 (보안 강화 — 세션 도용 방지)
// Supabase Auth의 updateUser({ password })는 자동으로 현재 세션 확인하지만,
// 사용자가 비번을 직접 입력하게 해서 한 번 더 본인 확인
export default function EditPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPw.length < 6) {
      setError('새 비밀번호는 6자 이상이어야 해요.')
      return
    }
    if (newPw !== confirmPw) {
      setError('새 비밀번호가 일치하지 않아요.')
      return
    }
    if (newPw === currentPw) {
      setError('현재 비밀번호와 같아요. 다른 비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)

    // 1) 현재 비밀번호 검증 — 본인 이메일로 재로그인 시도
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setLoading(false)
      setError('세션이 만료됐어요. 다시 로그인해주세요.')
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPw,
    })

    if (signInError) {
      setLoading(false)
      setError('현재 비밀번호가 올바르지 않아요.')
      return
    }

    // 2) 새 비밀번호로 업데이트
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPw,
    })

    setLoading(false)
    if (updateError) {
      setError('변경 실패: ' + updateError.message)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="text-xl font-bold mb-3">비밀번호가 변경됐어요</h1>
        <p className="text-sm text-gray-600 mb-6">다음 로그인부터 새 비밀번호를 사용해주세요.</p>
        <Link
          href="/me"
          className="inline-block px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
        >
          내 정보로
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Link href="/me" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        ← 내 정보로
      </Link>
      <h1 className="text-2xl font-bold mb-6">🔑 비밀번호 변경</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">현재 비밀번호 *</label>
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">새 비밀번호 *</label>
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="6자 이상"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">새 비밀번호 확인 *</label>
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
        >
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  )
}
