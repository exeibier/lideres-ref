'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error'
  message?: string
  errors?: string[]
  productsCreated?: number
}

export default function BulkUploadForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle' })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          selectedFile.type === 'application/vnd.ms-excel' ||
          selectedFile.name.endsWith('.xlsx') ||
          selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile)
        setUploadStatus({ status: 'idle' })
      } else {
        alert('Por favor, selecciona un archivo Excel (.xlsx o .xls)')
        e.target.value = ''
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploadStatus({ status: 'uploading', message: 'Subiendo archivo...' })

    try {
      // Upload file to API
      const formData = new FormData()
      formData.append('file', file)

      setUploadStatus({ status: 'processing', message: 'Procesando archivo con n8n...' })

      const response = await fetch('/api/admin/products/bulk-upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setUploadStatus({
          status: 'error',
          message: data.error || 'Error al procesar el archivo',
          errors: data.errors,
        })
        return
      }

      setUploadStatus({
        status: 'success',
        message: data.message || 'Productos cargados exitosamente',
        productsCreated: data.productsCreated,
        errors: data.errors,
      })

      // Reset form after success
      setFile(null)
      const fileInput = document.getElementById('excel-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      // Refresh after a delay to show updated product count
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error) {
      setUploadStatus({
        status: 'error',
        message: 'Error al procesar el archivo. Por favor, intenta de nuevo.',
      })
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="excel-file" className="block text-sm font-medium text-gray-700 mb-2">
            Archivo Excel
          </label>
          <input
            id="excel-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            required
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="mt-2 text-sm text-gray-500">
            Formatos soportados: .xlsx, .xls
          </p>
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
                  {uploadStatus.productsCreated !== undefined && (
                    <p className="mt-1">Productos creados: {uploadStatus.productsCreated}</p>
                  )}
                  {uploadStatus.errors && uploadStatus.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Errores encontrados:</p>
                      <ul className="list-disc list-inside mt-1">
                        {uploadStatus.errors.map((error, index) => (
                          <li key={index} className="text-xs">{error}</li>
                        ))}
                      </ul>
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
            disabled={!file || uploadStatus.status === 'uploading' || uploadStatus.status === 'processing'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadStatus.status === 'uploading' || uploadStatus.status === 'processing'
              ? 'Procesando...'
              : 'Subir y procesar'}
          </button>
          <Link
            href="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-md"
          >
            Cancelar
          </Link>
        </div>
      </form>

      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold text-gray-900 mb-2">Formato esperado del Excel:</h3>
        <p className="text-sm text-gray-600 mb-2">
          El archivo Excel debe contener las siguientes columnas:
        </p>
        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
          <li><strong>name</strong> - Nombre del producto (requerido)</li>
          <li><strong>description</strong> - Descripción del producto</li>
          <li><strong>sku</strong> - SKU del producto</li>
          <li><strong>part_number</strong> - Número de parte</li>
          <li><strong>price</strong> - Precio (requerido)</li>
          <li><strong>compare_at_price</strong> - Precio de comparación</li>
          <li><strong>brand</strong> - Marca del producto</li>
          <li><strong>motorcycle_brand</strong> - Marca de motocicleta</li>
          <li><strong>motorcycle_model</strong> - Modelo de motocicleta</li>
          <li><strong>category</strong> - Categoría (nombre o slug)</li>
          <li><strong>images</strong> - URLs de imágenes separadas por comas</li>
        </ul>
        <p className="text-sm text-gray-500 mt-4">
          Nota: El archivo será procesado por n8n para normalizar los datos antes de guardarlos en la base de datos.
        </p>
      </div>
    </div>
  )
}

