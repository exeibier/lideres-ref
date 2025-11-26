import type { ProviderAdapter, StagedItem } from './types';
import { validateStagedItem } from './validators';
import { sanitizePrice } from '../utils/import';

/**
 * Motos y Equipos adapter for CSV files (Disp_cte_admin.csv)
 * 
 * Column mappings:
 * - Cod. com → providerSku
 * - Descrip. → name
 * - Marca → brand
 * - Almacen → warehouse
 * - Disp. → stock (int)
 * - Precio. → price (strip $ and ,)
 * - Fec. Rec. → extra.receivedAtRaw
 */
export class MotosYEquiposAdapter implements ProviderAdapter {
  providerCode: 'motos_y_equipos' = 'motos_y_equipos';

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
        normalizedRow['cod. com'] || 
        normalizedRow['cod com'] || 
        normalizedRow['codigo'] || 
        normalizedRow['codigo com'] || 
        '';

      const name = 
        normalizedRow['descrip.'] || 
        normalizedRow['descrip'] || 
        normalizedRow['descripcion'] || 
        normalizedRow['descripción'] || 
        '';

      const brand = 
        normalizedRow['marca'] || 
        '';

      const warehouse = 
        normalizedRow['almacen'] || 
        normalizedRow['almacén'] || 
        '';

      const stockStr = 
        normalizedRow['disp.'] || 
        normalizedRow['disp'] || 
        normalizedRow['disponible'] || 
        normalizedRow['disponibilidad'] || 
        '';

      const priceStr = 
        normalizedRow['precio.'] || 
        normalizedRow['precio'] || 
        normalizedRow['precio '] || 
        '';

      const receivedAtRaw = 
        normalizedRow['fec. rec.'] || 
        normalizedRow['fec rec'] || 
        normalizedRow['fecha rec'] || 
        normalizedRow['fecha recepcion'] || 
        '';

      // Skip empty rows
      if (!providerSku && !name) {
        return null;
      }

      // Parse stock
      let stock: number | null = null;
      if (stockStr) {
        const stockNum = parseInt(stockStr.replace(/[^\d-]/g, ''), 10);
        if (!isNaN(stockNum)) {
          stock = stockNum;
        }
      }

      // Parse price
      const price = priceStr ? sanitizePrice(priceStr) : null;

      // Build staged item
      const staged: StagedItem = {
        providerCode: 'motos_y_equipos',
        providerSku: providerSku || `UNKNOWN-${rowIndex}`,
        name: name || 'Sin nombre',
        brand: brand || undefined,
        warehouse: warehouse || undefined,
        stock: stock,
        price: price,
        currency: 'MXN',
        extra: receivedAtRaw ? { receivedAtRaw } : undefined,
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

