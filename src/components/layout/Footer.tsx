import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">MotoParts</h3>
            <p className="text-gray-400 text-sm">
              Tu tienda de confianza para repuestos y accesorios de motocicletas.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4">Enlaces</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/products" className="hover:text-white">
                  Productos
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-white">
                  Categorías
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white">
                  Acerca de
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4">Ayuda</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white">
                  Envíos
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white">
                  Devoluciones
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4">Cuenta</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/auth/login" className="hover:text-white">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-white">
                  Mi perfil
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white">
                  Mis pedidos
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} MotoParts. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

