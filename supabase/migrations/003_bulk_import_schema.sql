-- Bulk Import Schema Migration
-- This migration adds tables for bulk product imports

-- Create product_variant table (if not exists in main schema)
CREATE TABLE IF NOT EXISTS product_variant (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_sku TEXT UNIQUE NOT NULL,
  attrs JSONB DEFAULT '{}'::jsonb,
  price NUMERIC(10, 2),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create import_batch table
CREATE TABLE IF NOT EXISTS import_batch (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_code TEXT NOT NULL CHECK (provider_code IN ('motos_y_equipos', 'mrm')),
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'staged', 'validated', 'committed', 'failed')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create import_item table
CREATE TABLE IF NOT EXISTS import_item (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES import_batch(id) ON DELETE CASCADE NOT NULL,
  provider_sku TEXT NOT NULL,
  staged_json JSONB NOT NULL,
  stage TEXT NOT NULL DEFAULT 'staged' CHECK (stage IN ('staged', 'validated', 'committed', 'failed')),
  error_text TEXT,
  row_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create media table
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variant(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort INTEGER DEFAULT 1,
  sha256 TEXT,
  source TEXT NOT NULL CHECK (source IN ('uploadthing', 'provider_url')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT media_product_or_variant CHECK (
    (product_id IS NOT NULL AND variant_id IS NULL) OR
    (product_id IS NULL AND variant_id IS NOT NULL) OR
    (product_id IS NOT NULL AND variant_id IS NOT NULL)
  )
);

-- Create image_map table
CREATE TABLE IF NOT EXISTS image_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES import_batch(id) ON DELETE CASCADE NOT NULL,
  provider_sku TEXT NOT NULL,
  uploadthing_filename TEXT,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_import_batch_provider_code ON import_batch(provider_code);
CREATE INDEX IF NOT EXISTS idx_import_batch_status ON import_batch(status);
CREATE INDEX IF NOT EXISTS idx_import_batch_created_by ON import_batch(created_by);
CREATE INDEX IF NOT EXISTS idx_import_batch_created_at ON import_batch(created_at);

CREATE INDEX IF NOT EXISTS idx_import_item_batch_id ON import_item(batch_id);
CREATE INDEX IF NOT EXISTS idx_import_item_provider_sku ON import_item(provider_sku);
CREATE INDEX IF NOT EXISTS idx_import_item_stage ON import_item(stage);
CREATE INDEX IF NOT EXISTS idx_import_item_row_hash ON import_item(row_hash);
CREATE INDEX IF NOT EXISTS idx_import_item_batch_stage ON import_item(batch_id, stage);

CREATE INDEX IF NOT EXISTS idx_product_variant_product_id ON product_variant(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_sku ON product_variant(variant_sku);

CREATE INDEX IF NOT EXISTS idx_media_product_id ON media(product_id);
CREATE INDEX IF NOT EXISTS idx_media_variant_id ON media(variant_id);
CREATE INDEX IF NOT EXISTS idx_media_sha256 ON media(sha256) WHERE sha256 IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_image_map_batch_id ON image_map(batch_id);
CREATE INDEX IF NOT EXISTS idx_image_map_provider_sku ON image_map(provider_sku);

-- Create triggers for updated_at
CREATE TRIGGER update_product_variant_updated_at BEFORE UPDATE ON product_variant
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_batch_updated_at BEFORE UPDATE ON import_batch
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_item_updated_at BEFORE UPDATE ON import_item
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_image_map_updated_at BEFORE UPDATE ON image_map
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE product_variant ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batch ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_map ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_variant
CREATE POLICY "Anyone can view product variants"
  ON product_variant FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variant.product_id
      AND (products.status = 'active' OR 
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admins can manage product variants"
  ON product_variant FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for import_batch
CREATE POLICY "Admins can view all import batches"
  ON import_batch FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create import batches"
  ON import_batch FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Admins can update import batches"
  ON import_batch FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for import_item
CREATE POLICY "Admins can view import items"
  ON import_item FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage import items"
  ON import_item FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for media
CREATE POLICY "Anyone can view media"
  ON media FOR SELECT
  USING (
    (product_id IS NULL AND variant_id IS NULL) OR
    (product_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM products
      WHERE products.id = media.product_id
      AND (products.status = 'active' OR 
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )) OR
    (variant_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM product_variant
      JOIN products ON products.id = product_variant.product_id
      WHERE product_variant.id = media.variant_id
      AND (products.status = 'active' OR 
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    ))
  );

CREATE POLICY "Admins can manage media"
  ON media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for image_map
CREATE POLICY "Admins can view image maps"
  ON image_map FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage image maps"
  ON image_map FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

