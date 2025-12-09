import { sanitizePrice, computeRowHash, generateSku, slugify } from '../import'
import type { StagedItem } from '../../adapters/types'

describe('import utilities', () => {
  describe('sanitizePrice', () => {
    it('should handle dollar sign and commas', () => {
      expect(sanitizePrice('$1,234.56')).toBe(1234.56)
    })

    it('should handle plain numbers', () => {
      expect(sanitizePrice('1234.56')).toBe(1234.56)
    })

    it('should handle strings with spaces', () => {
      expect(sanitizePrice('$ 1,234.56')).toBe(1234.56)
    })

    it('should return null for invalid input', () => {
      expect(sanitizePrice('')).toBeNull()
      expect(sanitizePrice('abc')).toBeNull()
      expect(sanitizePrice('$')).toBeNull()
    })
  })

  describe('computeRowHash', () => {
    it('should generate consistent hashes for same input', () => {
      const item: StagedItem = {
        providerCode: 'motos_y_equipos',
        providerSku: 'SKU123',
        name: 'Test Product',
        price: 100,
        currency: 'MXN',
      }

      const hash1 = computeRowHash(item)
      const hash2 = computeRowHash(item)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA-256 produces 64 char hex string
    })

    it('should generate different hashes for different inputs', () => {
      const item1: StagedItem = {
        providerCode: 'motos_y_equipos',
        providerSku: 'SKU123',
        name: 'Test Product',
        price: 100,
        currency: 'MXN',
      }

      const item2: StagedItem = {
        providerCode: 'motos_y_equipos',
        providerSku: 'SKU124',
        name: 'Test Product',
        price: 100,
        currency: 'MXN',
      }

      const hash1 = computeRowHash(item1)
      const hash2 = computeRowHash(item2)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('generateSku', () => {
    it('should generate a valid SKU', () => {
      const sku = generateSku('PROV-123', 'Test Product Name')
      expect(sku).toContain('PROV-123')
      expect(sku.length).toBeLessThanOrEqual(100)
    })

    it('should handle special characters', () => {
      const sku = generateSku('PROV@123', 'Test & Product')
      expect(sku).not.toContain('@')
      expect(sku).not.toContain('&')
    })
  })

  describe('slugify', () => {
    it('should convert text to slug', () => {
      expect(slugify('Test Product Name')).toBe('test-product-name')
    })

    it('should handle special characters', () => {
      expect(slugify('Test & Product!')).toBe('test-product')
    })

    it('should handle multiple spaces', () => {
      expect(slugify('Test    Product')).toBe('test-product')
    })
  })
})

