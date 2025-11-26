import Link from 'next/link'

export default function HomePage() {
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md text-lg font-medium"
              >
                Ver Productos
              </Link>
              <Link
                href="/categories"
                className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-md text-lg font-medium"
              >
                Explorar Categorías
              </Link>
            </div>
          </div>
        </div>
      </div>

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
