import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BulkImportForm from '../BulkImportForm'

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
  UploadButton: ({ onClientUploadComplete, onUploadError, onUploadBegin }: any) => (
    <button
      onClick={() => {
        onUploadBegin?.()
        setTimeout(() => {
          onClientUploadComplete?.([{
            name: 'test.xlsx',
            url: 'https://example.com/test.xlsx',
            size: 1000,
            key: 'test-key',
          }])
        }, 100)
      }}
    >
      Upload File
    </button>
  ),
}))

// Mock fetch
global.fetch = jest.fn()

describe('BulkImportForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should render the form', () => {
    render(<BulkImportForm />)
    
    expect(screen.getByLabelText(/provider/i)).toBeInTheDocument()
    expect(screen.getAllByText(/upload file/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /start import/i })).toBeInTheDocument()
  })

  it('should allow selecting provider', async () => {
    const user = userEvent.setup()
    render(<BulkImportForm />)
    
    const providerSelect = screen.getByLabelText(/provider/i)
    expect(providerSelect).toHaveValue('motos_y_equipos')
    
    await user.selectOptions(providerSelect, 'mrm')
    expect(providerSelect).toHaveValue('mrm')
  })

  it('should show error when submitting without file', async () => {
    const user = userEvent.setup()
    render(<BulkImportForm />)
    
    const submitButton = screen.getByRole('button', { name: /start import/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      const errorText = screen.queryByText(/please upload a file first/i)
      expect(errorText).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should submit form successfully after file upload', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        batchId: 'batch-123',
        totalRows: 100,
        validRows: 95,
        failedRows: 5,
      }),
    })

    render(<BulkImportForm />)
    
    // Upload file
    const uploadButton = screen.getAllByText(/upload file/i)[0]
    await user.click(uploadButton)
    
    await waitFor(() => {
      expect(screen.getByText(/file uploaded/i)).toBeInTheDocument()
    })
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /start import/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/imports',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })
    
    await waitFor(() => {
      expect(screen.getByText(/import staged successfully/i)).toBeInTheDocument()
      expect(screen.getByText(/total rows: 100/i)).toBeInTheDocument()
      expect(screen.getByText(/valid rows: 95/i)).toBeInTheDocument()
    })
  })

  it('should show error message on API failure', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Error processing import',
        errors: ['Error 1', 'Error 2'],
      }),
    })

    render(<BulkImportForm />)
    
    // Upload file
    const uploadButton = screen.getAllByText(/upload file/i)[0]
    await user.click(uploadButton)
    
    await waitFor(() => {
      expect(screen.getByText(/file uploaded/i)).toBeInTheDocument()
    })
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /start import/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/error processing import/i)).toBeInTheDocument()
    })
  })

  it('should disable submit button during processing', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ batchId: 'batch-123' }),
      }), 100))
    )

    render(<BulkImportForm />)
    
    // Upload file
    const uploadButton = screen.getAllByText(/upload file/i)[0]
    await user.click(uploadButton)
    
    await waitFor(() => {
      expect(screen.getByText(/file uploaded/i)).toBeInTheDocument()
    })
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /start import/i })
    await user.click(submitButton)
    
    expect(screen.getAllByText(/processing/i).length).toBeGreaterThan(0)
    expect(submitButton).toBeDisabled()
  })

  it('should show link to import details on success', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        batchId: 'batch-123',
        totalRows: 100,
        validRows: 100,
        failedRows: 0,
      }),
    })

    render(<BulkImportForm />)
    
    // Upload file
    const uploadButton = screen.getAllByText(/upload file/i)[0]
    await user.click(uploadButton)
    
    await waitFor(() => {
      expect(screen.getByText(/file uploaded/i)).toBeInTheDocument()
    })
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /start import/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/view import details/i)).toBeInTheDocument()
    })
    
    const link = screen.getByText(/view import details/i)
    expect(link.closest('a')).toHaveAttribute('href', '/admin/products/import/batch-123')
  })
})

