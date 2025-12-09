import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductForm from '../ProductForm'
import type { Database } from '@/lib/types/database'

// Mock next/navigation
const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock UploadThing
jest.mock('@/lib/uploadthing', () => ({
  UploadButton: ({ onClientUploadComplete, onUploadError }: any) => (
    <button
      data-testid="upload-button"
      onClick={() => {
        if (onClientUploadComplete) {
          onClientUploadComplete([
            {
              name: 'test-image.jpg',
              url: 'https://example.com/test-image.jpg',
              size: 1000,
              key: 'test-key',
            },
          ])
        }
      }}
    >
      Upload Image
    </button>
  ),
}))

// Mock fetch
global.fetch = jest.fn()

type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Category 1',
    slug: 'category-1',
    description: null,
    parent_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-2',
    name: 'Category 2',
    slug: 'category-2',
    description: null,
    parent_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockProduct: Product = {
  id: 'product-123',
  name: 'Test Product',
  slug: 'test-product',
  description: 'Test description',
  sku: 'SKU001',
  part_number: 'PART001',
  price: 100,
  compare_at_price: 120,
  category_id: 'cat-1',
  brand: 'Test Brand',
  motorcycle_brand: 'Honda',
  motorcycle_model: 'CBR600',
  compatibility: ['Honda CBR 600', 'Yamaha R6'],
  images: ['https://example.com/image1.jpg'],
  status: 'active',
  featured: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('ProductForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    mockPush.mockClear()
    mockRefresh.mockClear()
  })

  describe('Create Mode', () => {
    it('should render form with empty fields', () => {
      render(<ProductForm product={null} categories={mockCategories} mode="create" />)

      expect(screen.getByLabelText(/nombre del producto/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/nombre del producto/i)).toHaveValue('')
      expect(screen.getByLabelText(/precio/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /crear producto/i })).toBeInTheDocument()
    })

    it('should show required field indicators', () => {
      render(<ProductForm product={null} categories={mockCategories} mode="create" />)

      const nameField = screen.getByLabelText(/nombre del producto/i)
      const priceField = screen.getByLabelText(/precio/i)

      expect(nameField).toBeRequired()
      expect(priceField).toBeRequired()
    })

    it('should submit form and create product', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.Mock

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          product: {
            id: 'new-product',
            name: 'New Product',
            price: 100,
          },
        }),
      })

      render(<ProductForm product={null} categories={mockCategories} mode="create" />)

      // Fill form
      await user.type(screen.getByLabelText(/nombre del producto/i), 'New Product')
      await user.type(screen.getByLabelText(/precio/i), '100')
      await user.type(screen.getByLabelText(/descripción/i), 'New description')

      // Submit
      await user.click(screen.getByRole('button', { name: /crear producto/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/products',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        )
      })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.name).toBe('New Product')
      expect(callBody.price).toBe(100)
      expect(callBody.description).toBe('New description')
    })

    it('should show error message on API failure', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.Mock

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Error al crear el producto',
        }),
      })

      render(<ProductForm product={null} categories={mockCategories} mode="create" />)

      await user.type(screen.getByLabelText(/nombre del producto/i), 'New Product')
      await user.type(screen.getByLabelText(/precio/i), '100')
      await user.click(screen.getByRole('button', { name: /crear producto/i }))

      await waitFor(() => {
        expect(screen.getByText(/error al crear el producto/i)).toBeInTheDocument()
      })
    })

    it('should handle image upload', async () => {
      const user = userEvent.setup()
      render(<ProductForm product={null} categories={mockCategories} mode="create" />)

      const uploadButton = screen.getByTestId('upload-button')
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByAltText(/product image 1/i)).toBeInTheDocument()
      })
    })

    it('should remove image when remove button is clicked', async () => {
      const user = userEvent.setup()
      render(<ProductForm product={null} categories={mockCategories} mode="create" />)

      // Upload image
      const uploadButton = screen.getByTestId('upload-button')
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByAltText(/product image 1/i)).toBeInTheDocument()
      })

      // Remove image
      const removeButtons = screen.getAllByRole('button')
      const removeButton = removeButtons.find((btn) =>
        btn.querySelector('svg')
      )
      if (removeButton) {
        await user.click(removeButton)
      }

      await waitFor(() => {
        expect(screen.queryByAltText(/product image 1/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Edit Mode', () => {
    it('should render form with product data', () => {
      render(<ProductForm product={mockProduct} categories={mockCategories} mode="edit" />)

      expect(screen.getByLabelText(/nombre del producto/i)).toHaveValue('Test Product')
      expect(screen.getByLabelText(/precio/i)).toHaveValue('100')
      expect(screen.getByLabelText(/descripción/i)).toHaveValue('Test description')
      expect(screen.getByLabelText(/sku/i)).toHaveValue('SKU001')
      expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument()
    })

    it('should display existing images', () => {
      render(<ProductForm product={mockProduct} categories={mockCategories} mode="edit" />)

      expect(screen.getByAltText(/product image 1/i)).toBeInTheDocument()
    })

    it('should display compatibility as comma-separated text', () => {
      render(<ProductForm product={mockProduct} categories={mockCategories} mode="edit" />)

      const compatibilityField = screen.getByLabelText(/compatibilidad/i)
      expect(compatibilityField).toHaveValue('Honda CBR 600, Yamaha R6')
    })

    it('should update product on submit', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.Mock

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          product: {
            ...mockProduct,
            name: 'Updated Product',
          },
        }),
      })

      render(<ProductForm product={mockProduct} categories={mockCategories} mode="edit" />)

      // Update name
      const nameField = screen.getByLabelText(/nombre del producto/i)
      await user.clear(nameField)
      await user.type(nameField, 'Updated Product')

      // Submit
      await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/admin/products/${mockProduct.id}`,
          expect.objectContaining({
            method: 'PUT',
          })
        )
      })
    })

    it('should handle category selection', async () => {
      const user = userEvent.setup()
      render(<ProductForm product={mockProduct} categories={mockCategories} mode="edit" />)

      const categorySelect = screen.getByLabelText(/categoría/i)
      expect(categorySelect).toHaveValue('cat-1')

      await user.selectOptions(categorySelect, 'cat-2')
      expect(categorySelect).toHaveValue('cat-2')
    })

    it('should handle status selection', async () => {
      const user = userEvent.setup()
      render(<ProductForm product={mockProduct} categories={mockCategories} mode="edit" />)

      const statusSelect = screen.getByLabelText(/estado/i)
      expect(statusSelect).toHaveValue('active')

      await user.selectOptions(statusSelect, 'inactive')
      expect(statusSelect).toHaveValue('inactive')
    })

    it('should handle featured checkbox', async () => {
      const user = userEvent.setup()
      render(<ProductForm product={mockProduct} categories={mockCategories} mode="edit" />)

      const featuredCheckbox = screen.getByLabelText(/producto destacado/i)
      expect(featuredCheckbox).toBeChecked()

      await user.click(featuredCheckbox)
      expect(featuredCheckbox).not.toBeChecked()
    })

    it('should parse compatibility array correctly', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.Mock

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      })

      render(<ProductForm product={mockProduct} categories={mockCategories} mode="edit" />)

      const compatibilityField = screen.getByLabelText(/compatibilidad/i)
      await user.clear(compatibilityField)
      await user.type(compatibilityField, 'Model 1, Model 2, Model 3')

      await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

      await waitFor(() => {
        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
        expect(callBody.compatibility).toEqual(['Model 1', 'Model 2', 'Model 3'])
      })
    })
  })

  describe('Common Behavior', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.Mock

      // Create a delayed promise
      let resolveFetch: (value: any) => void
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve
      })

      mockFetch.mockReturnValueOnce(fetchPromise)

      render(<ProductForm product={null} categories={mockCategories} mode="create" />)

      await user.type(screen.getByLabelText(/nombre del producto/i), 'New Product')
      await user.type(screen.getByLabelText(/precio/i), '100')

      const submitButton = screen.getByRole('button', { name: /crear producto/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/guardando/i)).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
      })

      // Resolve the fetch
      resolveFetch!({
        ok: true,
        json: async () => ({ product: { id: 'new-product' } }),
      })
    })

    it('should cancel and navigate back', async () => {
      const user = userEvent.setup()
      render(<ProductForm product={null} categories={mockCategories} mode="create" />)

      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      await user.click(cancelButton)

      expect(mockPush).toHaveBeenCalledWith('/admin/products')
    })

    it('should handle empty compatibility field', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.Mock

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: { id: 'new-product' } }),
      })

      render(<ProductForm product={null} categories={mockCategories} mode="create" />)

      await user.type(screen.getByLabelText(/nombre del producto/i), 'New Product')
      await user.type(screen.getByLabelText(/precio/i), '100')

      const compatibilityField = screen.getByLabelText(/compatibilidad/i)
      expect(compatibilityField).toHaveValue('')

      await user.click(screen.getByRole('button', { name: /crear producto/i }))

      await waitFor(() => {
        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
        expect(callBody.compatibility).toBeNull()
      })
    })

    it('should handle empty images array', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.Mock

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: { id: 'new-product' } }),
      })

      render(<ProductForm product={null} categories={mockCategories} mode="create" />)

      await user.type(screen.getByLabelText(/nombre del producto/i), 'New Product')
      await user.type(screen.getByLabelText(/precio/i), '100')

      await user.click(screen.getByRole('button', { name: /crear producto/i }))

      await waitFor(() => {
        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
        expect(callBody.images).toBeNull()
      })
    })
  })
})


