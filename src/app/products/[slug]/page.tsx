import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import AddToCartButton from '@/components/products/AddToCartButton'

export const revalidate = 60

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    isAdmin = profile?.role === 'admin'
  }
  
  // Build query - admins can see all products, others only active
  let productQuery = supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('slug', slug)
  
  if (!isAdmin) {
    productQuery = productQuery.eq('status', 'active')
  }
  
  const { data: product, error } = await productQuery.single()

  if (error || !product) {
    notFound()
  }
  
  // Non-admins should not see inactive/draft products even if they access by slug
  if (!isAdmin && product.status !== 'active') {
    notFound()
  }

  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="aspect-square relative bg-gray-50 rounded-xl overflow-hidden mb-4 border border-gray-200 shadow-sm">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Sin imagen
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(0, 4).map((image: string, index: number) => (
                <div key={index} className="aspect-square relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 25vw, 12.5vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {isAdmin && (
            <div className="mb-4">
              <Link
                href={`/admin/products/${product.id}/edit`}
                className="inline-flex items-center px-4 py-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white text-sm font-bold rounded-xl transition-all duration-200 hover:shadow-md"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Editar producto
              </Link>
            </div>
          )}
          {product.brand && (
            <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          
          {product.categories && (
            <div className="mb-4">
              <Link
                href={`/categories/${product.categories.slug}`}
                className="text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] text-sm font-semibold transition-colors"
              >
                {product.categories.name}
              </Link>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-3xl font-bold text-gray-900">
                ${product.price.toLocaleString('es-MX')}
              </span>
              {hasDiscount && (
                <span className="text-xl text-gray-500 line-through">
                  ${product.compare_at_price?.toLocaleString('es-MX')}
                </span>
              )}
            </div>
            {hasDiscount && (
              <p className="text-sm font-semibold text-[var(--color-error)]">
                Ahorra ${((product.compare_at_price! - product.price)).toLocaleString('es-MX')}
              </p>
            )}
          </div>

          {product.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Descripción</h2>
              <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {product.sku && (
            <div className="mb-4">
              <span className="text-sm text-gray-500">SKU: </span>
              <span className="text-sm font-mono">{product.sku}</span>
            </div>
          )}

          {product.part_number && (
            <div className="mb-4">
              <span className="text-sm text-gray-500">Número de parte: </span>
              <span className="text-sm font-mono">{product.part_number}</span>
            </div>
          )}

          {product.motorcycle_brand && (
            <div className="mb-4">
              <span className="text-sm text-gray-500">Marca de moto: </span>
              <span className="text-sm">{product.motorcycle_brand}</span>
            </div>
          )}

          {product.motorcycle_model && (
            <div className="mb-4">
              <span className="text-sm text-gray-500">Modelo: </span>
              <span className="text-sm">{product.motorcycle_model}</span>
            </div>
          )}

          {product.compatibility && product.compatibility.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2">Compatibilidad</h3>
              <div className="flex flex-wrap gap-2">
                {product.compatibility.map((model: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                  >
                    {model}
                  </span>
                ))}
              </div>
            </div>
          )}

          <AddToCartButton productId={product.id} />
        </div>
      </div>
    </div>
  )
}

