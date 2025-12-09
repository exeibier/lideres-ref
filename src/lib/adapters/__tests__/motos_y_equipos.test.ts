import { MotosYEquiposAdapter } from '../motos_y_equipos'
import type { StagedItem } from '../types'

describe('MotosYEquiposAdapter', () => {
  const adapter = new MotosYEquiposAdapter()

  it('should parse a valid row correctly', () => {
    const row = {
      'Cod. com': 'SKU123',
      'Descrip.': 'Test Product',
      'Marca': 'Test Brand',
      'Almacen': 'Warehouse A',
      'Disp.': '10',
      'Precio.': '$1,234.56',
      'Fec. Rec.': '2025-01-01',
    }

    const result = adapter.parseRow(row, 0)

    expect(result).not.toBeNull()
    expect(result?.providerCode).toBe('motos_y_equipos')
    expect(result?.providerSku).toBe('SKU123')
    expect(result?.name).toBe('Test Product')
    expect(result?.brand).toBe('Test Brand')
    expect(result?.warehouse).toBe('Warehouse A')
    expect(result?.stock).toBe(10)
    expect(result?.price).toBe(1234.56)
    expect(result?.currency).toBe('MXN')
  })

  it('should handle missing optional fields', () => {
    const row = {
      'Cod. com': 'SKU456',
      'Descrip.': 'Product Name',
      'Precio.': '500',
    }

    const result = adapter.parseRow(row, 0)

    expect(result).not.toBeNull()
    expect(result?.brand).toBeUndefined()
    expect(result?.warehouse).toBeUndefined()
    expect(result?.stock).toBeNull()
  })

  it('should return null for empty rows', () => {
    const row = {}

    const result = adapter.parseRow(row, 0)

    expect(result).toBeNull()
  })

  it('should validate a correct staged item', () => {
    const staged: StagedItem = {
      providerCode: 'motos_y_equipos',
      providerSku: 'SKU123',
      name: 'Test Product',
      price: 100,
      currency: 'MXN',
    }

    const validation = adapter.validateRow(staged)

    expect(validation.valid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('should reject items with missing required fields', () => {
    const staged: StagedItem = {
      providerCode: 'motos_y_equipos',
      providerSku: '',
      name: '',
      price: null,
      currency: 'MXN',
    }

    const validation = adapter.validateRow(staged)

    expect(validation.valid).toBe(false)
    expect(validation.errors.length).toBeGreaterThan(0)
  })
})

