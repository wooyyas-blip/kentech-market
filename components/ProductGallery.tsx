'use client'

import { useRef, useState } from 'react'

// 상품 사진 갤러리 (Client Component)
// 스크롤 위치를 추적해서 현재 보고 있는 사진 인덱스를 표시
// IntersectionObserver를 안 쓰고 onScroll로 단순화 (성능 충분)
type Props = {
  images: string[]
  title: string
}

export default function ProductGallery({ images, title }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  // 가로 스크롤 시 현재 보이는 사진 인덱스 계산
  // scrollLeft / containerWidth = 페이지 인덱스
  const handleScroll = () => {
    if (!scrollRef.current) return
    const containerWidth = scrollRef.current.clientWidth
    const scrollLeft = scrollRef.current.scrollLeft
    // 반올림으로 가장 가까운 인덱스 계산
    const newIndex = Math.round(scrollLeft / containerWidth)
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex)
    }
  }

  return (
    <div className="relative w-full aspect-square bg-gray-100">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory"
      >
        {images.map((url, index) => (
          <div
            key={index}
            className="w-full h-full flex-shrink-0 snap-center"
          >
            <img
              src={url}
              alt={`${title} ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* 사진 인덱스 인디케이터 (여러 장일 때만 표시) */}
      {images.length > 1 && (
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  )
}