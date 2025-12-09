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
    <div className="space-y-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Filtros</h2>
        <form onSubmit={handleSearch} className="mb-4">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[var(--color-primary-600)] focus:border-[var(--color-primary-600)] outline-none transition-all"
          />
        </form>
        <button
          onClick={clearFilters}
          className="text-sm font-semibold text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] transition-colors"
        >
          Limpiar filtros
        </button>
      </div>

      <div>
        <h3 className="font-bold text-gray-900 mb-3">Categorías</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center cursor-pointer py-1">
              <input
                type="checkbox"
                checked={searchParams.category === category.id}
                onChange={(e) => updateFilter('category', e.target.checked ? category.id : null)}
                className="rounded-md border-gray-300 w-5 h-5 text-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-600)] focus:ring-offset-0 cursor-pointer"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      {brands.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Marcas</h3>
          <div className="space-y-2">
            {brands.slice(0, 10).map((brand) => (
              <label key={brand} className="flex items-center cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={searchParams.brand === brand}
                  onChange={(e) => updateFilter('brand', e.target.checked ? brand : null)}
                  className="rounded-md border-gray-300 w-5 h-5 text-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-600)] focus:ring-offset-0 cursor-pointer"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">{brand}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-bold text-gray-900 mb-3">Precio</h3>
        <div className="space-y-2">
          <input
            type="number"
            placeholder="Precio mínimo"
            value={searchParams.min_price || ''}
            onChange={(e) => updateFilter('min_price', e.target.value || null)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[var(--color-primary-600)] focus:border-[var(--color-primary-600)] outline-none transition-all"
          />
          <input
            type="number"
            placeholder="Precio máximo"
            value={searchParams.max_price || ''}
            onChange={(e) => updateFilter('max_price', e.target.value || null)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[var(--color-primary-600)] focus:border-[var(--color-primary-600)] outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <h3 className="font-bold text-gray-900 mb-3">Ordenar por</h3>
        <select
          value={`${searchParams.order_by || 'created_at'}-${searchParams.order_direction || 'desc'}`}
          onChange={(e) => {
            const [orderBy, orderDirection] = e.target.value.split('-')
            updateFilter('order_by', orderBy)
            updateFilter('order_direction', orderDirection)
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[var(--color-primary-600)] focus:border-[var(--color-primary-600)] outline-none transition-all text-gray-900 font-medium"
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

