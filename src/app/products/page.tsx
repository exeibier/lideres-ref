import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/products/ProductCard'
import ProductFilters from '@/components/products/ProductFilters'
import Pagination from '@/components/products/Pagination'

export const revalidate = 60

// Helper function to safely get string value from searchParams
function getStringParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value) && value.length > 0) {
    return value[0]
  }
  return undefined
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  
  let query = supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('status', 'active')

  // Apply filters
  const category = getStringParam(params.category)
  if (category) {
    query = query.eq('category_id', category)
  }
  
  const brand = getStringParam(params.brand)
  if (brand) {
    query = query.eq('brand', brand)
  }
  
  const motorcycleBrand = getStringParam(params.motorcycle_brand)
  if (motorcycleBrand) {
    query = query.eq('motorcycle_brand', motorcycleBrand)
  }
  
  const minPrice = getStringParam(params.min_price)
  if (minPrice) {
    query = query.gte('price', minPrice)
  }
  
  const maxPrice = getStringParam(params.max_price)
  if (maxPrice) {
    query = query.lte('price', maxPrice)
  }
  
  const search = getStringParam(params.search)
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,part_number.ilike.%${search}%`)
  }

  // Ordering
  const orderBy = getStringParam(params.order_by) || 'created_at'
  const orderDirection = (getStringParam(params.order_direction) as 'asc' | 'desc') || 'desc'
  query = query.order(orderBy, { ascending: orderDirection === 'asc' })

  // Pagination
  const pageParam = getStringParam(params.page)
  const page = pageParam ? parseInt(pageParam) : 1
  const pageSize = 24
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: products, error } = await query.range(from, to)
  
  // Build count query with same filters
  let countQuery = supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Apply same filters to count query
  if (category) {
    countQuery = countQuery.eq('category_id', category)
  }
  if (brand) {
    countQuery = countQuery.eq('brand', brand)
  }
  if (motorcycleBrand) {
    countQuery = countQuery.eq('motorcycle_brand', motorcycleBrand)
  }
  if (minPrice) {
    countQuery = countQuery.gte('price', minPrice)
  }
  if (maxPrice) {
    countQuery = countQuery.lte('price', maxPrice)
  }
  if (search) {
    countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%,part_number.ilike.%${search}%`)
  }

  const { count } = await countQuery

  // Get filter options
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')

  const { data: brands } = await supabase
    .from('products')
    .select('brand')
    .eq('status', 'active')
    .not('brand', 'is', null)

  const uniqueBrands = Array.from(new Set(brands?.map(b => b.brand).filter(Boolean) || []))

  if (error) {
    return <div className="text-center py-12">Error al cargar productos</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <ProductFilters
            categories={categories || []}
            brands={uniqueBrands}
            searchParams={params}
          />
        </aside>
        <main className="flex-1">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Productos</h1>
            <p className="text-gray-600">
              {count || 0} productos encontrados
            </p>
          </div>
          {products && products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {count && count > 0 && (
                <Pagination
                  currentPage={page}
                  totalPages={Math.ceil(count / pageSize)}
                  totalItems={count}
                  pageSize={pageSize}
                />
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron productos</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

