'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UploadButton } from '@/lib/uploadthing'

type ProviderCode = 'motos_y_equipos' | 'mrm'

interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error'
  message?: string
  batchId?: string
  errors?: string[]
  summary?: {
    totalRows: number
    validRows: number
    failedRows: number
  }
}

export default function BulkImportForm() {
  const router = useRouter()
  const [providerCode, setProviderCode] = useState<ProviderCode>('motos_y_equipos')
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ fileName: string; url: string }>>([])
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle' })

  const handleFileUploadComplete = (res: Array<{ name: string; url: string; size: number; key: string }>) => {
    if (res && res.length > 0) {
      const file = res[0]
      setFileUrl(file.url)
      setUploadedFiles([{ fileName: file.name, url: file.url }])
      setUploadStatus({ status: 'idle' })
    }
  }

  const handleFileUploadError = (error: Error) => {
    setUploadStatus({
      status: 'error',
      message: `Error uploading file: ${error.message}`,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileUrl) {
      setUploadStatus({
        status: 'error',
        message: 'Please upload a file first',
      })
      return
    }

    setUploadStatus({ status: 'processing', message: 'Processing import...' })

    try {
      const response = await fetch('/api/imports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerCode,
          fileUrl,
          uploadThingFiles: uploadedFiles.map((f) => ({
            fileName: f.fileName,
            url: f.url,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setUploadStatus({
          status: 'error',
          message: data.error || 'Error processing import',
          errors: data.errors,
        })
        return
      }

      setUploadStatus({
        status: 'success',
        message: 'Import staged successfully',
        batchId: data.batchId,
        summary: {
          totalRows: data.totalRows,
          validRows: data.validRows,
          failedRows: data.failedRows,
        },
      })

      // Reset form after success
      setTimeout(() => {
        setFileUrl(null)
        setUploadedFiles([])
        setUploadStatus({ status: 'idle' })
      }, 3000)
    } catch (error) {
      setUploadStatus({
        status: 'error',
        message: 'Error processing import. Please try again.',
      })
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
            Provider
          </label>
          <select
            id="provider"
            value={providerCode}
            onChange={(e) => setProviderCode(e.target.value as ProviderCode)}
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 bg-white py-2 px-3"
          >
            <option value="motos_y_equipos">Motos y Equipos</option>
            <option value="mrm">MRM</option>
          </select>
          <p className="mt-2 text-sm text-gray-500">
            Select the provider for this import. The file format will be validated accordingly.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data File (CSV/XLSX)
          </label>
          <div className="mb-2 [&_button]:bg-blue-600 [&_button]:hover:bg-blue-700 [&_button]:text-white [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-md [&_button]:font-semibold [&_button]:border-0 [&_button]:cursor-pointer">
            <UploadButton
              endpoint="importFile"
              onClientUploadComplete={handleFileUploadComplete}
              onUploadError={handleFileUploadError}
              onUploadBegin={() => setUploadStatus({ status: 'uploading', message: 'Uploading file...' })}
            />
          </div>
          {fileUrl && (
            <p className="mt-2 text-sm text-green-600">
              ✓ File uploaded: {uploadedFiles[0]?.fileName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images (Optional)
          </label>
          <div className="mb-2 [&_button]:bg-gray-600 [&_button]:hover:bg-gray-700 [&_button]:text-white [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-md [&_button]:font-semibold [&_button]:border-0 [&_button]:cursor-pointer">
            <UploadButton
              endpoint="productImage"
              onClientUploadComplete={(res) => {
                const newFiles = res.map((f) => ({ fileName: f.name, url: f.url }))
                setUploadedFiles([...uploadedFiles, ...newFiles])
              }}
              onUploadError={handleFileUploadError}
            />
          </div>
          {uploadedFiles.length > 1 && (
            <p className="mt-2 text-sm text-gray-600">
              {uploadedFiles.length - 1} image(s) uploaded
            </p>
          )}
        </div>

        {uploadStatus.status !== 'idle' && (
          <div className={`rounded-md p-4 ${
            uploadStatus.status === 'success' ? 'bg-green-50' :
            uploadStatus.status === 'error' ? 'bg-red-50' :
            'bg-blue-50'
          }`}>
            <div className={`text-sm ${
              uploadStatus.status === 'success' ? 'text-green-800' :
              uploadStatus.status === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {uploadStatus.status === 'uploading' && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  {uploadStatus.message}
                </div>
              )}
              {uploadStatus.status === 'processing' && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  {uploadStatus.message}
                </div>
              )}
              {uploadStatus.status === 'success' && (
                <div>
                  <p className="font-semibold">{uploadStatus.message}</p>
                  {uploadStatus.summary && (
                    <div className="mt-2 space-y-1">
                      <p>Total rows: {uploadStatus.summary.totalRows}</p>
                      <p>Valid rows: {uploadStatus.summary.validRows}</p>
                      {uploadStatus.summary.failedRows > 0 && (
                        <p className="text-orange-600">Failed rows: {uploadStatus.summary.failedRows}</p>
                      )}
                    </div>
                  )}
                  {uploadStatus.batchId && (
                    <div className="mt-4">
                      <Link
                        href={`/admin/products/import/${uploadStatus.batchId}`}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View import details →
                      </Link>
                    </div>
                  )}
                </div>
              )}
              {uploadStatus.status === 'error' && (
                <div>
                  <p className="font-semibold">{uploadStatus.message}</p>
                  {uploadStatus.errors && uploadStatus.errors.length > 0 && (
                    <ul className="list-disc list-inside mt-2">
                      {uploadStatus.errors.map((error, index) => (
                        <li key={index} className="text-xs">{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={!fileUrl || uploadStatus.status === 'uploading' || uploadStatus.status === 'processing'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadStatus.status === 'uploading' || uploadStatus.status === 'processing'
              ? 'Processing...'
              : 'Start Import'}
          </button>
          <Link
            href="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-md"
          >
            Cancel
          </Link>
        </div>
      </form>

      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold text-gray-900 mb-2">File Format Requirements:</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <div>
            <p className="font-medium">Motos y Equipos (CSV):</p>
            <ul className="list-disc list-inside ml-2">
              <li>Cod. com → SKU</li>
              <li>Descrip. → Name</li>
              <li>Marca → Brand</li>
              <li>Almacen → Warehouse</li>
              <li>Disp. → Stock</li>
              <li>Precio. → Price</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">MRM (XLSX):</p>
            <ul className="list-disc list-inside ml-2">
              <li>Data starts at row 8</li>
              <li>CÓDIGO → SKU</li>
              <li>DESCRIPCIÓN → Name</li>
              <li>MOTO → Brand</li>
              <li>MODELO → Model</li>
              <li>PRECIO → Price</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

