import { z } from 'zod';
import type { StagedItem } from './types';

/**
 * Base schema for StagedItem validation
 */
export const stagedItemSchema = z.object({
  providerCode: z.enum(['motos_y_equipos', 'mrm']),
  providerSku: z.string().min(1, 'Provider SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().optional(),
  warehouse: z.string().optional(),
  stock: z.number().int().nullable().optional(),
  price: z.number().nullable(),
  priceDiscounted: z.number().nullable().optional(),
  msrp: z.number().nullable().optional(),
  currency: z.literal('MXN'),
  extra: z.record(z.unknown()).optional(),
  imageHints: z.array(z.string()).optional(),
});

/**
 * Validate a staged item with detailed error messages
 */
export function validateStagedItem(item: StagedItem): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!item.providerSku || item.providerSku.trim() === '') {
    errors.push('Provider SKU is required');
  }

  if (!item.name || item.name.trim() === '') {
    errors.push('Name is required');
  }

  // Price validation (can be null for Motos y Equipos, but must be numeric when present)
  if (item.price !== null && (typeof item.price !== 'number' || isNaN(item.price))) {
    errors.push('Price must be a valid number or null');
  }

  // Stock validation (must be integer when present)
  if (item.stock !== null && item.stock !== undefined) {
    if (typeof item.stock !== 'number' || !Number.isInteger(item.stock)) {
      errors.push('Stock must be an integer when provided');
    }
    if (item.stock < 0) {
      errors.push('Stock cannot be negative');
    }
  }

  // Currency validation
  if (item.currency !== 'MXN') {
    errors.push('Currency must be MXN');
  }

  // Try Zod validation for additional checks
  const result = stagedItemSchema.safeParse(item);
  if (!result.success) {
    result.error.issues.forEach((err) => {
      errors.push(`${err.path.join('.')}: ${err.message}`);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

