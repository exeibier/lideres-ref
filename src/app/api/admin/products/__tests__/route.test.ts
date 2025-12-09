import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { createMockRequest } from '@/__tests__/helpers/request'

jest.mock('@/lib/supabase/server')

describe('POST /api/admin/products', () => {
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

    const request = createMockRequest('http://localhost:3000/api/admin/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Product',
        price: 100,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
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

    const request = createMockRequest('http://localhost:3000/api/admin/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Product',
        price: 100,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('No autorizado')
  })

  it('should return 400 if name is missing', async () => {
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

    const request = createMockRequest('http://localhost:3000/api/admin/products', {
      method: 'POST',
      body: JSON.stringify({
        price: 100,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Nombre y precio son requeridos')
  })

  it('should return 400 if price is missing', async () => {
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

    const request = createMockRequest('http://localhost:3000/api/admin/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Product',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Nombre y precio son requeridos')
  })

  it('should return 400 if slug already exists', async () => {
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
        data: { id: 'existing-product' },
        error: null,
      }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return mockProfileQuery
      if (table === 'products') return mockProductQuery
      return mockProfileQuery
    })

    const request = createMockRequest('http://localhost:3000/api/admin/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Product',
        price: 100,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Ya existe un producto con un nombre similar')
  })

  it('should create product successfully', async () => {
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
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Not found error
      }),
    }

    const mockProductInsertQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'product-123',
          name: 'Test Product',
          slug: 'test-product',
          price: 100,
          status: 'active',
          created_at: new Date().toISOString(),
        },
        error: null,
      }),
    }

    let productCallCount = 0
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return mockProfileQuery
      if (table === 'products') {
        productCallCount++
        // First call is for checking existing slug, second is for insert
        if (productCallCount === 1) {
          return mockProductCheckQuery
        }
        return mockProductInsertQuery
      }
      return mockProfileQuery
    })

    const request = createMockRequest('http://localhost:3000/api/admin/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Product',
        price: 100,
        description: 'Test description',
        sku: 'SKU001',
        category_id: 'cat-123',
        images: ['https://example.com/image.jpg'],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.product).toBeDefined()
    expect(data.product.name).toBe('Test Product')
    expect(data.product.price).toBe(100)
    expect(mockProductInsertQuery.insert).toHaveBeenCalled()
  })

  it('should handle database errors', async () => {
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
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
    }

    const mockProductInsertQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return mockProfileQuery
      if (table === 'products') {
        if (mockProductCheckQuery.select.mock.calls.length === 0) {
          return mockProductCheckQuery
        }
        return mockProductInsertQuery
      }
      return mockProfileQuery
    })

    const request = createMockRequest('http://localhost:3000/api/admin/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Product',
        price: 100,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Error al crear el producto')
  })
})

