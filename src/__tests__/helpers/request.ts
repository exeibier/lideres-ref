/**
 * Test helper to create mock NextRequest objects
 * This works around NextRequest constructor limitations in Jest
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: string | FormData
    headers?: Record<string, string>
  } = {}
): any {
  const { method = 'GET', body, headers = {} } = options

  // Create a mock request object that mimics NextRequest behavior
  const mockRequest = {
    url,
    method,
    headers: new Headers(headers),
    _body: body,
    
    async json() {
      if (typeof this._body === 'string') {
        return JSON.parse(this._body)
      }
      return {}
    },
    
    async formData() {
      if (this._body instanceof FormData) {
        return this._body
      }
      return new FormData()
    },
    
    async text() {
      if (typeof this._body === 'string') {
        return this._body
      }
      return ''
    },
    
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0))
    },
  }

  return mockRequest
}

