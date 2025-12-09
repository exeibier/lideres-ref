import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CheckoutForm from '@/components/checkout/CheckoutForm'
import OrderSummary from '@/components/checkout/OrderSummary'

export default async function CheckoutPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login?redirect=/checkout')
  }

  // Get cart items
  const { data: cartItems } = await supabase
    .from('cart')
    .select(`
      id,
      quantity,
      products (
        id,
        name,
        slug,
        price,
        images
      )
    `)
    .eq('user_id', user.id)

  if (!cartItems || cartItems.length === 0) {
    redirect('/cart')
  }

  // Get user's saved addresses
  const { data: addresses } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })

  // Transform cart items to ensure products is a single object, not an array
  const transformedCartItems = cartItems.map(item => ({
    id: item.id,
    quantity: item.quantity,
    products: Array.isArray(item.products) ? item.products[0] : item.products
  }))

  const subtotal = transformedCartItems.reduce((sum, item) => {
    return sum + (item.products.price * item.quantity)
  }, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CheckoutForm addresses={addresses || []} />
        </div>
        <div className="lg:col-span-1">
          <OrderSummary items={transformedCartItems} subtotal={subtotal} />
        </div>
      </div>
    </div>
  )
}

