import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary-400)' }}>MotoParts</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Tu tienda de confianza para repuestos y accesorios de motocicletas.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-4 uppercase tracking-wide">Enlaces</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="text-gray-400 hover:text-[var(--color-primary-400)] transition-colors">
                  Productos
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-400 hover:text-[var(--color-primary-400)] transition-colors">
                  Categorías
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-[var(--color-primary-400)] transition-colors">
                  Acerca de
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-4 uppercase tracking-wide">Ayuda</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-[var(--color-primary-400)] transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-400 hover:text-[var(--color-primary-400)] transition-colors">
                  Envíos
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-400 hover:text-[var(--color-primary-400)] transition-colors">
                  Devoluciones
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-4 uppercase tracking-wide">Cuenta</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auth/login" className="text-gray-400 hover:text-[var(--color-primary-400)] transition-colors">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-gray-400 hover:text-[var(--color-primary-400)] transition-colors">
                  Mi perfil
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-gray-400 hover:text-[var(--color-primary-400)] transition-colors">
                  Mis pedidos
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} MotoParts. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

