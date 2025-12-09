import Image from 'next/image'
import Link from 'next/link'

interface OrderSummaryProps {
  items: Array<{
    id: string
    quantity: number
    products: {
      id: string
      name: string
      slug: string
      price: number
      images?: string[] | null
    }
  }>
  subtotal: number
}

export default function OrderSummary({ items, subtotal }: OrderSummaryProps) {
  const shipping = 0
  const total = subtotal + shipping

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-4 shadow-sm">
      <h2 className="text-xl font-bold mb-6 text-gray-900">Resumen del pedido</h2>
      
      <div className="space-y-4 mb-6">
        {items.map((item) => {
          const image = item.products.images && item.products.images.length > 0
            ? item.products.images[0]
            : '/placeholder-product.png'
          
          return (
            <div key={item.id} className="flex gap-3">
              <Link href={`/products/${item.products.slug}`} className="flex-shrink-0">
                <div className="w-16 h-16 relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={image}
                    alt={item.products.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.products.slug}`}>
                  <p className="text-sm font-semibold text-gray-900 truncate hover:text-[var(--color-primary-600)] transition-colors">
                    {item.products.name}
                  </p>
                </Link>
                <p className="text-sm text-gray-500 mt-1">Cantidad: {item.quantity}</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  ${(item.products.price * item.quantity).toLocaleString('es-MX')}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-gray-700">
          <span className="font-medium">Subtotal</span>
          <span className="font-semibold">${subtotal.toLocaleString('es-MX')}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span className="font-medium">Envío</span>
          <span className="font-semibold">{shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-MX')}`}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>${total.toLocaleString('es-MX')}</span>
        </div>
      </div>
    </div>
  )
}

