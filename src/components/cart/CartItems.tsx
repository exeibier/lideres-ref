'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface CartItem {
  id: string
  quantity: number
  products: {
    id: string
    name: string
    slug: string
    price: number
    compare_at_price?: number | null
    images?: string[] | null
  }
}

interface CartItemsProps {
  items: CartItem[]
}

export default function CartItems({ items: initialItems }: CartItemsProps) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [updating, setUpdating] = useState<string | null>(null)

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId)
      return
    }

    setUpdating(itemId)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('cart')
      .update({ quantity: newQuantity })
      .eq('id', itemId)

    if (error) {
      alert('Error al actualizar la cantidad')
    } else {
      setItems(items.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ))
      router.refresh()
    }
    setUpdating(null)
  }

  const removeItem = async (itemId: string) => {
    setUpdating(itemId)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', itemId)

    if (error) {
      alert('Error al eliminar el producto')
    } else {
      setItems(items.filter(item => item.id !== itemId))
      router.refresh()
    }
    setUpdating(null)
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const image = item.products.images && item.products.images.length > 0 
          ? item.products.images[0] 
          : '/placeholder-product.png'
        
        return (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4 shadow-sm"
          >
            <Link href={`/products/${item.products.slug}`} className="flex-shrink-0">
              <div className="w-24 h-24 relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={image}
                  alt={item.products.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            </Link>
            <div className="flex-1">
              <Link href={`/products/${item.products.slug}`}>
                <h3 className="font-semibold text-gray-900 hover:text-[var(--color-primary-600)] transition-colors">
                  {item.products.name}
                </h3>
              </Link>
              <p className="text-lg font-bold text-gray-900 mt-2">
                ${item.products.price.toLocaleString('es-MX')}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={updating === item.id}
                    className="px-4 py-2 hover:bg-gray-100 disabled:opacity-50 transition-colors font-semibold text-gray-700"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold py-2">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={updating === item.id}
                    className="px-4 py-2 hover:bg-gray-100 disabled:opacity-50 transition-colors font-semibold text-gray-700"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={updating === item.id}
                  className="text-[var(--color-error)] hover:text-[var(--color-error)] text-sm font-semibold disabled:opacity-50 transition-colors"
                  aria-label="Remove item"
                >
                  Eliminar
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                ${(item.products.price * item.quantity).toLocaleString('es-MX')}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

