import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdapter } from '@/lib/adapters';
import { computeRowHash, batchArray } from '@/lib/utils/import';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const BATCH_SIZE = 400;

interface ImportRequest {
  providerCode: 'motos_y_equipos' | 'mrm';
  fileUrl: string;
  uploadThingFiles?: Array<{
    fileName: string;
    url: string;
    sha256?: string;
  }>;
}

/**
 * POST /api/imports
 * 
 * Creates an import batch, downloads and parses the file,
 * normalizes data using the adapter, and stages items.
 */
export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    const body: ImportRequest = await request.json();
    const { providerCode, fileUrl, uploadThingFiles } = body;

    if (!providerCode || !fileUrl) {
      return NextResponse.json(
        { error: 'providerCode and fileUrl are required' },
        { status: 400 }
      );
    }

    // Validate provider code
    if (providerCode !== 'motos_y_equipos' && providerCode !== 'mrm') {
      return NextResponse.json(
        { error: 'Invalid provider code' },
        { status: 400 }
      );
    }

    // Create import batch
    const { data: batch, error: batchError } = await supabase
      .from('import_batch')
      .insert({
        provider_code: providerCode,
        status: 'uploaded',
        created_by: user.id,
      })
      .select()
      .single();

    if (batchError || !batch) {
      console.error('Error creating batch:', batchError);
      return NextResponse.json(
        { error: 'Failed to create import batch' },
        { status: 500 }
      );
    }

    // Download file
    let fileContent: Buffer;
    let fileType: 'csv' | 'xlsx';

    try {
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to download file: ${fileResponse.statusText}`);
      }
      fileContent = Buffer.from(await fileResponse.arrayBuffer());
      
      // Determine file type from URL or content
      if (fileUrl.toLowerCase().endsWith('.csv')) {
        fileType = 'csv';
      } else if (fileUrl.toLowerCase().endsWith('.xlsx') || fileUrl.toLowerCase().endsWith('.xls')) {
        fileType = 'xlsx';
      } else {
        // Try to detect from content
        const firstBytes = fileContent.subarray(0, 4);
        if (firstBytes[0] === 0x50 && firstBytes[1] === 0x4B) {
          // ZIP signature (XLSX)
          fileType = 'xlsx';
        } else {
          fileType = 'csv';
        }
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      await supabase
        .from('import_batch')
        .update({ status: 'failed' })
        .eq('id', batch.id);
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      );
    }

    // Parse file
    const adapter = getAdapter(providerCode);
    const stagedItems: Array<{ item: any; rowIndex: number }> = [];

    try {
      if (fileType === 'csv') {
        // Parse CSV
        const csvText = fileContent.toString('utf-8');
        const parseResult = Papa.parse<Record<string, string>>(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
        });

        parseResult.data.forEach((row, index) => {
          const staged = adapter.parseRow(row, index);
          if (staged) {
            stagedItems.push({ item: staged, rowIndex: index });
          }
        });
      } else {
        // Parse XLSX
        const workbook = XLSX.read(fileContent, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // For MRM, skip first 7 rows (data starts at row 8)
        const skipRows = providerCode === 'mrm' ? 7 : 0;
        
        // Convert to JSON, skipping header rows
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          defval: '',
          raw: false,
        });

        // Skip the specified number of rows
        const dataRows = rows.slice(skipRows);

        dataRows.forEach((row, index) => {
          const staged = adapter.parseRow(row, index + skipRows);
          if (staged) {
            stagedItems.push({ item: staged, rowIndex: index + skipRows });
          }
        });
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      await supabase
        .from('import_batch')
        .update({ status: 'failed' })
        .eq('id', batch.id);
      return NextResponse.json(
        { error: 'Failed to parse file' },
        { status: 500 }
      );
    }

    if (stagedItems.length === 0) {
      await supabase
        .from('import_batch')
        .update({ status: 'failed' })
        .eq('id', batch.id);
      return NextResponse.json(
        { error: 'No valid rows found in file' },
        { status: 400 }
      );
    }

    // Validate and insert import items
    const importItems: Array<{
      batch_id: string;
      provider_sku: string;
      staged_json: any;
      stage: string;
      error_text: string | null;
      row_hash: string;
    }> = [];

    for (const { item, rowIndex } of stagedItems) {
      const validation = adapter.validateRow(item);
      const rowHash = computeRowHash(item);

      importItems.push({
        batch_id: batch.id,
        provider_sku: item.providerSku,
        staged_json: item,
        stage: validation.valid ? 'staged' : 'failed',
        error_text: validation.errors.length > 0 ? validation.errors.join('; ') : null,
        row_hash: rowHash,
      });
    }

    // Batch insert import items
    const batches = batchArray(importItems, BATCH_SIZE);
    for (const batchItems of batches) {
      const { error } = await supabase
        .from('import_item')
        .insert(batchItems);

      if (error) {
        console.error('Error inserting import items:', error);
        await supabase
          .from('import_batch')
          .update({ status: 'failed' })
          .eq('id', batch.id);
        return NextResponse.json(
          { error: 'Failed to insert import items' },
          { status: 500 }
        );
      }
    }

    // Insert image mappings if provided
    if (uploadThingFiles && uploadThingFiles.length > 0) {
      const imageMappings = uploadThingFiles.map((file) => ({
        batch_id: batch.id,
        provider_sku: '', // Will be mapped later
        uploadthing_filename: file.fileName,
        url: file.url,
      }));

      const imageBatches = batchArray(imageMappings, BATCH_SIZE);
      for (const imageBatch of imageBatches) {
        const { error } = await supabase
          .from('image_map')
          .insert(imageBatch);

        if (error) {
          console.error('Error inserting image mappings:', error);
          // Don't fail the whole import, just log the error
        }
      }
    }

    // Update batch status
    const validCount = importItems.filter((item) => item.stage === 'staged').length;
    const failedCount = importItems.filter((item) => item.stage === 'failed').length;

    await supabase
      .from('import_batch')
      .update({
        status: failedCount === importItems.length ? 'failed' : 'staged',
      })
      .eq('id', batch.id);

    return NextResponse.json({
      batchId: batch.id,
      totalRows: stagedItems.length,
      validRows: validCount,
      failedRows: failedCount,
      status: failedCount === importItems.length ? 'failed' : 'staged',
    });
  } catch (error) {
    console.error('Error in POST /api/imports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

