import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const revalidate = 60

export default async function CategoriesPage() {
  const supabase = await createClient()
  
  // Get all categories with their parent relationships
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, parent_id')
    .order('name')

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-red-600">Error al cargar categorías</p>
        </div>
      </div>
    )
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Categorías</h1>
          <p className="text-gray-600">No hay categorías disponibles</p>
        </div>
      </div>
    )
  }

  // Separate parent categories and subcategories
  const parentCategories = categories.filter(cat => !cat.parent_id)
  const subcategories = categories.filter(cat => cat.parent_id)

  // Get product counts for each category
  const categoryIds = categories.map(cat => cat.id)
  const { data: productCounts } = await supabase
    .from('products')
    .select('category_id')
    .eq('status', 'active')
    .in('category_id', categoryIds)

  const countsMap = new Map<string, number>()
  productCounts?.forEach(p => {
    if (p.category_id) {
      countsMap.set(p.category_id, (countsMap.get(p.category_id) || 0) + 1)
    }
  })

  // Group subcategories by parent
  const subcategoriesByParent = new Map<string, typeof subcategories>()
  subcategories.forEach(sub => {
    if (sub.parent_id) {
      const parentSubs = subcategoriesByParent.get(sub.parent_id) || []
      parentSubs.push(sub)
      subcategoriesByParent.set(sub.parent_id, parentSubs)
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Categorías</h1>
        <p className="text-gray-600">
          Explora nuestras categorías de repuestos y accesorios para motocicletas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {parentCategories.map((parent) => {
          const children = subcategoriesByParent.get(parent.id) || []
          const parentCount = countsMap.get(parent.id) || 0
          const childrenCount = children.reduce((sum, child) => {
            return sum + (countsMap.get(child.id) || 0)
          }, 0)
          const totalCount = parentCount + childrenCount

          return (
            <div
              key={parent.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Link
                      href={`/products?category=${parent.id}`}
                      className="text-xl font-semibold text-gray-900 hover:text-[var(--color-primary-600)] transition-colors"
                    >
                      {parent.name}
                    </Link>
                    {parent.description && (
                      <p className="text-sm text-gray-600 mt-1">{parent.description}</p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {totalCount} {totalCount === 1 ? 'producto' : 'productos'}
                  </span>
                </div>

                {children.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Subcategorías:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {children.map((child) => {
                        const childCount = countsMap.get(child.id) || 0
                        return (
                          <Link
                            key={child.id}
                            href={`/products?category=${child.id}`}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-[var(--color-primary-50)] transition-colors group"
                          >
                            <span className="text-sm text-gray-700 group-hover:text-[var(--color-primary-600)]">
                              {child.name}
                            </span>
                            {childCount > 0 && (
                              <span className="text-xs text-gray-500 ml-2">
                                {childCount}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Link
                    href={`/products?category=${parent.id}`}
                    className="inline-flex items-center text-sm font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] transition-colors"
                  >
                    Ver todos los productos
                    <svg
                      className="ml-1 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {parentCategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay categorías principales disponibles</p>
        </div>
      )}
    </div>
  )
}

