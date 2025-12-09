import type { StagedItem } from './types';

/**
 * Manual validation for StagedItem
 * Using manual validation instead of Zod to avoid version compatibility issues
 * This provides the same level of validation with better error messages
 */

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

  // Type validation for optional fields
  if (item.description !== undefined && typeof item.description !== 'string') {
    errors.push('Description must be a string');
  }

  if (item.brand !== undefined && typeof item.brand !== 'string') {
    errors.push('Brand must be a string');
  }

  if (item.model !== undefined && typeof item.model !== 'string') {
    errors.push('Model must be a string');
  }

  if (item.category !== undefined && typeof item.category !== 'string') {
    errors.push('Category must be a string');
  }

  if (item.unit !== undefined && typeof item.unit !== 'string') {
    errors.push('Unit must be a string');
  }

  if (item.warehouse !== undefined && typeof item.warehouse !== 'string') {
    errors.push('Warehouse must be a string');
  }

  if (item.priceDiscounted !== undefined && item.priceDiscounted !== null && (typeof item.priceDiscounted !== 'number' || isNaN(item.priceDiscounted))) {
    errors.push('Price discounted must be a valid number or null');
  }

  if (item.msrp !== undefined && item.msrp !== null && (typeof item.msrp !== 'number' || isNaN(item.msrp))) {
    errors.push('MSRP must be a valid number or null');
  }

  if (item.imageHints !== undefined && !Array.isArray(item.imageHints)) {
    errors.push('Image hints must be an array');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

