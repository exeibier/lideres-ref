import { MRMAdapter } from '../mrm'
import type { StagedItem } from '../types'

describe('MRMAdapter', () => {
  const adapter = new MRMAdapter()

  it('should parse a valid row correctly', () => {
    const row = {
      'CÓDIGO': 'MRM001',
      'DESCRIPCIÓN': 'Test Product',
      'MOTO': 'Honda',
      'MODELO': 'CBR600',
      'UNIDAD': 'PZA',
      'LÍNEA': 'Repuestos',
      'PRECIO': '1500.00',
      'PREC. DESC.': '1200.00',
      'PRECIO SUGERIDO': '1600.00',
      'CÓDIGO ANTERIOR': 'OLD001',
    }

    const result = adapter.parseRow(row, 0)

    expect(result).not.toBeNull()
    expect(result?.providerCode).toBe('mrm')
    expect(result?.providerSku).toBe('MRM001')
    expect(result?.name).toBe('Test Product')
    expect(result?.brand).toBe('Honda')
    expect(result?.model).toBe('CBR600')
    expect(result?.unit).toBe('PZA')
    expect(result?.category).toBe('Repuestos')
    expect(result?.price).toBe(1500.00)
    expect(result?.priceDiscounted).toBe(1200.00)
    expect(result?.msrp).toBe(1600.00)
    expect(result?.currency).toBe('MXN')
    expect(result?.extra?.oldCode).toBe('OLD001')
  })

  it('should handle missing optional fields', () => {
    const row = {
      'CÓDIGO': 'MRM002',
      'DESCRIPCIÓN': 'Product Name',
      'PRECIO': '500',
    }

    const result = adapter.parseRow(row, 0)

    expect(result).not.toBeNull()
    expect(result?.brand).toBeUndefined()
    expect(result?.model).toBeUndefined()
    expect(result?.priceDiscounted).toBeUndefined()
  })

  it('should return null for empty rows', () => {
    const row = {}

    const result = adapter.parseRow(row, 0)

    expect(result).toBeNull()
  })

  it('should validate a correct staged item', () => {
    const staged: StagedItem = {
      providerCode: 'mrm',
      providerSku: 'MRM001',
      name: 'Test Product',
      price: 100,
      currency: 'MXN',
    }

    const validation = adapter.validateRow(staged)

    expect(validation.valid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })
})

