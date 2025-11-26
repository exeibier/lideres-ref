import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Get file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    const validExtensions = ['.xlsx', '.xls']
    const isValidType = validTypes.includes(file.type) || 
                       validExtensions.some(ext => file.name.endsWith(ext))

    if (!isValidType) {
      return NextResponse.json({ 
        error: 'Tipo de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls)' 
      }, { status: 400 })
    }

    // Convert file to base64 or buffer for n8n
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64File = buffer.toString('base64')

    // TODO: Trigger n8n automation
    // For now, we'll create a placeholder that will be replaced when n8n is configured
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_BULK_UPLOAD

    if (!n8nWebhookUrl) {
      // If n8n is not configured, return an error
      return NextResponse.json({ 
        error: 'n8n webhook no configurado. Por favor, configura N8N_WEBHOOK_BULK_UPLOAD en las variables de entorno.',
        note: 'Esta funcionalidad requiere la configuración de n8n para procesar el archivo Excel.'
      }, { status: 503 })
    }

    // Call n8n webhook
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64File,
        filename: file.name,
        fileType: file.type,
        uploadedBy: user.id,
      }),
    })

    if (!n8nResponse.ok) {
      return NextResponse.json({ 
        error: 'Error al procesar el archivo en n8n',
        details: await n8nResponse.text()
      }, { status: 500 })
    }

    const n8nData = await n8nResponse.json()

    // n8n should return normalized products data
    // Expected format: { products: [...], errors: [...] }
    if (!n8nData.products || !Array.isArray(n8nData.products)) {
      return NextResponse.json({ 
        error: 'Formato de respuesta inválido de n8n',
        details: 'Se esperaba un array de productos en la respuesta'
      }, { status: 500 })
    }

    // Insert products into database
    const productsToInsert = n8nData.products.map((product: any) => {
      // Generate slug from name if not provided
      const slug = product.slug || product.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      return {
        name: product.name,
        slug: slug,
        description: product.description || null,
        sku: product.sku || null,
        part_number: product.part_number || null,
        price: parseFloat(product.price) || 0,
        compare_at_price: product.compare_at_price ? parseFloat(product.compare_at_price) : null,
        brand: product.brand || null,
        motorcycle_brand: product.motorcycle_brand || null,
        motorcycle_model: product.motorcycle_model || null,
        compatibility: product.compatibility ? (Array.isArray(product.compatibility) ? product.compatibility : [product.compatibility]) : null,
        images: product.images ? (Array.isArray(product.images) ? product.images : [product.images]) : null,
        category_id: product.category_id || null,
        status: 'active',
        featured: product.featured || false,
      }
    })

    // Get category mappings if needed
    if (n8nData.products.some((p: any) => p.category && !p.category_id)) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, slug')

      const categoryMap = new Map()
      categories?.forEach(cat => {
        categoryMap.set(cat.name.toLowerCase(), cat.id)
        categoryMap.set(cat.slug.toLowerCase(), cat.id)
      })

      productsToInsert.forEach((product: any, index: number) => {
        const originalProduct = n8nData.products[index]
        if (originalProduct.category && !product.category_id) {
          const categoryId = categoryMap.get(originalProduct.category.toLowerCase())
          if (categoryId) {
            product.category_id = categoryId
          }
        }
      })
    }

    // Insert products in batches
    const batchSize = 100
    let productsCreated = 0
    const errors: string[] = []

    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize)
      const { data, error } = await supabase
        .from('products')
        .insert(batch)
        .select()

      if (error) {
        errors.push(`Error en lote ${Math.floor(i / batchSize) + 1}: ${error.message}`)
      } else {
        productsCreated += data?.length || 0
      }
    }

    // Add n8n errors if any
    if (n8nData.errors && Array.isArray(n8nData.errors)) {
      errors.push(...n8nData.errors)
    }

    return NextResponse.json({
      message: `Procesamiento completado. ${productsCreated} productos creados.`,
      productsCreated,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Error en bulk upload:', error)
    return NextResponse.json({ 
      error: 'Error al procesar el archivo',
      details: error.message 
    }, { status: 500 })
  }
}

