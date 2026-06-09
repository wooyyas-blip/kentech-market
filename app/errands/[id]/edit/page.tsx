'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'

const TITLE_MAX = 50
const DESC_MAX = 500

export default function EditErrandPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [deadline, setDeadline] = useState('')

  const [initialLoading, setInitialLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadErrand = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: errand, error: fetchError } = await supabase
        .from('errands')
        .select('*')
        .eq('id', id)
        .single()
      if (fetchError || !errand) {
        setError('심부름을 찾을 수 없어요.')
        setInitialLoading(false)
        return
      }
      if (errand.user_id !== user.id) {
        setError('본인이 등록한 심부름만 수정할 수 있어요.')
        setInitialLoading(false)
        return
      }
      if (errand.status === 'in_progress') {
        setError('진행중인 심부름은 수정할 수 없어요.')
        setInitialLoading(false)
        return
      }
      setTitle(errand.title)
      setDescription(errand.description || '')
      setReward(String(errand.reward))
      if (errand.deadline) {
        const d = new Date(errand.deadline)
        const pad = (n: number) => String(n).padStart(2, '0')
        setDeadline(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)
      }
      setInitialLoading(false)
    }
    loadErrand()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const rewardNum = parseInt(reward, 10)
    if (isNaN(rewardNum) || rewardNum < 0) {
      setError('보상 금액을 올바르게 입력해주세요.')
      return
    }
    setSubmitting(true)
    const { error: updateError } = await supabase
      .from('errands')
      .update({
        title,
        description: description || null,
        reward: rewardNum,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      })
      .eq('id', id)
    setSubmitting(false)
    if (updateError) {
      setError('수정 실패: ' + updateError.message)
      return
    }
    router.push(`/errands/${id}`)
    router.refresh()
  }

  if (initialLoading) {
    return <div className="max-w-xl mx-auto px-4 py-8 text-center text-gray-500">불러오는 중...</div>
  }
  if (error && !title) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
        <button onClick={() => router.push('/errands')} className="mt-4 text-sm text-indigo-600 hover:underline">← 심부름 목록으로</button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">✏️ 심부름 수정</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">제목 *</label>
            <span className="text-xs text-gray-400">{title.length}/{TITLE_MAX}</span>
          </div>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={TITLE_MAX} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">상세 설명</label>
            <span className="text-xs text-gray-400">{description.length}/{DESC_MAX}</span>
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={DESC_MAX} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">보상 (원) *</label>
          <input type="number" value={reward} onChange={(e) => setReward(e.target.value)} required min={0} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">마감기한</label>
          <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={() => router.push(`/errands/${id}`)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">취소</button>
          <button type="submit" disabled={submitting} className="flex-1 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50">{submitting ? '저장 중...' : '저장'}</button>
        </div>
      </form>
    </div>
  )
}
