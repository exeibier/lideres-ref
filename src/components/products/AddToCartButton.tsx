'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AddToCartButtonProps {
  productId: string
}

export default function AddToCartButton({ productId }: AddToCartButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const handleAddToCart = async () => {
    setLoading(true)
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login?redirect=/products')
      return
    }

    // Check if item already in cart
    const { data: existingItem } = await supabase
      .from('cart')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single()

    if (existingItem) {
      // Update quantity
      const { error } = await supabase
        .from('cart')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)
      
      if (error) {
        alert('Error al actualizar el carrito')
      } else {
        router.push('/cart')
        router.refresh()
      }
    } else {
      // Add new item
      const { error } = await supabase
        .from('cart')
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity,
        })
      
      if (error) {
        alert('Error al agregar al carrito')
      } else {
        router.push('/cart')
        router.refresh()
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Cantidad:</label>
        <div className="flex items-center border border-gray-300 rounded">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-1 hover:bg-gray-100"
            disabled={quantity <= 1}
          >
            -
          </button>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 text-center border-0 focus:ring-0"
          />
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-1 hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Agregando...' : 'Agregar al carrito'}
      </button>
    </div>
  )
}

