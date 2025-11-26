import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BulkUploadForm from '@/components/admin/BulkUploadForm'

export default async function BulkUploadPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login?redirect=/admin/products/upload')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Carga masiva de productos</h1>
        <p className="text-gray-600">
          Sube un archivo Excel para cargar productos en masa. El archivo será procesado por n8n para normalizar los datos.
        </p>
      </div>

      <BulkUploadForm />
    </div>
  )
}

