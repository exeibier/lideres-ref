-- Create Categories Migration
-- This migration creates categories for motorcycle parts and accessories

-- Main Categories
INSERT INTO categories (name, slug, description) VALUES
('Repuestos', 'repuestos', 'Repuestos y piezas de recambio para motocicletas')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description) VALUES
('Accesorios', 'accesorios', 'Accesorios y complementos para motocicletas')
ON CONFLICT (slug) DO NOTHING;

-- Get parent category IDs for subcategories
DO $$
DECLARE
  repuestos_id UUID;
  accesorios_id UUID;
BEGIN
  -- Get Repuestos category ID
  SELECT id INTO repuestos_id FROM categories WHERE slug = 'repuestos';
  
  -- Get Accesorios category ID
  SELECT id INTO accesorios_id FROM categories WHERE slug = 'accesorios';

  -- Repuestos Subcategories
  INSERT INTO categories (name, slug, description, parent_id) VALUES
  ('Motor', 'motor', 'Partes y componentes del motor', repuestos_id),
  ('Suspensión', 'suspension', 'Componentes de suspensión: amortiguadores, horquillas, etc.', repuestos_id),
  ('Frenos', 'frenos', 'Sistemas de frenado: pastillas, discos, líquido de frenos', repuestos_id),
  ('Transmisión', 'transmision', 'Componentes de transmisión: cadena, piñones, embrague', repuestos_id),
  ('Llantas y Neumáticos', 'llantas-neumaticos', 'Llantas, neumáticos y cámaras', repuestos_id),
  ('Filtros', 'filtros', 'Filtros de aire, aceite y combustible', repuestos_id),
  ('Sistema Eléctrico', 'sistema-electrico', 'Componentes eléctricos: baterías, bujías, alternadores', repuestos_id),
  ('Escape', 'escape', 'Sistemas de escape y silenciadores', repuestos_id),
  ('Carrocería', 'carroceria', 'Piezas de carrocería: carenados, espejos, guardabarros', repuestos_id),
  ('Combustible', 'combustible', 'Sistema de combustible: depósito, carburador, inyectores', repuestos_id),
  ('Refrigeración', 'refrigeracion', 'Sistema de refrigeración: radiador, termostato', repuestos_id),
  ('Baterías', 'baterias', 'Baterías para motocicletas', repuestos_id)
  ON CONFLICT (slug) DO NOTHING;

  -- Accesorios Subcategories
  INSERT INTO categories (name, slug, description, parent_id) VALUES
  ('Cascos', 'cascos', 'Cascos de seguridad y protección', accesorios_id),
  ('Ropa y Protección', 'ropa-proteccion', 'Chaquetas, pantalones, guantes y equipamiento de protección', accesorios_id),
  ('Luces e Iluminación', 'luces-iluminacion', 'Sistemas de iluminación y faros', accesorios_id),
  ('Almacenamiento', 'almacenamiento', 'Baúles, alforjas y sistemas de almacenamiento', accesorios_id),
  ('Herramientas', 'herramientas', 'Herramientas para mantenimiento y reparación', accesorios_id),
  ('Aceites y Lubricantes', 'aceites-lubricantes', 'Aceites para motor, transmisión y lubricantes', accesorios_id),
  ('GPS y Navegación', 'gps-navegacion', 'Sistemas de navegación GPS para motocicletas', accesorios_id),
  ('Seguridad', 'seguridad', 'Alarmas, candados y sistemas de seguridad', accesorios_id),
  ('Comodidad', 'comodidad', 'Asientos, reposapiés y accesorios de comodidad', accesorios_id),
  ('Personalización', 'personalizacion', 'Accesorios para personalizar tu motocicleta', accesorios_id)
  ON CONFLICT (slug) DO NOTHING;
END $$;

