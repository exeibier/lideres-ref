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

interface ShippingAddressesProps {
  addresses: Address[]
}

export default function ShippingAddresses({ addresses: initialAddresses }: ShippingAddressesProps) {
  const router = useRouter()
  const [addresses, setAddresses] = useState(initialAddresses)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Mexico',
    is_default: false,
  })

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Mexico',
      is_default: false,
    })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (address: Address) => {
    setFormData({
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
    })
    setEditingId(address.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      // Handle missing session gracefully
      if (error && error.name === 'AuthSessionMissingError') {
        setLoading(false)
        return
      }
      
      if (!user) {
        setLoading(false)
        return
      }

      // If setting as default, unset other defaults
      if (formData.is_default) {
        await supabase
          .from('shipping_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', editingId || '')
      }

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('shipping_addresses')
          .update(formData)
          .eq('id', editingId)

        if (error) {
          alert('Error al actualizar la dirección')
        } else {
          router.refresh()
          resetForm()
        }
      } else {
        // Create new
        const { error } = await supabase
          .from('shipping_addresses')
          .insert({
            user_id: user.id,
            ...formData,
          })

        if (error) {
          alert('Error al crear la dirección')
        } else {
          router.refresh()
          resetForm()
        }
      }
    } catch (error: any) {
      // Handle AuthSessionMissingError and other errors gracefully
      if (error?.name !== 'AuthSessionMissingError') {
        console.error('Error saving address:', error)
        alert('Error al guardar la dirección')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta dirección?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('shipping_addresses')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error al eliminar la dirección')
    } else {
      router.refresh()
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Direcciones de envío</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
        >
          {showForm ? 'Cancelar' : 'Agregar dirección'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4 border-t pt-4">
          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-3 gap-4">
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

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Establecer como dirección predeterminada</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md disabled:opacity-50"
          >
            {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Agregar'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="border border-gray-200 rounded-lg p-4 flex justify-between items-start"
          >
            <div>
              {address.is_default && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mb-2">
                  Predeterminada
                </span>
              )}
              <p className="font-semibold">{address.full_name}</p>
              <p className="text-sm text-gray-600">{address.address_line1}</p>
              {address.address_line2 && (
                <p className="text-sm text-gray-600">{address.address_line2}</p>
              )}
              <p className="text-sm text-gray-600">
                {address.city}, {address.state} {address.postal_code}
              </p>
              <p className="text-sm text-gray-600">{address.country}</p>
              <p className="text-sm text-gray-600 mt-1">Tel: {address.phone}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(address)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(address.id)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

        {addresses.length === 0 && !showForm && (
          <p className="text-gray-500 text-center py-8">
            No tienes direcciones guardadas
          </p>
        )}
      </div>
    </div>
  )
}

