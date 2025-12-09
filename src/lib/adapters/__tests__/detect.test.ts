import { detectProvider } from '../detect'

describe('detectProvider', () => {
  it('should detect Motos y Equipos provider', () => {
    const headers = ['Cod. com', 'Descrip.', 'Marca', 'Almacen', 'Disp.', 'Precio.']
    const result = detectProvider(headers)
    expect(result).toBe('motos_y_equipos')
  })

  it('should detect MRM provider', () => {
    const headers = ['CÓDIGO', 'DESCRIPCIÓN', 'MOTO', 'MODELO', 'UNIDAD', 'LÍNEA', 'PRECIO']
    const result = detectProvider(headers)
    expect(result).toBe('mrm')
  })

  it('should return null for unrecognized headers', () => {
    const headers = ['Column1', 'Column2', 'Column3']
    const result = detectProvider(headers)
    expect(result).toBeNull()
  })

  it('should handle case-insensitive headers', () => {
    const headers = ['cod. com', 'DESCRIP.', 'marca', 'ALMACEN', 'disp.', 'PRECIO.']
    const result = detectProvider(headers)
    expect(result).toBe('motos_y_equipos')
  })

  it('should require at least 3 matching indicators', () => {
    const headers = ['Cod. com', 'Descrip.'] // Only 2 indicators
    const result = detectProvider(headers)
    expect(result).toBeNull()
  })

  it('should handle headers with extra whitespace', () => {
    const headers = ['  Cod. com  ', '  Descrip.  ', '  Marca  ', '  Almacen  ']
    const result = detectProvider(headers)
    expect(result).toBe('motos_y_equipos')
  })
})

