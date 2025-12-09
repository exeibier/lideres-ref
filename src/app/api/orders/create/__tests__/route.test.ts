import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { createMockRequest } from '@/__tests__/helpers/request'

// Mock Supabase
jest.mock('@/lib/supabase/server')

describe('POST /api/orders/create', () => {
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

    const request = createMockRequest('http://localhost:3000/api/orders/create', {
      method: 'POST',
      body: JSON.stringify({
        shippingAddressId: 'addr-123',
        shippingAddress: {},
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('No autorizado')
  })

  it('should return 400 if cart is empty', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockCartQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(mockCartQuery)

    const request = createMockRequest('http://localhost:3000/api/orders/create', {
      method: 'POST',
      body: JSON.stringify({
        shippingAddressId: 'addr-123',
        shippingAddress: {},
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('El carrito está vacío')
  })

  it('should create order successfully with valid cart', async () => {
    const mockUser = { id: 'user-123' }
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const mockCartItems = [
      {
        id: 'cart-1',
        quantity: 2,
        products: {
          id: 'prod-1',
          name: 'Test Product',
          price: 100,
          sku: 'SKU001',
        },
      },
    ]

    const mockOrder = {
      id: 'order-123',
      order_number: 'ORD-1234567890-ABC',
      total: 200,
      status: 'pending',
    }

    const mockCartQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: mockCartItems,
        error: null,
      }),
    }

    const mockOrderQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockOrder,
        error: null,
      }),
    }

    const mockOrderItemsQuery = {
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    const mockDeleteQuery = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    const mockUpdateQuery = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'cart') return mockCartQuery
      if (table === 'orders') return mockOrderQuery
      if (table === 'order_items') return mockOrderItemsQuery
      return mockDeleteQuery
    })

    // Mock fetch for n8n webhook
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    const request = new NextRequest('http://localhost:3000/api/orders/create', {
      method: 'POST',
      body: JSON.stringify({
        shippingAddressId: 'addr-123',
        shippingAddress: {
          street: '123 Main St',
          city: 'Test City',
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.orderId).toBe('order-123')
    expect(data.orderNumber).toBe('ORD-1234567890-ABC')
  })

  it('should calculate totals correctly', async () => {
    const mockUser = { id: 'user-123' }
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const mockCartItems = [
      {
        id: 'cart-1',
        quantity: 2,
        products: { id: 'prod-1', name: 'Product 1', price: 100, sku: 'SKU1' },
      },
      {
        id: 'cart-2',
        quantity: 3,
        products: { id: 'prod-2', name: 'Product 2', price: 50, sku: 'SKU2' },
      },
    ]

    const mockOrder = {
      id: 'order-123',
      order_number: 'ORD-123',
      total: 350, // 2*100 + 3*50
      status: 'pending',
    }

    const mockCartQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: mockCartItems,
        error: null,
      }),
    }

    const mockOrderQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockOrder,
        error: null,
      }),
    }

    const mockOrderItemsQuery = {
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    const mockDeleteQuery = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'cart') return mockCartQuery
      if (table === 'orders') return mockOrderQuery
      if (table === 'order_items') return mockOrderItemsQuery
      return mockDeleteQuery
    })

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    const request = createMockRequest('http://localhost:3000/api/orders/create', {
      method: 'POST',
      body: JSON.stringify({
        shippingAddressId: 'addr-123',
        shippingAddress: {},
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    // Verify order was created with correct total
    expect(mockOrderQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 350,
        total: 350,
      })
    )
  })
})

