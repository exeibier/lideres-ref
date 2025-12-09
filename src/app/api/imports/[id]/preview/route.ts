import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/imports/:id/preview
 * 
 * Returns preview information about a staged import batch:
 * - Total staged rows
 * - Error counts
 * - Sample of failed rows with error_text
 */
export async function GET(
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

    // Get import items statistics
    const { data: items, error: itemsError } = await supabase
      .from('import_item')
      .select('stage, error_text, provider_sku, staged_json')
      .eq('batch_id', id);

    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch import items' },
        { status: 500 }
      );
    }

    const totalRows = items?.length || 0;
    const validRows = items?.filter((item) => item.stage === 'staged').length || 0;
    const failedRows = items?.filter((item) => item.stage === 'failed').length || 0;

    // Get sample of failed rows (limit to 20)
    const failedItems = items
      ?.filter((item) => item.stage === 'failed')
      .slice(0, 20)
      .map((item) => ({
        providerSku: item.provider_sku,
        name: (item.staged_json as any)?.name || 'N/A',
        errors: item.error_text ? item.error_text.split('; ') : [],
      })) || [];

    // Get sample of valid rows (limit to 10)
    const validItems = items
      ?.filter((item) => item.stage === 'staged')
      .slice(0, 10)
      .map((item) => ({
        providerSku: item.provider_sku,
        name: (item.staged_json as any)?.name || 'N/A',
        price: (item.staged_json as any)?.price || null,
        stock: (item.staged_json as any)?.stock || null,
      })) || [];

    return NextResponse.json({
      batch: {
        id: batch.id,
        providerCode: batch.provider_code,
        status: batch.status,
        createdAt: batch.created_at,
      },
      summary: {
        totalRows,
        validRows,
        failedRows,
      },
      samples: {
        valid: validItems,
        failed: failedItems,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/imports/[id]/preview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

