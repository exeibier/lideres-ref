import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ImageMapping {
  providerSku: string;
  url: string;
  isPrimary?: boolean;
  sort?: number;
}

/**
 * PUT /api/imports/:id/image-map
 * 
 * Stores confirmed image mappings into image_map table.
 */
export async function PUT(
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

    // Parse request body
    const body: { mappings: ImageMapping[] } = await request.json();
    const { mappings } = body;

    if (!Array.isArray(mappings)) {
      return NextResponse.json(
        { error: 'mappings must be an array' },
        { status: 400 }
      );
    }

    // Delete existing mappings for this batch (optional - you might want to merge instead)
    // For now, we'll upsert based on provider_sku + url combination

    // Prepare mappings for insert/update
    const imageMappings = mappings.map((mapping) => ({
      batch_id: id,
      provider_sku: mapping.providerSku,
      url: mapping.url,
      is_primary: mapping.isPrimary || false,
      sort: mapping.sort || 1,
    }));

    // Upsert mappings
    // Since we don't have a unique constraint on (batch_id, provider_sku, url),
    // we'll delete existing and insert new for simplicity
    // In production, you might want to add a unique constraint and use upsert

    // Delete existing mappings for the provided SKUs
    const providerSkus = [...new Set(mappings.map((m) => m.providerSku))];
    
    if (providerSkus.length > 0) {
      await supabase
        .from('image_map')
        .delete()
        .eq('batch_id', id)
        .in('provider_sku', providerSkus);
    }

    // Insert new mappings
    if (imageMappings.length > 0) {
      const { error: insertError } = await supabase
        .from('image_map')
        .insert(imageMappings);

      if (insertError) {
        console.error('Error inserting image mappings:', insertError);
        return NextResponse.json(
          { error: 'Failed to save image mappings' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      mappingsSaved: imageMappings.length,
    });
  } catch (error) {
    console.error('Error in PUT /api/imports/[id]/image-map:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

