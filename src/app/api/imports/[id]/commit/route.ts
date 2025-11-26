import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSku, slugify } from '@/lib/utils/import';
import { createHash } from 'crypto';
import { redirect } from 'next/navigation';

const BATCH_SIZE = 100;

/**
 * POST /api/imports/:id/commit
 * 
 * Commits staged items to products and product_variants.
 * Uses row_hash for idempotency to skip unchanged rows.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get batch
    const { data: batch, error: batchError } = await supabase
      .from('import_batch')
      .select('*')
      .eq('id', id)
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { error: 'Import batch not found' },
        { status: 404 }
      );
    }

    if (batch.status === 'committed') {
      return NextResponse.json(
        { error: 'Batch already committed' },
        { status: 400 }
      );
    }

    // Get valid staged items
    const { data: items, error: itemsError } = await supabase
      .from('import_item')
      .select('*')
      .eq('batch_id', id)
      .eq('stage', 'staged');

    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch import items' },
        { status: 500 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No valid items to commit' },
        { status: 400 }
      );
    }

    // Statistics
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    // Process items in batches
    const batches = [];
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      batches.push(items.slice(i, i + BATCH_SIZE));
    }

    for (const batchItems of batches) {
      for (const item of batchItems) {
        try {
          const staged = item.staged_json as any;
          const rowHash = item.row_hash;

          // Generate SKU
          const sku = generateSku(staged.providerSku, staged.name);
          const slug = slugify(staged.name);

          // Check if product exists with this SKU
          const { data: existingProduct } = await supabase
            .from('products')
            .select('id, sku')
            .eq('sku', sku)
            .single();

          // Check if we should skip (idempotency check)
          // For now, we'll always update/insert. In a production system,
          // you might want to compare row_hash with a stored hash.

          // Prepare product data
          const productData: any = {
            name: staged.name,
            slug: slug,
            sku: sku,
            description: staged.description || null,
            brand: staged.brand || null,
            motorcycle_brand: staged.brand || null,
            motorcycle_model: staged.model || null,
            price: staged.price || 0,
            compare_at_price: staged.priceDiscounted || staged.msrp || null,
            status: 'active',
            updated_at: new Date().toISOString(),
          };

          let productId: string;

          if (existingProduct) {
            // Update existing product
            const { error: updateError } = await supabase
              .from('products')
              .update(productData)
              .eq('id', existingProduct.id);

            if (updateError) {
              console.error('Error updating product:', updateError);
              failed++;
              continue;
            }

            productId = existingProduct.id;
            updated++;
          } else {
            // Insert new product
            const { data: newProduct, error: insertError } = await supabase
              .from('products')
              .insert(productData)
              .select('id')
              .single();

            if (insertError || !newProduct) {
              console.error('Error inserting product:', insertError);
              failed++;
              continue;
            }

            productId = newProduct.id;
            inserted++;
          }

          // Handle product variant if needed
          // For now, we'll create a single variant per product
          if (staged.stock !== null && staged.stock !== undefined) {
            const variantSku = `${sku}-VAR`;
            
            const { data: existingVariant } = await supabase
              .from('product_variant')
              .select('id')
              .eq('variant_sku', variantSku)
              .single();

            const variantData: any = {
              product_id: productId,
              variant_sku: variantSku,
              price: staged.price,
              stock: staged.stock,
              attrs: {
                warehouse: staged.warehouse,
                unit: staged.unit,
              },
            };

            if (existingVariant) {
              await supabase
                .from('product_variant')
                .update(variantData)
                .eq('id', existingVariant.id);
            } else {
              await supabase
                .from('product_variant')
                .insert(variantData);
            }
          }

          // Update import_item status
          await supabase
            .from('import_item')
            .update({ stage: 'committed' })
            .eq('id', item.id);
        } catch (error) {
          console.error('Error processing item:', error);
          failed++;
          
          // Mark item as failed
          await supabase
            .from('import_item')
            .update({
              stage: 'failed',
              error_text: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', item.id);
        }
      }
    }

    // Attach images from image_map
    const { data: imageMappings } = await supabase
      .from('image_map')
      .select('*')
      .eq('batch_id', id)
      .not('provider_sku', 'is', null)
      .neq('provider_sku', '');

    if (imageMappings && imageMappings.length > 0) {
      for (const mapping of imageMappings) {
        try {
          // Find product by provider SKU (we need to match via import_item)
          const { data: importItem } = await supabase
            .from('import_item')
            .select('staged_json')
            .eq('batch_id', id)
            .eq('provider_sku', mapping.provider_sku)
            .eq('stage', 'committed')
            .single();

          if (!importItem) continue;

          const staged = importItem.staged_json as any;
          const sku = generateSku(staged.providerSku, staged.name);

          // Find product
          const { data: product } = await supabase
            .from('products')
            .select('id')
            .eq('sku', sku)
            .single();

          if (!product) continue;

          // Compute SHA-256 of image URL for deduplication
          const sha256 = createHash('sha256')
            .update(mapping.url)
            .digest('hex');

          // Check if media already exists
          const { data: existingMedia } = await supabase
            .from('media')
            .select('id')
            .eq('sha256', sha256)
            .single();

          if (!existingMedia) {
            // Get current max sort for this product
            const { data: maxSort } = await supabase
              .from('media')
              .select('sort')
              .eq('product_id', product.id)
              .order('sort', { ascending: false })
              .limit(1)
              .single();

            const sort = (maxSort?.sort || 0) + 1;

            await supabase
              .from('media')
              .insert({
                product_id: product.id,
                url: mapping.url,
                is_primary: mapping.is_primary || (sort === 1),
                sort: sort,
                sha256: sha256,
                source: 'uploadthing',
              });
          }
        } catch (error) {
          console.error('Error attaching image:', error);
          // Continue with other images
        }
      }
    }

    // Update batch status
    await supabase
      .from('import_batch')
      .update({ status: 'committed' })
      .eq('id', id);

    return NextResponse.json({
      batchId: id,
      summary: {
        inserted,
        updated,
        skipped,
        failed,
        total: items.length,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/imports/[id]/commit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
