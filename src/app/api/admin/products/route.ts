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

    const body = await request.json()
    const {
      name,
      description,
      sku,
      part_number,
      price,
      compare_at_price,
      category_id,
      brand,
      motorcycle_brand,
      motorcycle_model,
      compatibility,
      images,
      status = 'active',
      featured = false,
    } = body

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Nombre y precio son requeridos' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Ya existe un producto con un nombre similar' },
        { status: 400 }
      )
    }

    // Insert product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        description: description || null,
        sku: sku || null,
        part_number: part_number || null,
        price: parseFloat(price),
        compare_at_price: compare_at_price ? parseFloat(compare_at_price) : null,
        category_id: category_id || null,
        brand: brand || null,
        motorcycle_brand: motorcycle_brand || null,
        motorcycle_model: motorcycle_model || null,
        compatibility: compatibility && Array.isArray(compatibility) ? compatibility : null,
        images: images && Array.isArray(images) ? images : null,
        status: status || 'active',
        featured: featured || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json(
        { error: 'Error al crear el producto', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/admin/products:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', details: error.message },
      { status: 500 }
    )
  }
}


