import Link from 'next/link'

interface CartSummaryProps {
  subtotal: number
}

export default function CartSummary({ subtotal }: CartSummaryProps) {
  const shipping = 0 // Free shipping for now, can be calculated later
  const total = subtotal + shipping

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
      <h2 className="text-xl font-semibold mb-4">Resumen del pedido</h2>
      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal</span>
          <span>${subtotal.toLocaleString('es-MX')}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Envío</span>
          <span>{shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-MX')}`}</span>
        </div>
        <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>${total.toLocaleString('es-MX')}</span>
        </div>
      </div>
      <Link
        href="/checkout"
        className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md text-center"
      >
        Proceder al checkout
      </Link>
      <Link
        href="/products"
        className="block w-full mt-3 text-center text-blue-600 hover:text-blue-700"
      >
        Continuar comprando
      </Link>
    </div>
  )
}

