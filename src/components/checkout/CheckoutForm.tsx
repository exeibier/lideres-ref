'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Address {
  id: string
  full_name: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
}

interface CheckoutFormProps {
  addresses: Address[]
}

export default function CheckoutForm({ addresses }: CheckoutFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [useSavedAddress, setUseSavedAddress] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Mexico',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      // Handle missing session gracefully
      if (error && error.name === 'AuthSessionMissingError') {
        router.push('/auth/login')
        setLoading(false)
        return
      }
      
      if (!user) {
        router.push('/auth/login')
        setLoading(false)
        return
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
          price,
          sku
        )
      `)
      .eq('user_id', user.id)

    if (!cartItems || cartItems.length === 0) {
      alert('Tu carrito está vacío')
      setLoading(false)
      return
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (item.products.price * item.quantity)
    }, 0)
    const shippingCost = 0 // Can be calculated based on address
    const total = subtotal + shippingCost

    // Get or create shipping address
    let shippingAddressId = null
    let shippingAddress = null

    if (useSavedAddress && selectedAddressId) {
      shippingAddressId = selectedAddressId
      const selectedAddress = addresses.find(a => a.id === selectedAddressId)
      if (selectedAddress) {
        shippingAddress = selectedAddress
      }
    } else {
      // Create new address
      const { data: newAddress, error: addressError } = await supabase
        .from('shipping_addresses')
        .insert({
          user_id: user.id,
          ...formData,
        })
        .select()
        .single()

      if (addressError) {
        alert('Error al guardar la dirección')
        setLoading(false)
        return
      }

      shippingAddressId = newAddress.id
      shippingAddress = newAddress
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create order via API route (handles n8n webhook)
    const response = await fetch('/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shippingAddressId,
        shippingAddress,
        notes: formData.notes || null,
      }),
    })

    const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Error al crear el pedido')
        setLoading(false)
        return
      }

      router.push(`/orders/${data.orderId}`)
    } catch (error: any) {
      // Handle AuthSessionMissingError and other errors gracefully
      if (error?.name === 'AuthSessionMissingError') {
        router.push('/auth/login')
      } else {
        console.error('Error in checkout:', error)
        alert('Error al procesar el pedido')
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedAddress = addresses.find(a => a.id === selectedAddressId)

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">Dirección de envío</h2>

      {addresses.length > 0 && (
        <div>
          <label className="flex items-center mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={useSavedAddress}
              onChange={(e) => setUseSavedAddress(e.target.checked)}
              className="rounded-md border-gray-300 w-5 h-5 text-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-600)] focus:ring-offset-0 cursor-pointer"
            />
            <span className="ml-3 text-sm font-semibold text-gray-700">Usar dirección guardada</span>
          </label>

          {useSavedAddress && (
            <select
              value={selectedAddressId}
              onChange={(e) => setSelectedAddressId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-primary-600)] focus:border-[var(--color-primary-600)] outline-none transition-all text-gray-900 font-medium"
            >
              <option value="">Selecciona una dirección</option>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.full_name} - {address.address_line1}, {address.city}
                  {address.is_default && ' (Predeterminada)'}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {(!useSavedAddress || !selectedAddress) && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-primary-600)] focus:border-[var(--color-primary-600)] outline-none transition-all text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-primary-600)] focus:border-[var(--color-primary-600)] outline-none transition-all text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dirección línea 1 *
            </label>
            <input
              type="text"
              required
              value={formData.address_line1}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-primary-600)] focus:border-[var(--color-primary-600)] outline-none transition-all text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dirección línea 2
            </label>
            <input
              type="text"
              value={formData.address_line2}
              onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-primary-600)] focus:border-[var(--color-primary-600)] outline-none transition-all text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ciudad *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-primary-600)] focus:border-[var(--color-primary-600)] outline-none transition-all text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Estado *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-primary-600)] focus:border-[var(--color-primary-600)] outline-none transition-all text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Código postal *
            </label>
            <input
              type="text"
              required
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-primary-600)] focus:border-[var(--color-primary-600)] outline-none transition-all text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              País *
            </label>
            <input
              type="text"
              required
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-primary-600)] focus:border-[var(--color-primary-600)] outline-none transition-all text-gray-900"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Notas del pedido (opcional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-primary-600)] focus:border-[var(--color-primary-600)] outline-none transition-all text-gray-900 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-bold py-3.5 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
      >
        {loading ? 'Procesando...' : 'Confirmar pedido'}
      </button>
    </form>
  )
}

