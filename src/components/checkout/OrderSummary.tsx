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
    <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
      <h2 className="text-xl font-semibold mb-4">Resumen del pedido</h2>
      
      <div className="space-y-4 mb-6">
        {items.map((item) => {
          const image = item.products.images && item.products.images.length > 0
            ? item.products.images[0]
            : '/placeholder-product.png'
          
          return (
            <div key={item.id} className="flex gap-3">
              <Link href={`/products/${item.products.slug}`} className="flex-shrink-0">
                <div className="w-16 h-16 relative bg-gray-100 rounded overflow-hidden">
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
                  <p className="text-sm font-medium text-gray-900 truncate hover:text-blue-600">
                    {item.products.name}
                  </p>
                </Link>
                <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                <p className="text-sm font-semibold text-gray-900">
                  ${(item.products.price * item.quantity).toLocaleString('es-MX')}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal</span>
          <span>${subtotal.toLocaleString('es-MX')}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Envío</span>
          <span>{shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-MX')}`}</span>
        </div>
        <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>${total.toLocaleString('es-MX')}</span>
        </div>
      </div>
    </div>
  )
}

