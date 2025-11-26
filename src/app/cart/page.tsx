import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CartItems from '@/components/cart/CartItems'
import CartSummary from '@/components/cart/CartSummary'

export default async function CartPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login?redirect=/cart')
  }

  const { data: cartItems, error } = await supabase
    .from('cart')
    .select(`
      id,
      quantity,
      products (
        id,
        name,
        slug,
        price,
        compare_at_price,
        images
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="text-center py-12">Error al cargar el carrito</div>
  }

  const subtotal = cartItems?.reduce((sum, item) => {
    return sum + (item.products.price * item.quantity)
  }, 0) || 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Carrito de compras</h1>
      
      {cartItems && cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CartItems items={cartItems} />
          </div>
          <div className="lg:col-span-1">
            <CartSummary subtotal={subtotal} />
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
          <a
            href="/products"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
          >
            Ver productos
          </a>
        </div>
      )}
    </div>
  )
}

