/**
 * Integration tests for the bulk import flow
 * Tests the complete flow from file upload to product creation
 */

import { getAdapter } from '@/lib/adapters'
import { computeRowHash, sanitizePrice } from '@/lib/utils/import'
import type { StagedItem } from '@/lib/adapters/types'

describe('Bulk Import Flow Integration', () => {
  describe('Motos y Equipos Import Flow', () => {
    it('should parse, validate, and process a complete row', () => {
      const adapter = getAdapter('motos_y_equipos')
      
      const rawRow = {
        'Cod. com': 'SKU123',
        'Descrip.': 'Brake Pad Set',
        'Marca': 'Honda',
        'Almacen': 'Warehouse A',
        'Disp.': '10',
        'Precio.': '$1,234.56',
        'Fec. Rec.': '2025-01-01',
      }

      // Step 1: Parse row
      const staged = adapter.parseRow(rawRow, 0)
      expect(staged).not.toBeNull()
      expect(staged?.providerCode).toBe('motos_y_equipos')
      expect(staged?.providerSku).toBe('SKU123')
      expect(staged?.name).toBe('Brake Pad Set')

      // Step 2: Validate
      if (staged) {
        const validation = adapter.validateRow(staged)
        expect(validation.valid).toBe(true)
        expect(validation.errors).toHaveLength(0)

        // Step 3: Compute hash for deduplication
        const hash = computeRowHash(staged)
        expect(hash).toHaveLength(64) // SHA-256 hex string
      }
    })

    it('should handle price sanitization correctly', () => {
      const price1 = sanitizePrice('$1,234.56')
      expect(price1).toBe(1234.56)

      const price2 = sanitizePrice('$ 2,500.00')
      expect(price2).toBe(2500.00)

      const price3 = sanitizePrice('invalid')
      expect(price3).toBeNull()
    })
  })

  describe('MRM Import Flow', () => {
    it('should parse, validate, and process a complete row', () => {
      const adapter = getAdapter('mrm')
      
      const rawRow = {
        'CÓDIGO': 'MRM001',
        'DESCRIPCIÓN': 'Oil Filter',
        'MOTO': 'Yamaha',
        'MODELO': 'R1',
        'UNIDAD': 'PZA',
        'LÍNEA': 'Repuestos',
        'PRECIO': '1500.00',
        'PREC. DESC.': '1200.00',
        'PRECIO SUGERIDO': '1600.00',
      }

      // Step 1: Parse row
      const staged = adapter.parseRow(rawRow, 0)
      expect(staged).not.toBeNull()
      expect(staged?.providerCode).toBe('mrm')
      expect(staged?.providerSku).toBe('MRM001')
      expect(staged?.name).toBe('Oil Filter')
      expect(staged?.price).toBe(1500.00)
      expect(staged?.priceDiscounted).toBe(1200.00)

      // Step 2: Validate
      if (staged) {
        const validation = adapter.validateRow(staged)
        expect(validation.valid).toBe(true)
        expect(validation.errors).toHaveLength(0)

        // Step 3: Compute hash
        const hash = computeRowHash(staged)
        expect(hash).toHaveLength(64)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid rows gracefully', () => {
      const adapter = getAdapter('motos_y_equipos')
      
      const invalidRow = {}
      const result = adapter.parseRow(invalidRow, 0)
      expect(result).toBeNull()
    })

    it('should validate required fields', () => {
      const adapter = getAdapter('motos_y_equipos')
      
      const invalidStaged: StagedItem = {
        providerCode: 'motos_y_equipos',
        providerSku: '', // Empty SKU
        name: '', // Empty name
        price: null,
        currency: 'MXN',
      }

      const validation = adapter.validateRow(invalidStaged)
      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Data Consistency', () => {
    it('should generate consistent hashes for same data', () => {
      const item1: StagedItem = {
        providerCode: 'motos_y_equipos',
        providerSku: 'SKU123',
        name: 'Test Product',
        price: 100,
        currency: 'MXN',
      }

      const item2: StagedItem = {
        providerCode: 'motos_y_equipos',
        providerSku: 'SKU123',
        name: 'Test Product',
        price: 100,
        currency: 'MXN',
      }

      const hash1 = computeRowHash(item1)
      const hash2 = computeRowHash(item2)

      expect(hash1).toBe(hash2)
    })

    it('should generate different hashes for different data', () => {
      const item1: StagedItem = {
        providerCode: 'motos_y_equipos',
        providerSku: 'SKU123',
        name: 'Test Product',
        price: 100,
        currency: 'MXN',
      }

      const item2: StagedItem = {
        providerCode: 'motos_y_equipos',
        providerSku: 'SKU124', // Different SKU
        name: 'Test Product',
        price: 100,
        currency: 'MXN',
      }

      const hash1 = computeRowHash(item1)
      const hash2 = computeRowHash(item2)

      expect(hash1).not.toBe(hash2)
    })
  })
})

