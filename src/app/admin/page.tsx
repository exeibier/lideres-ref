import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login?redirect=/admin')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  const { count: pendingOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Panel de administración</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Productos</h3>
          <p className="text-3xl font-bold text-gray-900">{productsCount || 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Pedidos totales</h3>
          <p className="text-3xl font-bold text-gray-900">{ordersCount || 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Pedidos pendientes</h3>
          <p className="text-3xl font-bold text-yellow-600">{pendingOrdersCount || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/products/upload"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Carga masiva de productos</h2>
          <p className="text-gray-600">Sube un archivo Excel para cargar productos en masa</p>
        </Link>

        <Link
          href="/admin/orders"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Gestionar pedidos</h2>
          <p className="text-gray-600">Ver y gestionar todos los pedidos</p>
        </Link>
      </div>
    </div>
  )
}

