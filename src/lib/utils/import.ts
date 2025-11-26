import { createHash } from 'crypto';
import type { StagedItem } from '../adapters/types';

/**
 * Sanitize price string to number
 * Handles formats like "$1,234.00" → 1234.00
 */
export function sanitizePrice(priceStr: string): number | null {
  if (!priceStr || typeof priceStr !== 'string') {
    return null;
  }

  // Remove currency symbols, spaces, and commas
  const cleaned = priceStr
    .replace(/[$,\s]/g, '')
    .trim();

  if (!cleaned) {
    return null;
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Compute stable hash for a staged item (for idempotency)
 * Uses SHA-256 hash of canonical fields
 */
export function computeRowHash(item: StagedItem): string {
  // Create a stable representation of the item
  const canonical = {
    providerCode: item.providerCode,
    providerSku: item.providerSku,
    name: item.name,
    brand: item.brand || '',
    model: item.model || '',
    category: item.category || '',
    price: item.price,
    priceDiscounted: item.priceDiscounted || null,
    msrp: item.msrp || null,
    stock: item.stock || null,
    unit: item.unit || '',
    warehouse: item.warehouse || '',
  };

  // Sort keys for consistency
  const sorted = JSON.stringify(canonical, Object.keys(canonical).sort());
  
  // Compute SHA-256 hash
  return createHash('sha256').update(sorted).digest('hex');
}

/**
 * Batch array into chunks
 */
export function batchArray<T>(array: T[], chunkSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    batches.push(array.slice(i, i + chunkSize));
  }
  return batches;
}

/**
 * Generate a slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate SKU from provider SKU and name
 */
export function generateSku(providerSku: string, name: string): string {
  const skuPart = providerSku.trim().toUpperCase().replace(/[^\w-]/g, '-');
  const namePart = slugify(name).substring(0, 20);
  return `${skuPart}-${namePart}`.substring(0, 100);
}

