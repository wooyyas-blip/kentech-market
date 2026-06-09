'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// 닉네임 변경 페이지 (Client Component)
// 정책:
// - 2자 이상 20자 이하
// - 동일 닉네임이면 저장 안 함 (UX)
// - RLS가 백엔드에서 본인 행만 UPDATE 허용 (이중 안전망)
export default function EditNicknamePage() {
  const router = useRouter()
  const supabase = createClient()

  const [current, setCurrent] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [initial, setInitial] = useState(true)
  const [error, setError] = useState('')

  // 현재 닉네임 prefill
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', user.id)
        .single()
      if (data?.nickname) {
        setCurrent(data.nickname)
        setNickname(data.nickname)
      }
      setInitial(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmed = nickname.trim()
    if (trimmed.length < 2) {
      setError('닉네임은 2자 이상이어야 해요.')
      return
    }
    if (trimmed.length > 20) {
      setError('닉네임은 20자 이하여야 해요.')
      return
    }
    if (trimmed === current) {
      setError('지금 닉네임과 같아요.')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ nickname: trimmed })
      .eq('id', user.id)

    setLoading(false)
    if (updateError) {
      setError('변경 실패: ' + updateError.message)
      return
    }
    router.push('/me')
    router.refresh()
  }

  if (initial) {
    return <div className="max-w-md mx-auto p-8 text-center text-gray-500">불러오는 중...</div>
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Link href="/me" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        ← 내 정보로
      </Link>
      <h1 className="text-2xl font-bold mb-6">✏️ 닉네임 변경</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">현재 닉네임</label>
          <p className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700">{current}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">새 닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            minLength={2}
            maxLength={20}
            placeholder="2자 이상 20자 이하"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </form>
    </div>
  )
}
