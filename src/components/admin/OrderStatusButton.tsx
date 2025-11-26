'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface OrderStatusButtonProps {
  orderId: string
  currentStatus: string
}

export default function OrderStatusButton({ orderId, currentStatus }: OrderStatusButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const statuses = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'processing', label: 'En proceso' },
    { value: 'shipped', label: 'Enviado' },
    { value: 'delivered', label: 'Entregado' },
    { value: 'cancelled', label: 'Cancelado' },
  ]

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return

    setLoading(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (error) {
      alert('Error al actualizar el estado')
    } else {
      router.refresh()
    }
    
    setLoading(false)
  }

  return (
    <select
      value={currentStatus}
      onChange={(e) => handleStatusChange(e.target.value)}
      disabled={loading}
      className="text-sm border border-gray-300 rounded px-2 py-1 disabled:opacity-50"
    >
      {statuses.map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </select>
  )
}

