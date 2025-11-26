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

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
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
  }

  const selectedAddress = addresses.find(a => a.id === selectedAddressId)

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <h2 className="text-xl font-semibold">Dirección de envío</h2>

      {addresses.length > 0 && (
        <div>
          <label className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={useSavedAddress}
              onChange={(e) => setUseSavedAddress(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2">Usar dirección guardada</span>
          </label>

          {useSavedAddress && (
            <select
              value={selectedAddressId}
              onChange={(e) => setSelectedAddressId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección línea 1 *
            </label>
            <input
              type="text"
              required
              value={formData.address_line1}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección línea 2
            </label>
            <input
              type="text"
              value={formData.address_line2}
              onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código postal *
            </label>
            <input
              type="text"
              required
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              País *
            </label>
            <input
              type="text"
              required
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas del pedido (opcional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Procesando...' : 'Confirmar pedido'}
      </button>
    </form>
  )
}

