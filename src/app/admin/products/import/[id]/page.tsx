import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CommitButton from '@/components/admin/CommitButton'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ImportDetailsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  // Fetch import preview directly from database
  const { data: batch } = await supabase
    .from('import_batch')
    .select('*')
    .eq('id', id)
    .single()

  const { data: items } = await supabase
    .from('import_item')
    .select('stage, error_text, provider_sku, staged_json')
    .eq('batch_id', id)

  const totalRows = items?.length || 0
  const validRows = items?.filter((item) => item.stage === 'staged').length || 0
  const failedRows = items?.filter((item) => item.stage === 'failed').length || 0

  const failedItems = items
    ?.filter((item) => item.stage === 'failed')
    .slice(0, 20)
    .map((item) => ({
      providerSku: item.provider_sku,
      name: (item.staged_json as any)?.name || 'N/A',
      errors: item.error_text ? item.error_text.split('; ') : [],
    })) || []

  const validItems = items
    ?.filter((item) => item.stage === 'staged')
    .slice(0, 10)
    .map((item) => ({
      providerSku: item.provider_sku,
      name: (item.staged_json as any)?.name || 'N/A',
      price: (item.staged_json as any)?.price || null,
      stock: (item.staged_json as any)?.stock || null,
    })) || []

  const preview = batch ? {
    batch: {
      id: batch.id,
      providerCode: batch.provider_code,
      status: batch.status,
      createdAt: batch.created_at,
    },
    summary: {
      totalRows,
      validRows,
      failedRows,
    },
    samples: {
      valid: validItems,
      failed: failedItems,
    },
  } : null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href="/admin/products/import"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Import
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Details</h1>
        <p className="text-gray-600">Batch ID: {id}</p>
      </div>

      {preview ? (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Rows</p>
                <p className="text-2xl font-bold">{preview.summary.totalRows}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valid Rows</p>
                <p className="text-2xl font-bold text-green-600">{preview.summary.validRows}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Failed Rows</p>
                <p className="text-2xl font-bold text-red-600">{preview.summary.failedRows}</p>
              </div>
            </div>
          </div>

          {preview.samples.valid.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Sample Valid Items</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.samples.valid.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{item.providerSku}</td>
                        <td className="px-6 py-4 text-sm">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.price ? `$${item.price.toFixed(2)}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{item.stock ?? 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {preview.samples.failed.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Sample Failed Items</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.samples.failed.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{item.providerSku}</td>
                        <td className="px-6 py-4 text-sm">{item.name}</td>
                        <td className="px-6 py-4 text-sm">
                          <ul className="list-disc list-inside">
                            {item.errors.map((error: string, errIndex: number) => (
                              <li key={errIndex} className="text-red-600">{error}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {preview.batch.status === 'staged' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <CommitButton batchId={id} validRows={preview.summary.validRows} />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-gray-600">Loading import details...</p>
        </div>
      )}
    </div>
  )
}

