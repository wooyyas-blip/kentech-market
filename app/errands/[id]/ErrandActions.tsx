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

// 변경 사항 (v3):
// - done 상태일 때 요청자/수락자에게 "후기 남기기" 버튼 노출
//   (서로 상대방을 평가할 수 있음)
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
      .update({ accepted_by: currentUserId, status: 'in_progress' })
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
      .update({ accepted_by: null, status: 'open' })
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
    const { error } = await supabase.from('errands').delete().eq('id', errandId)
    setLoading(false)
    if (error) return alert('삭제 실패: ' + error.message)
    router.push('/errands')
  }

  return (
    <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t">
      {/* 케이스 1: 제3자, open, 수락자 없음 → 수락 */}
      {!isRequester && !isAcceptor && currentStatus === 'open' && !hasAcceptor && (
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
        >
          🙋 내가 도와줄게요
        </button>
      )}

      {/* 케이스 2: 수락자, 진행중 → 완료/취소 */}
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

      {/* 케이스 3: 요청자 */}
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

          {currentStatus !== 'in_progress' && currentStatus !== 'done' && (
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

      {/* 케이스 4: done 상태 + 요청자 또는 수락자 → 후기 남기기 */}
      {currentStatus === 'done' && (isRequester || isAcceptor) && (
        <Link
          href={`/rate/errand/${errandId}`}
          className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-center font-medium"
        >
          📝 후기 남기기
        </Link>
      )}

      {/* 케이스 5: done 상태 + 제3자 */}
      {currentStatus === 'done' && !isRequester && !isAcceptor && (
        <p className="text-sm text-gray-500 mx-auto">✨ 완료된 심부름이에요</p>
      )}
    </div>
  )
}
