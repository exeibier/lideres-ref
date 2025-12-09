import type { ProviderCode, ProviderAdapter } from './types';
import { MotosYEquiposAdapter } from './motos_y_equipos';
import { MRMAdapter } from './mrm';

/**
 * Get adapter for a provider code
 */
export function getAdapter(providerCode: ProviderCode): ProviderAdapter {
  switch (providerCode) {
    case 'motos_y_equipos':
      return new MotosYEquiposAdapter();
    case 'mrm':
      return new MRMAdapter();
    default:
      throw new Error(`Unknown provider code: ${providerCode}`);
  }
}

export * from './types';
export * from './validators';
export * from './detect';
export { MotosYEquiposAdapter } from './motos_y_equipos';
export { MRMAdapter } from './mrm';

