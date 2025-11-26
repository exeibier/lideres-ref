import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/products/ProductCard'
import ProductFilters from '@/components/products/ProductFilters'

export const revalidate = 60

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('status', 'active')

  // Apply filters
  if (searchParams.category) {
    query = query.eq('category_id', searchParams.category as string)
  }
  if (searchParams.brand) {
    query = query.eq('brand', searchParams.brand as string)
  }
  if (searchParams.motorcycle_brand) {
    query = query.eq('motorcycle_brand', searchParams.motorcycle_brand as string)
  }
  if (searchParams.min_price) {
    query = query.gte('price', searchParams.min_price as string)
  }
  if (searchParams.max_price) {
    query = query.lte('price', searchParams.max_price as string)
  }
  if (searchParams.search) {
    query = query.or(`name.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%,part_number.ilike.%${searchParams.search}%`)
  }

  // Ordering
  const orderBy = (searchParams.order_by as string) || 'created_at'
  const orderDirection = (searchParams.order_direction as 'asc' | 'desc') || 'desc'
  query = query.order(orderBy, { ascending: orderDirection === 'asc' })

  // Pagination
  const page = parseInt(searchParams.page as string) || 1
  const pageSize = 24
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: products, error } = await query.range(from, to)
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

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
            searchParams={searchParams}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
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

