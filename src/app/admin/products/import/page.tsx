import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BulkImportForm from '@/components/admin/BulkImportForm'

export default async function BulkImportPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login?redirect=/admin/products/import')
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Product Importer</h1>
        <p className="text-gray-600">
          Import products in bulk from provider files. Select your provider and upload the data file.
        </p>
      </div>

      <BulkImportForm />
    </div>
  )
}

