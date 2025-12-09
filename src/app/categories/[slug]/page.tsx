import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '@/components/products/ProductCard'
import Pagination from '@/components/products/Pagination'

export const revalidate = 60

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const searchParamsResolved = await searchParams
  const supabase = await createClient()

  // Get category by slug
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id, name, slug, description, parent_id')
    .eq('slug', slug)
    .single()

  if (categoryError || !category) {
    notFound()
  }

  // Get parent category if this is a subcategory
  let parentCategory = null
  if (category.parent_id) {
    const { data: parent } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('id', category.parent_id)
      .single()
    parentCategory = parent
  }

  // Get subcategories if this is a parent category
  const { data: subcategories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('parent_id', category.id)
    .order('name')

  // Build products query
  let query = supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('status', 'active')
    .eq('category_id', category.id)

  // Pagination
  const pageParam = typeof searchParamsResolved.page === 'string' ? searchParamsResolved.page : '1'
  const page = parseInt(pageParam) || 1
  const pageSize = 24
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: products, error: productsError } = await query.range(from, to)

  // Get total count
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('category_id', category.id)

  if (productsError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-red-600">Error al cargar productos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-gray-700">
              Inicio
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/categories" className="hover:text-gray-700">
              Categorías
            </Link>
          </li>
          {parentCategory && (
            <>
              <li>/</li>
              <li>
                <Link
                  href={`/categories/${parentCategory.slug}`}
                  className="hover:text-gray-700"
                >
                  {parentCategory.name}
                </Link>
              </li>
            </>
          )}
          <li>/</li>
          <li className="text-gray-900 font-medium">{category.name}</li>
        </ol>
      </nav>

      {/* Category Header */}
      <div className="mb-8">
        {parentCategory && (
          <Link
            href={`/categories/${parentCategory.slug}`}
            className="text-sm text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] mb-2 inline-block"
          >
            ← {parentCategory.name}
          </Link>
        )}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600">{category.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-2">
          {count || 0} {count === 1 ? 'producto encontrado' : 'productos encontrados'}
        </p>
      </div>

      {/* Subcategories */}
      {subcategories && subcategories.length > 0 && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Subcategorías</h2>
          <div className="flex flex-wrap gap-2">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/categories/${sub.slug}`}
                className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-700 hover:border-[var(--color-primary-400)] hover:text-[var(--color-primary-600)] transition-colors"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      {products && products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {count && count > 0 && (
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(count / pageSize)}
                totalItems={count}
                pageSize={pageSize}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No hay productos disponibles en esta categoría</p>
          <Link
            href="/products"
            className="text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] font-medium"
          >
            Ver todos los productos
          </Link>
        </div>
      )}
    </div>
  )
}

