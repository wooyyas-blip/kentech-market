'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  // 진입 시: 로그인 확인 + 이미 닉네임 있으면 홈으로
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: me } = await supabase.from('users').select('nickname').eq('id', user.id).single()
      if (me?.nickname) { router.replace('/'); return }
      setChecking(false)
    })()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmed = nickname.trim()
    if (trimmed.length < 2 || trimmed.length > 12) {
      setError('닉네임은 2~12자로 정해주세요.')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    // 중복 체크
    const { data: dup } = await supabase
      .from('users').select('id').eq('nickname', trimmed).neq('id', user.id).maybeSingle()
    if (dup) {
      setLoading(false)
      setError('이미 사용 중인 닉네임이에요. 다른 걸로 해주세요.')
      return
    }

    const { error: updateError } = await supabase
      .from('users').update({ nickname: trimmed }).eq('id', user.id)
    setLoading(false)
    if (updateError) {
      setError('저장 실패: ' + updateError.message)
      return
    }
    router.replace('/')
    router.refresh()
  }

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">확인 중...</div>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold">👋 닉네임을 정해주세요</h1>
        <p className="mb-6 text-sm text-gray-600">켄근마켓에서 사용할 이름이에요. 나중에 내 정보에서 바꿀 수 있어요.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">닉네임</label>
              <span className="text-xs text-gray-400">{nickname.length}/12</span>
            </div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={12}
              placeholder="예: 켄근이"
              autoFocus
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={loading || !nickname.trim()}
            className="w-full rounded-md bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-600 disabled:opacity-50">
            {loading ? '저장 중...' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
