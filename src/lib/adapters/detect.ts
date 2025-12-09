import type { ProviderCode } from './types';

/**
 * Detect provider from CSV/XLSX headers
 * This is a helper function, but the primary selector is the providerCode from the UI
 */
export function detectProvider(headers: string[]): ProviderCode | null {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  // Motos y Equipos indicators
  const motosIndicators = ['cod. com', 'descrip.', 'marca', 'almacen', 'disp.', 'precio.'];
  const motosMatches = motosIndicators.filter((indicator) =>
    normalizedHeaders.some((h) => h.includes(indicator.toLowerCase()))
  );

  // MRM indicators
  const mrmIndicators = ['código', 'descripción', 'moto', 'modelo', 'unidad', 'línea', 'precio'];
  const mrmMatches = mrmIndicators.filter((indicator) =>
    normalizedHeaders.some((h) => h.includes(indicator.toLowerCase()))
  );

  if (motosMatches.length >= 3) {
    return 'motos_y_equipos';
  }

  if (mrmMatches.length >= 3) {
    return 'mrm';
  }

  return null;
}

