import Link from 'next/link'
import { Product } from '@/lib/types'

// 상품 카드: 목록과 홈에서 재사용
// image_urls 배열의 첫 번째 사진을 대표 사진으로 표시
// 사진이 없으면 이모지 placeholder

const statusLabels = {
  selling: { label: '판매중', color: 'bg-green-100 text-green-700' },
  reserved: { label: '예약중', color: 'bg-yellow-100 text-yellow-700' },
  sold: { label: '거래완료', color: 'bg-gray-200 text-gray-600' },
}

export default function ProductCard({ product }: { product: Product }) {
  const status = statusLabels[product.status]
  const thumbnail = product.image_urls?.[0] // 대표 사진 = 첫 번째

  return (
    <Link
      href={`/products/${product.id}`}
      className="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition"
    >
      {/* 이미지 영역: 1:1 비율 정사각형 */}
      <div className="aspect-square w-full bg-gray-100 flex items-center justify-center overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl">🛍️</span>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
            {status.label}
          </span>
          {product.category && (
            <span className="text-xs text-gray-400">{product.category}</span>
          )}
        </div>
        <h3 className="font-medium text-sm text-gray-900 line-clamp-1 mb-1">
          {product.title}
        </h3>
        <p className="text-base font-bold text-orange-600">
          {product.price === 0 ? '나눔' : `${product.price.toLocaleString()}원`}
        </p>
      </div>
    </Link>
  )
}