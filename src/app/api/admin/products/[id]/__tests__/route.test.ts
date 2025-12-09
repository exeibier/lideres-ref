import { GET, PUT } from '../route'
import { createClient } from '@/lib/supabase/server'
import { createMockRequest } from '@/__tests__/helpers/request'

jest.mock('@/lib/supabase/server')

describe('GET /api/admin/products/[id]', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const request = createMockRequest('http://localhost:3000/api/admin/products/product-123', {
      method: 'GET',
    })

    const response = await GET(request, { params: { id: 'product-123' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('No autorizado')
  })

  it('should return 403 if user is not admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'customer' },
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(mockProfileQuery)

    const request = createMockRequest('http://localhost:3000/api/admin/products/product-123', {
      method: 'GET',
    })

    const response = await GET(request, { params: { id: 'product-123' } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('No autorizado')
  })

  it('should return 404 if product not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      }),
    }

    const mockProductQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return mockProfileQuery
      if (table === 'products') return mockProductQuery
      return mockProfileQuery
    })

    const request = createMockRequest('http://localhost:3000/api/admin/products/product-123', {
      method: 'GET',
    })

    const response = await GET(request, { params: { id: 'product-123' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Producto no encontrado')
  })

  it('should return product successfully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      }),
    }

    const mockProduct = {
      id: 'product-123',
      name: 'Test Product',
      slug: 'test-product',
      price: 100,
      description: 'Test description',
      status: 'active',
    }

    const mockProductQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockProduct,
        error: null,
      }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return mockProfileQuery
      if (table === 'products') return mockProductQuery
      return mockProfileQuery
    })

    const request = createMockRequest('http://localhost:3000/api/admin/products/product-123', {
      method: 'GET',
    })

    const response = await GET(request, { params: { id: 'product-123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.product).toEqual(mockProduct)
  })
})

describe('PUT /api/admin/products/[id]', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const request = createMockRequest('http://localhost:3000/api/admin/products/product-123', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Product' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request, { params: { id: 'product-123' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('No autorizado')
  })

  it('should return 403 if user is not admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'customer' },
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(mockProfileQuery)

    const request = createMockRequest('http://localhost:3000/api/admin/products/product-123', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Product' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request, { params: { id: 'product-123' } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('No autorizado')
  })

  it('should return 400 if name is empty', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(mockProfileQuery)

    const request = createMockRequest('http://localhost:3000/api/admin/products/product-123', {
      method: 'PUT',
      body: JSON.stringify({ name: '' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request, { params: { id: 'product-123' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('El nombre no puede estar vacío')
  })

  it('should return 400 if price is invalid', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(mockProfileQuery)

    const request = createMockRequest('http://localhost:3000/api/admin/products/product-123', {
      method: 'PUT',
      body: JSON.stringify({ price: -10 }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request, { params: { id: 'product-123' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('El precio debe ser mayor a 0')
  })

  it('should return 400 if slug already exists for another product', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      }),
    }

    const mockProductCheckQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'other-product' },
        error: null,
      }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return mockProfileQuery
      if (table === 'products') return mockProductCheckQuery
      return mockProfileQuery
    })

    const request = createMockRequest('http://localhost:3000/api/admin/products/product-123', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Existing Product Name' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request, { params: { id: 'product-123' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Ya existe un producto con un nombre similar')
  })

  it('should update product successfully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      }),
    }

    const mockProductCheckQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
    }

    const updatedProduct = {
      id: 'product-123',
      name: 'Updated Product',
      slug: 'updated-product',
      price: 150,
      description: 'Updated description',
      status: 'active',
      updated_at: new Date().toISOString(),
    }

    const mockProductUpdateQuery = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: updatedProduct,
        error: null,
      }),
    }

    let productCallCount = 0
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return mockProfileQuery
      if (table === 'products') {
        productCallCount++
        // First call is for checking existing slug, second is for update
        if (productCallCount === 1) {
          return mockProductCheckQuery
        }
        return mockProductUpdateQuery
      }
      return mockProfileQuery
    })

    const request = createMockRequest('http://localhost:3000/api/admin/products/product-123', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Product',
        price: 150,
        description: 'Updated description',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request, { params: { id: 'product-123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.product).toEqual(updatedProduct)
    expect(mockProductUpdateQuery.update).toHaveBeenCalled()
  })

  it('should return 404 if product not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      }),
    }

    const mockProductCheckQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
    }

    const mockProductUpdateQuery = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      }),
    }

    let productCallCount = 0
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return mockProfileQuery
      if (table === 'products') {
        productCallCount++
        // First call is for checking existing slug, second is for update
        if (productCallCount === 1) {
          return mockProductCheckQuery
        }
        return mockProductUpdateQuery
      }
      return mockProfileQuery
    })

    const request = createMockRequest('http://localhost:3000/api/admin/products/product-123', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Product' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request, { params: { id: 'product-123' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Producto no encontrado')
  })
})

