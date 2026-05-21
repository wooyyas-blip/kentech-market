import Link from 'next/link'
import { Product } from '@/lib/types'

const statusLabels: Record<Product['status'], { label: string; color: string }> = {
  selling: { label: '판매중', color: 'bg-green-100 text-green-700' },
  reserved: { label: '예약중', color: 'bg-yellow-100 text-yellow-700' },
  sold: { label: '거래완료', color: 'bg-gray-200 text-gray-600' },
}

export default function ProductCard({ product }: { product: Product }) {
  const statusInfo = statusLabels[product.status]

  return (
    <Link
      href={`/products/${product.id}`}
      className="block overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-orange-400 hover:shadow-md"
    >
      {/* 이미지 영역 (현재는 placeholder) */}
      <div className="flex aspect-square w-full items-center justify-center bg-gray-100 text-5xl">
        🛍️
      </div>

      {/* 정보 영역 */}
      <div className="p-3">
        <div className="mb-1 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          {product.category && (
            <span className="text-xs text-gray-500">{product.category}</span>
          )}
        </div>

        <h3 className="line-clamp-2 text-sm font-medium text-gray-900">
          {product.title}
        </h3>

        <p className="mt-1 text-base font-bold text-gray-900">
          {product.price === 0 ? '나눔' : `${product.price.toLocaleString()}원`}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          {new Date(product.created_at).toLocaleDateString('ko-KR')}
        </p>
      </div>
    </Link>
  )
}