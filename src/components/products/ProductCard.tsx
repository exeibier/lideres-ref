import Link from 'next/link'
import Image from 'next/image'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    compare_at_price?: number | null
    images?: string[] | null
    brand?: string | null
    motorcycle_brand?: string | null
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.images && product.images.length > 0 ? product.images[0] : '/placeholder-product.png'
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-square relative bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Sin imagen
            </div>
          )}
          {hasDiscount && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
              Oferta
            </div>
          )}
        </div>
        <div className="p-4">
          {product.brand && (
            <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
          )}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          {product.motorcycle_brand && (
            <p className="text-xs text-gray-400 mb-2">Para: {product.motorcycle_brand}</p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toLocaleString('es-MX')}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                ${product.compare_at_price?.toLocaleString('es-MX')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

