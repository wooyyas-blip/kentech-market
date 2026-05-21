'use client'

import { useRouter } from 'next/navigation'

// 상세 페이지에서 "쪽지 보내기" 누르면 1:1 채팅방으로 이동
// (본인 글이면 이 버튼은 표시하지 않음 — 부모에서 분기)
export default function SendMessageButton({ partnerId }: { partnerId: string }) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(`/messages/${partnerId}`)}
      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
    >
      💌 쪽지 보내기
    </button>
  )
}