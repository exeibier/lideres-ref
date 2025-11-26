import type { ProviderAdapter, StagedItem } from './types';
import { validateStagedItem } from './validators';
import { sanitizePrice } from '../utils/import';

/**
 * MRM adapter for XLSX files (Precios_OCT2025_A.xlsx, data starts at row 8)
 * 
 * Column mappings:
 * - CÓDIGO → providerSku
 * - DESCRIPCIÓN → name
 * - MOTO → brand
 * - MODELO → model
 * - UNIDAD → unit
 * - LÍNEA → category
 * - PRECIO → price
 * - PREC. DESC. → priceDiscounted
 * - PRECIO SUGERIDO → msrp
 * - CÓDIGO ANTERIOR → extra.oldCode
 */
export class MRMAdapter implements ProviderAdapter {
  providerCode: 'mrm' = 'mrm';

  parseRow(row: Record<string, unknown>, rowIndex: number): StagedItem | null {
    try {
      // Normalize column names (handle variations in spacing/punctuation)
      const normalizedRow: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = key.toLowerCase().trim();
        normalizedRow[normalizedKey] = String(value ?? '').trim();
      }

      // Extract fields with fallback variations
      const providerSku = 
        normalizedRow['código'] || 
        normalizedRow['codigo'] || 
        normalizedRow['code'] || 
        '';

      const name = 
        normalizedRow['descripción'] || 
        normalizedRow['descripcion'] || 
        normalizedRow['descrip'] || 
        normalizedRow['description'] || 
        '';

      const brand = 
        normalizedRow['moto'] || 
        normalizedRow['marca'] || 
        normalizedRow['brand'] || 
        '';

      const model = 
        normalizedRow['modelo'] || 
        normalizedRow['model'] || 
        '';

      const unit = 
        normalizedRow['unidad'] || 
        normalizedRow['unit'] || 
        '';

      const category = 
        normalizedRow['línea'] || 
        normalizedRow['linea'] || 
        normalizedRow['line'] || 
        normalizedRow['categoria'] || 
        normalizedRow['categoría'] || 
        '';

      const priceStr = 
        normalizedRow['precio'] || 
        normalizedRow['price'] || 
        '';

      const priceDiscountedStr = 
        normalizedRow['prec. desc.'] || 
        normalizedRow['prec desc'] || 
        normalizedRow['precio desc'] || 
        normalizedRow['precio descuento'] || 
        normalizedRow['price discounted'] || 
        '';

      const msrpStr = 
        normalizedRow['precio sugerido'] || 
        normalizedRow['precio_sugerido'] || 
        normalizedRow['msrp'] || 
        normalizedRow['precio sugerido'] || 
        '';

      const oldCode = 
        normalizedRow['código anterior'] || 
        normalizedRow['codigo anterior'] || 
        normalizedRow['old code'] || 
        normalizedRow['codigo_anterior'] || 
        '';

      // Skip empty rows
      if (!providerSku && !name) {
        return null;
      }

      // Parse prices
      const price = priceStr ? sanitizePrice(priceStr) : null;
      const priceDiscounted = priceDiscountedStr ? sanitizePrice(priceDiscountedStr) : undefined;
      const msrp = msrpStr ? sanitizePrice(msrpStr) : undefined;

      // Build extra object
      const extra: Record<string, unknown> = {};
      if (oldCode) {
        extra.oldCode = oldCode;
      }

      // Build staged item
      const staged: StagedItem = {
        providerCode: 'mrm',
        providerSku: providerSku || `UNKNOWN-${rowIndex}`,
        name: name || 'Sin nombre',
        brand: brand || undefined,
        model: model || undefined,
        category: category || undefined,
        unit: unit || undefined,
        price: price,
        priceDiscounted: priceDiscounted,
        msrp: msrp,
        currency: 'MXN',
        extra: Object.keys(extra).length > 0 ? extra : undefined,
      };

      return staged;
    } catch (error) {
      console.error(`Error parsing row ${rowIndex}:`, error);
      return null;
    }
  }

  validateRow(staged: StagedItem): { valid: boolean; errors: string[] } {
    return validateStagedItem(staged);
  }
}

