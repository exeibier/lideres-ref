import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'

export default async function NewProductPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login?redirect=/admin/products/new')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Crear nuevo producto</h1>
        <p className="mt-2 text-sm text-gray-600">
          Completa el formulario para agregar un nuevo producto al catálogo
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <ProductForm
          product={null}
          categories={categories || []}
          mode="create"
        />
      </div>
    </div>
  )
}


