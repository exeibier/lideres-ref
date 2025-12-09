import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/products/ProductCard'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()
  
  // First, try to get featured products
  const { data: featuredProducts } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_at_price, images, brand, motorcycle_brand')
    .eq('status', 'active')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(12)

  // If no featured products, get random active products
  let productsToShow = featuredProducts
  if (!featuredProducts || featuredProducts.length === 0) {
    const { data: randomProducts } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, images, brand, motorcycle_brand')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(12)
    
    productsToShow = randomProducts || []
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              Repuestos y Accesorios
              <span className="block text-blue-400">para Motocicletas</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
              Encuentra todo lo que necesitas para tu moto. Calidad garantizada y envío rápido.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/products"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md text-lg font-medium transition-colors duration-200"
              >
                Ver Productos
              </Link>
              <Link
                href="/categories"
                className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-md text-lg font-medium transition-colors duration-200"
              >
                Explorar Categorías
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products Storefront Section */}
      {productsToShow && productsToShow.length > 0 && (
        <div className="py-16 sm:py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {featuredProducts && featuredProducts.length > 0 ? (
                  <>
                    Productos <span className="text-[var(--color-primary-600)]">Destacados</span>
                  </>
                ) : (
                  <>
                    Productos <span className="text-[var(--color-primary-600)]">Populares</span>
                  </>
                )}
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Descubre nuestra selección de productos de alta calidad para tu motocicleta
              </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {productsToShow.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-[var(--color-primary-600)] rounded-lg hover:bg-[var(--color-primary-700)] transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Ver Todos los Productos
                <svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold mb-2">Envío Rápido</h3>
              <p className="text-gray-600">
                Recibe tus pedidos en tiempo récord
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2">Calidad Garantizada</h3>
              <p className="text-gray-600">
                Productos originales y de alta calidad
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold mb-2">Compatibilidad</h3>
              <p className="text-gray-600">
                Encuentra repuestos para tu modelo de moto
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
