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
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      // Handle missing session gracefully
      if (error && error.name === 'AuthSessionMissingError') {
        router.push('/auth/login?redirect=/products')
        setLoading(false)
        return
      }
      
      if (!user) {
        router.push('/auth/login?redirect=/products')
        setLoading(false)
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
    } catch (error: any) {
      // Handle AuthSessionMissingError and other errors gracefully
      if (error?.name === 'AuthSessionMissingError') {
        router.push('/auth/login?redirect=/products')
      } else {
        console.error('Error adding to cart:', error)
        alert('Error al agregar al carrito')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold text-gray-700">Cantidad:</label>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-2 hover:bg-gray-100 transition-colors font-semibold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={quantity <= 1}
          >
            -
          </button>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 text-center border-0 border-x border-gray-300 focus:ring-2 focus:ring-[var(--color-primary-600)] focus:ring-offset-0 outline-none font-semibold"
          />
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="px-4 py-2 hover:bg-gray-100 transition-colors font-semibold text-gray-700"
          >
            +
          </button>
        </div>
      </div>
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className="w-full bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-bold py-3.5 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
      >
        {loading ? 'Agregando...' : 'Agregar al carrito'}
      </button>
    </div>
  )
}

