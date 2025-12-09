import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { createMockRequest } from '@/__tests__/helpers/request'

jest.mock('@/lib/supabase/server')

describe('POST /api/admin/products/bulk-upload', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
    process.env.N8N_WEBHOOK_BULK_UPLOAD = 'https://n8n.example.com/webhook'
  })

  afterEach(() => {
    delete process.env.N8N_WEBHOOK_BULK_UPLOAD
  })

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const formData = new FormData()
    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    formData.append('file', file)

    const request = createMockRequest('http://localhost:3000/api/admin/products/bulk-upload', {
      method: 'POST',
      body: formData,
      headers: {},
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

    const formData = new FormData()
    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    formData.append('file', file)

    const request = createMockRequest('http://localhost:3000/api/admin/products/bulk-upload', {
      method: 'POST',
      body: formData,
      headers: {},
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('No autorizado')
  })

  it('should return 400 if no file is provided', async () => {
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

    const formData = new FormData()
    const request = new NextRequest('http://localhost:3000/api/admin/products/bulk-upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('No se proporcionó ningún archivo')
  })

  it('should return 400 if file type is invalid', async () => {
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

    const formData = new FormData()
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    formData.append('file', file)

    const request = new NextRequest('http://localhost:3000/api/admin/products/bulk-upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Tipo de archivo no válido')
  })

  it('should return 503 if n8n webhook is not configured', async () => {
    delete process.env.N8N_WEBHOOK_BULK_UPLOAD

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

    const formData = new FormData()
    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    formData.append('file', file)

    const request = createMockRequest('http://localhost:3000/api/admin/products/bulk-upload', {
      method: 'POST',
      body: formData,
      headers: {},
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toContain('n8n webhook no configurado')
  })

  it('should process file successfully when n8n returns valid data', async () => {
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

    const mockProductsQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: [{ id: 'prod-1' }, { id: 'prod-2' }],
        error: null,
      }),
    }

    const mockCategoriesQuery = {
      select: jest.fn().mockResolvedValue({
        data: [
          { id: 'cat-1', name: 'Category 1', slug: 'category-1' },
        ],
        error: null,
      }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return mockProfileQuery
      if (table === 'products') return mockProductsQuery
      if (table === 'categories') return mockCategoriesQuery
      return mockProfileQuery
    })

    // Mock n8n response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [
          {
            name: 'Test Product',
            price: 100,
            sku: 'SKU001',
            description: 'Test description',
          },
          {
            name: 'Test Product 2',
            price: 200,
            sku: 'SKU002',
          },
        ],
        errors: [],
      }),
    })

    const formData = new FormData()
    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    formData.append('file', file)

    const request = createMockRequest('http://localhost:3000/api/admin/products/bulk-upload', {
      method: 'POST',
      body: formData,
      headers: {},
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.productsCreated).toBe(2)
    expect(data.message).toContain('Procesamiento completado')
  })
})

