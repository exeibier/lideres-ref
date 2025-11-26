import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Image from 'next/image'

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login?redirect=/orders')
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (orderError || !order) {
    notFound()
  }

  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select(`
      *,
      products (
        id,
        name,
        slug,
        images
      )
    `)
    .eq('order_id', order.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendiente',
      processing: 'En proceso',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    }
    return statusMap[status] || status
  }

  const shippingAddress = order.shipping_address as any

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pedido #{order.order_number}
        </h1>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </span>
          <span className="text-sm text-gray-500">
            Fecha: {new Date(order.created_at).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Artículos del pedido</h2>
            <div className="space-y-4">
              {orderItems?.map((item: any) => {
                const image = item.products?.images && item.products.images.length > 0
                  ? item.products.images[0]
                  : '/placeholder-product.png'
                
                return (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 relative bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={image}
                        alt={item.product_name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                      {item.product_sku && (
                        <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                      )}
                      <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(item.price * item.quantity).toLocaleString('es-MX')}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${item.price.toLocaleString('es-MX')} c/u
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {shippingAddress && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Dirección de envío</h2>
              <div className="text-gray-700">
                <p className="font-medium">{shippingAddress.full_name}</p>
                <p>{shippingAddress.address_line1}</p>
                {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                <p>
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}
                </p>
                <p>{shippingAddress.country}</p>
                <p className="mt-2">Tel: {shippingAddress.phone}</p>
              </div>
            </div>
          )}

          {order.notes && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">Notas del pedido</h2>
              <p className="text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Resumen</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>${order.subtotal.toLocaleString('es-MX')}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Envío</span>
                <span>${order.shipping_cost.toLocaleString('es-MX')}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>${order.total.toLocaleString('es-MX')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

