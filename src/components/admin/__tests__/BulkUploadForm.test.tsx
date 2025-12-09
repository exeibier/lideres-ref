import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BulkUploadForm from '../BulkUploadForm'

// Mock next/navigation
const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('BulkUploadForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should render the form', () => {
    render(<BulkUploadForm />)
    
    expect(screen.getByLabelText(/archivo excel/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /subir y procesar/i })).toBeInTheDocument()
  })

  it('should show error for invalid file type', async () => {
    const user = userEvent.setup()
    render(<BulkUploadForm />)
    
    const fileInput = screen.getByLabelText(/archivo excel/i)
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    
    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    
    // Create a mock event that simulates the file input change
    const changeEvent = new Event('change', { bubbles: true })
    Object.defineProperty(changeEvent, 'target', {
      writable: false,
      value: {
        files: [file],
        value: '',
      },
    })
    
    // Simulate the file input change handler
    fileInput.dispatchEvent(changeEvent)
    
    // The component should call alert for invalid files
    // Note: The actual implementation uses alert, so we need to trigger it properly
    await waitFor(() => {
      // Check if alert was called or if the file was rejected
      expect(alertSpy).toHaveBeenCalled()
    }, { timeout: 1000 })
    
    alertSpy.mockRestore()
  })

  it('should accept valid Excel files', async () => {
    const user = userEvent.setup()
    render(<BulkUploadForm />)
    
    const fileInput = screen.getByLabelText(/archivo excel/i)
    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    
    await user.upload(fileInput, file)
    
    // File should be accepted without alert
    expect(window.alert).not.toHaveBeenCalled()
  })

  it('should submit form and show success message', async () => {
    const user = userEvent.setup()
    const mockFetch = global.fetch as jest.Mock
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Productos cargados exitosamente',
        productsCreated: 10,
      }),
    })

    render(<BulkUploadForm />)
    
    const fileInput = screen.getByLabelText(/archivo excel/i) as HTMLInputElement
    const file = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    
    // Upload file
    await user.upload(fileInput, file)
    
    // Verify file was accepted (button should be enabled)
    const submitButton = screen.getByRole('button', { name: /subir y procesar/i })
    expect(submitButton).not.toBeDisabled()
    
    // Submit form
    await user.click(submitButton)
    
    // Wait for fetch to be called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/products/bulk-upload',
        expect.objectContaining({
          method: 'POST',
        })
      )
    }, { timeout: 2000 })
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/productos cargados exitosamente/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should show error message on API failure', async () => {
    const user = userEvent.setup()
    const mockFetch = global.fetch as jest.Mock
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Error al procesar el archivo',
      }),
    })

    render(<BulkUploadForm />)
    
    const fileInput = screen.getByLabelText(/archivo excel/i) as HTMLInputElement
    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    
    await user.upload(fileInput, file)
    
    const submitButton = screen.getByRole('button', { name: /subir y procesar/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/error al procesar el archivo/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should disable submit button when no file is selected', () => {
    render(<BulkUploadForm />)
    
    const submitButton = screen.getByRole('button', { name: /subir y procesar/i })
    expect(submitButton).toBeDisabled()
  })

  it('should show processing state during upload', async () => {
    const user = userEvent.setup()
    const mockFetch = global.fetch as jest.Mock
    
    // Create a delayed promise to simulate processing
    let resolveFetch: (value: any) => void
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve
    })
    
    mockFetch.mockReturnValueOnce(fetchPromise)

    render(<BulkUploadForm />)
    
    const fileInput = screen.getByLabelText(/archivo excel/i) as HTMLInputElement
    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    
    await user.upload(fileInput, file)
    
    const submitButton = screen.getByRole('button', { name: /subir y procesar/i })
    await user.click(submitButton)
    
    // Check for processing state
    await waitFor(() => {
      expect(screen.getByText(/procesando/i)).toBeInTheDocument()
    }, { timeout: 1000 })
    
    expect(submitButton).toBeDisabled()
    
    // Resolve the fetch to complete the test
    resolveFetch!({
      ok: true,
      json: async () => ({ message: 'Success' }),
    })
  })
})

