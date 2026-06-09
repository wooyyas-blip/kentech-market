'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const TITLE_MAX = 50
const DESC_MAX = 500

export default function NewErrandPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [deadline, setDeadline] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('로그인이 필요해요.')
      return
    }

    const rewardNum = parseInt(reward, 10)
    if (isNaN(rewardNum) || rewardNum < 0) {
      setError('보상 금액을 올바르게 입력해주세요.')
      return
    }

    setLoading(true)
    const { data, error: insertError } = await supabase
      .from('errands')
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        reward: rewardNum,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        status: 'open',
      })
      .select()
      .single()
    setLoading(false)

    if (insertError) {
      setError('등록 실패: ' + insertError.message)
      return
    }
    router.push(`/errands/${data.id}`)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">🏃 심부름 요청하기</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">제목 *</label>
            <span className="text-xs text-gray-400">{title.length}/{TITLE_MAX}</span>
          </div>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={TITLE_MAX} placeholder="예: 우체국 가서 택배 보내주세요" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">상세 설명</label>
            <span className="text-xs text-gray-400">{description.length}/{DESC_MAX}</span>
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={DESC_MAX} placeholder="구체적인 위치, 준비물, 주의사항 등을 적어주세요" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">보상 (원) *</label>
          <input type="number" value={reward} onChange={(e) => setReward(e.target.value)} required min={0} placeholder="3000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">마감기한</label>
          <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" />
          <p className="text-xs text-gray-500 mt-1">언제까지 끝내야 하나요? (선택)</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50">{loading ? '등록 중...' : '요청 올리기'}</button>
      </form>
    </div>
  )
}
