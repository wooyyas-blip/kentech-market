'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// 심부름 액션 컴포넌트 (Client Component)
// 역할에 따라 다른 버튼을 보여주는 게 핵심 차별점
// - 다른 사람 + 상태 open + 수락자 없음 → "수락하기"
// - 요청자 본인 → 상태 변경 + 삭제
// - 수락자 본인 → 완료 처리 + 수락 취소
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

  // 수락하기: 제3자가 "내가 할게요" 누르는 액션
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

  // 수락 취소: 수락자가 마음 바뀜
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

  // 완료 처리: 요청자나 수락자가 끝났다고 표시
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

  // 삭제: 요청자만, 단 진행중이 아닐 때
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
      {/* 케이스 1: 제3자가 보고 있고, 아직 수락자 없는 open 상태 → 수락 버튼 */}
      {!isRequester && !isAcceptor && currentStatus === 'open' && !hasAcceptor && (
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
        >
          🙋 내가 도와줄게요
        </button>
      )}

      {/* 케이스 2: 수락자가 보고 있는 진행중 상태 → 완료/취소 */}
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

      {/* 케이스 3: 요청자가 보고 있을 때 */}
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
            <button
              onClick={handleDelete}
              disabled={loading}
              className="ml-auto px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              삭제
            </button>
          )}
        </>
      )}

      {/* 케이스 4: 완료된 심부름 — 아무 버튼 없음 */}
      {currentStatus === 'done' && (
        <p className="text-sm text-gray-500 mx-auto">
          ✨ 완료된 심부름이에요
        </p>
      )}
    </div>
  )
}
