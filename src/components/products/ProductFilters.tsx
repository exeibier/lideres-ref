'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface ProductFiltersProps {
  categories: Array<{ id: string; name: string; slug: string }>
  brands: string[]
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function ProductFilters({ categories, brands, searchParams }: ProductFiltersProps) {
  const router = useRouter()
  const params = useSearchParams()
  const [search, setSearch] = useState(searchParams.search as string || '')

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(params.toString())
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    newParams.delete('page') // Reset to first page when filtering
    router.push(`/products?${newParams.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter('search', search || null)
  }

  const clearFilters = () => {
    router.push('/products')
    setSearch('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <form onSubmit={handleSearch} className="mb-4">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </form>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Limpiar filtros
        </button>
      </div>

      <div>
        <h3 className="font-medium mb-2">Categorías</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center">
              <input
                type="checkbox"
                checked={searchParams.category === category.id}
                onChange={(e) => updateFilter('category', e.target.checked ? category.id : null)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      {brands.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Marcas</h3>
          <div className="space-y-2">
            {brands.slice(0, 10).map((brand) => (
              <label key={brand} className="flex items-center">
                <input
                  type="checkbox"
                  checked={searchParams.brand === brand}
                  onChange={(e) => updateFilter('brand', e.target.checked ? brand : null)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{brand}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-medium mb-2">Precio</h3>
        <div className="space-y-2">
          <input
            type="number"
            placeholder="Precio mínimo"
            value={searchParams.min_price || ''}
            onChange={(e) => updateFilter('min_price', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <input
            type="number"
            placeholder="Precio máximo"
            value={searchParams.max_price || ''}
            onChange={(e) => updateFilter('max_price', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2">Ordenar por</h3>
        <select
          value={`${searchParams.order_by || 'created_at'}-${searchParams.order_direction || 'desc'}`}
          onChange={(e) => {
            const [orderBy, orderDirection] = e.target.value.split('-')
            updateFilter('order_by', orderBy)
            updateFilter('order_direction', orderDirection)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="created_at-desc">Más recientes</option>
          <option value="created_at-asc">Más antiguos</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
          <option value="name-asc">Nombre: A-Z</option>
          <option value="name-desc">Nombre: Z-A</option>
        </select>
      </div>
    </div>
  )
}

