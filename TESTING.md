# Testing Documentation

## Test Setup

This project uses **Jest** and **React Testing Library** for testing Next.js 16 applications.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

### Unit Tests

#### Utility Functions (`src/lib/utils/__tests__/`)
- ✅ `import.test.ts` - Price sanitization, hash computation, SKU generation, slugify
- ✅ `fuzzy-match.test.ts` - Image matching with Fuse.js

#### Adapters (`src/lib/adapters/__tests__/`)
- ✅ `mrm.test.ts` - MRM adapter parsing and validation
- ✅ `motos_y_equipos.test.ts` - Motos y Equipos adapter parsing and validation
- ✅ `detect.test.ts` - Provider detection from headers

### API Route Tests (`src/app/api/**/__tests__/`)
- `orders/create/route.test.ts` - Order creation logic
- `admin/products/bulk-upload/route.test.ts` - Bulk upload validation

**Note:** API route tests require proper mocking of NextRequest. Use the `createMockRequest` helper from `src/__tests__/helpers/request.ts`.

### Component Tests (`src/components/**/__tests__/`)
- `BulkUploadForm.test.tsx` - File upload form component
- `BulkImportForm.test.tsx` - Import form with provider selection

**Note:** Component tests use React Testing Library and require proper mocking of:
- Next.js router (`next/navigation`)
- Supabase clients
- UploadThing components

### Integration Tests (`src/__tests__/integration/`)
- ✅ `import-flow.test.ts` - Complete import flow from parsing to validation
- ✅ `order-flow.test.ts` - Order calculation and processing

## Test Coverage

Current test status:
- **57 passing tests** covering core functionality
- Utility functions and adapters: **100% coverage**
- Integration tests: **Complete flow coverage**

## Writing New Tests

### API Route Test Example

```typescript
import { POST } from '../route'
import { createMockRequest } from '@/__tests__/helpers/request'

describe('API Route', () => {
  it('should handle request', async () => {
    const request = createMockRequest('http://localhost:3000/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(screen.getByText('Clicked')).toBeInTheDocument()
  })
})
```

## Mocking

### Supabase
Supabase clients are automatically mocked in `jest.setup.js`. The mocks return chainable query builders.

### Next.js Router
Router functions (`useRouter`, `usePathname`, etc.) are mocked in `jest.setup.js`.

### UploadThing
UploadThing components are mocked to return simple div elements.

## Known Issues

1. **NextRequest in API Tests**: Some API route tests may require additional setup for NextRequest. Use the `createMockRequest` helper.

2. **File Upload Testing**: Component tests involving file uploads may need special handling. Use `userEvent.upload()` for file inputs.

3. **Async Operations**: Use `waitFor()` from React Testing Library for async state updates.

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component/function does, not how it does it.

2. **Use Descriptive Test Names**: Test names should clearly describe what is being tested.

3. **Keep Tests Isolated**: Each test should be independent and not rely on other tests.

4. **Mock External Dependencies**: Always mock external services (Supabase, APIs, etc.).

5. **Test Edge Cases**: Include tests for error conditions, empty states, and boundary values.

## Continuous Integration

Tests should pass before merging code. The test suite runs automatically in CI/CD pipelines.

