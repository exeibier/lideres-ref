import Link from 'next/link'

interface CartSummaryProps {
  subtotal: number
}

export default function CartSummary({ subtotal }: CartSummaryProps) {
  const shipping: number = 0 // Free shipping for now, can be calculated later
  const total = subtotal + shipping

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-4 shadow-sm">
      <h2 className="text-xl font-bold mb-6 text-gray-900">Resumen del pedido</h2>
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-700">
          <span className="font-medium">Subtotal</span>
          <span className="font-semibold">${subtotal.toLocaleString('es-MX')}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span className="font-medium">Envío</span>
          <span className="font-semibold">{shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-MX')}`}</span>
        </div>
        <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>${total.toLocaleString('es-MX')}</span>
        </div>
      </div>
      <Link
        href="/checkout"
        className="block w-full bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-bold py-3.5 px-6 rounded-xl text-center transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
      >
        Proceder al checkout
      </Link>
      <Link
        href="/products"
        className="block w-full mt-3 text-center text-sm font-semibold text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] transition-colors"
      >
        Continuar comprando
      </Link>
    </div>
  )
}

