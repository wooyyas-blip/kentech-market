'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

type Props = {
  errandId: string
  currentStatus: 'open' | 'in_progress' | 'done'
  isRequester: boolean
  isAcceptor: boolean
  hasAcceptor: boolean
  currentUserId: string
}

export default function ErrandActions({
  errandId,
  currentStatus,
  isRequester,
  isAcceptor,
  hasAcceptor,
  currentUserId,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleAccept = async () => {
    if (!confirm('이 심부름을 수락하시겠어요? 책임감 있게 진행해주세요!')) return
    setLoading(true)
    const { error } = await supabase
      .from('errands')
      .update({
        accepted_by: currentUserId,
        status: 'in_progress',
      })
      .eq('id', errandId)
    setLoading(false)
    if (error) return alert('수락 실패: ' + error.message)
    router.refresh()
  }

  const handleCancelAccept = async () => {
    if (!confirm('수락을 취소할까요?')) return
    setLoading(true)
    const { error } = await supabase
      .from('errands')
      .update({
        accepted_by: null,
        status: 'open',
      })
      .eq('id', errandId)
    setLoading(false)
    if (error) return alert('취소 실패: ' + error.message)
    router.refresh()
  }

  const handleComplete = async () => {
    if (!confirm('심부름이 완료되었나요?')) return
    setLoading(true)
    const { error } = await supabase
      .from('errands')
      .update({ status: 'done' })
      .eq('id', errandId)
    setLoading(false)
    if (error) return alert('완료 처리 실패: ' + error.message)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm('정말 삭제할까요? 되돌릴 수 없어요.')) return
    setLoading(true)
    const { error } = await supabase
      .from('errands')
      .delete()
      .eq('id', errandId)
    setLoading(false)
    if (error) return alert('삭제 실패: ' + error.message)
    router.push('/errands')
  }

  return (
    <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t">
      {!isRequester && !isAcceptor && currentStatus === 'open' && !hasAcceptor && (
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
        >
          🙋 내가 도와줄게요
        </button>
      )}

      {isAcceptor && currentStatus === 'in_progress' && (
        <>
          <button
            onClick={handleComplete}
            disabled={loading}
            className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            ✅ 완료했어요
          </button>
          <button
            onClick={handleCancelAccept}
            disabled={loading}
            className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            수락 취소
          </button>
        </>
      )}

      {isRequester && (
        <>
          {currentStatus === 'in_progress' && (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              ✅ 완료 처리
            </button>
          )}

          {currentStatus !== 'in_progress' && (
            <div className="flex gap-2 ml-auto">
              {currentStatus === 'open' && (
                <Link
                  href={`/errands/${errandId}/edit`}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  ✏️ 수정
                </Link>
              )}
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          )}
        </>
      )}

      {currentStatus === 'done' && !isRequester && (
        <p className="text-sm text-gray-500 mx-auto">
          ✨ 완료된 심부름이에요
        </p>
      )}
    </div>
  )
}
