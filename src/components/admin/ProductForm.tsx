'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadButton } from '@/lib/uploadthing'
import type { Database } from '@/lib/types/database'

type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']

interface ProductFormProps {
  product?: Product | null
  categories: Category[]
  mode: 'create' | 'edit'
}

export default function ProductForm({ product, categories, mode }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>(product?.images || [])
  const [compatibility, setCompatibility] = useState<string>(
    product?.compatibility?.join(', ') || ''
  )

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    sku: product?.sku || '',
    part_number: product?.part_number || '',
    price: product?.price?.toString() || '',
    compare_at_price: product?.compare_at_price?.toString() || '',
    category_id: product?.category_id || '',
    brand: product?.brand || '',
    motorcycle_brand: product?.motorcycle_brand || '',
    motorcycle_model: product?.motorcycle_model || '',
    status: product?.status || 'active',
    featured: product?.featured || false,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleImageUpload = (res: Array<{ name: string; url: string; size: number; key: string }>) => {
    if (res && res.length > 0) {
      const newImages = res.map((file) => file.url)
      setImages((prev) => [...prev, ...newImages])
    }
  }

  const handleImageRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Parse compatibility array
      const compatibilityArray = compatibility
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price
          ? parseFloat(formData.compare_at_price)
          : null,
        category_id: formData.category_id || null,
        images: images.length > 0 ? images : null,
        compatibility: compatibilityArray.length > 0 ? compatibilityArray : null,
      }

      const url = mode === 'create' 
        ? '/api/admin/products'
        : `/api/admin/products/${product?.id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar el producto')
      }

      // Redirect to products list
      router.push('/admin/products')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Error al guardar el producto')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre del producto <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="block w-full rounded-md border-gray-300 focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-600)] sm:text-sm text-gray-900 bg-white py-3 px-4 outline-none transition-all"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="block w-full rounded-md border-gray-300 focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-600)] sm:text-sm text-gray-900 bg-white py-3 px-4 outline-none transition-all resize-none"
          />
        </div>

        {/* SKU */}
        <div>
          <label htmlFor="sku" className="block text-sm font-semibold text-gray-700 mb-2">
            SKU
          </label>
          <input
            type="text"
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-600)] sm:text-sm text-gray-900 bg-white py-3 px-4 outline-none transition-all"
          />
        </div>

        {/* Part Number */}
        <div>
          <label htmlFor="part_number" className="block text-sm font-semibold text-gray-700 mb-2">
            Número de parte
          </label>
          <input
            type="text"
            id="part_number"
            name="part_number"
            value={formData.part_number}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-600)] sm:text-sm text-gray-900 bg-white py-3 px-4 outline-none transition-all"
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
            Precio <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
            className="block w-full rounded-md border-gray-300 focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-600)] sm:text-sm text-gray-900 bg-white py-3 px-4 outline-none transition-all"
          />
        </div>

        {/* Compare at Price */}
        <div>
          <label htmlFor="compare_at_price" className="block text-sm font-semibold text-gray-700 mb-2">
            Precio de comparación
          </label>
          <input
            type="number"
            id="compare_at_price"
            name="compare_at_price"
            value={formData.compare_at_price}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className="block w-full rounded-md border-gray-300 focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-600)] sm:text-sm text-gray-900 bg-white py-3 px-4 outline-none transition-all"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category_id" className="block text-sm font-semibold text-gray-700 mb-2">
            Categoría
          </label>
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-600)] sm:text-sm text-gray-900 bg-white py-3 px-4 outline-none transition-all"
          >
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Brand */}
        <div>
          <label htmlFor="brand" className="block text-sm font-semibold text-gray-700 mb-2">
            Marca
          </label>
          <input
            type="text"
            id="brand"
            name="brand"
            value={formData.brand}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-600)] sm:text-sm text-gray-900 bg-white py-3 px-4 outline-none transition-all"
          />
        </div>

        {/* Motorcycle Brand */}
        <div>
          <label htmlFor="motorcycle_brand" className="block text-sm font-semibold text-gray-700 mb-2">
            Marca de motocicleta
          </label>
          <input
            type="text"
            id="motorcycle_brand"
            name="motorcycle_brand"
            value={formData.motorcycle_brand}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-600)] sm:text-sm text-gray-900 bg-white py-3 px-4 outline-none transition-all"
          />
        </div>

        {/* Motorcycle Model */}
        <div>
          <label htmlFor="motorcycle_model" className="block text-sm font-semibold text-gray-700 mb-2">
            Modelo de motocicleta
          </label>
          <input
            type="text"
            id="motorcycle_model"
            name="motorcycle_model"
            value={formData.motorcycle_model}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-600)] sm:text-sm text-gray-900 bg-white py-3 px-4 outline-none transition-all"
          />
        </div>

        {/* Compatibility */}
        <div className="md:col-span-2">
          <label htmlFor="compatibility" className="block text-sm font-semibold text-gray-700 mb-2">
            Compatibilidad (separado por comas)
          </label>
          <input
            type="text"
            id="compatibility"
            value={compatibility}
            onChange={(e) => setCompatibility(e.target.value)}
            placeholder="Ej: Honda CBR 600, Yamaha R6, Kawasaki Ninja"
            className="block w-full rounded-md border-gray-300 focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-600)] sm:text-sm text-gray-900 bg-white py-3 px-4 outline-none transition-all"
          />
          <p className="mt-2 text-sm text-gray-600">
            Ingresa los modelos compatibles separados por comas
          </p>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
            Estado
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-600)] sm:text-sm text-gray-900 bg-white py-3 px-4 outline-none transition-all"
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="draft">Borrador</option>
          </select>
        </div>

        {/* Featured */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="featured"
            name="featured"
            checked={formData.featured}
            onChange={handleInputChange}
            className="h-5 w-5 text-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-600)] border-gray-300 rounded-md cursor-pointer"
          />
          <label htmlFor="featured" className="ml-3 block text-sm font-semibold text-gray-700 cursor-pointer">
            Producto destacado
          </label>
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Imágenes del producto
        </label>
        <div className="mb-4">
          <UploadButton
            endpoint="productImage"
            onClientUploadComplete={handleImageUpload}
            onUploadError={(error) => {
              setError(`Error al subir imagen: ${error.message}`)
            }}
          />
        </div>
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleImageRemove(index)}
                  className="absolute top-2 right-2 bg-[var(--color-error)] text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit buttons */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-bold py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
        >
          {loading ? 'Guardando...' : mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

