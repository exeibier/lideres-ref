/**
 * Canonical staged item type for bulk imports
 */
export type StagedItem = {
  providerCode: 'motos_y_equipos' | 'mrm';
  providerSku: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  category?: string;
  unit?: string;
  warehouse?: string;
  stock?: number | null;
  price: number | null;
  priceDiscounted?: number | null;
  msrp?: number | null;
  currency: 'MXN';
  extra?: Record<string, unknown>;
  imageHints?: string[];
};

/**
 * Provider code type
 */
export type ProviderCode = 'motos_y_equipos' | 'mrm';

/**
 * Adapter interface for provider-specific parsing
 */
export interface ProviderAdapter {
  providerCode: ProviderCode;
  parseRow(row: Record<string, unknown>, rowIndex: number): StagedItem | null;
  validateRow(staged: StagedItem): { valid: boolean; errors: string[] };
}

