import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ product })
  } catch (error: any) {
    console.error('Error in GET /api/admin/products/[id]:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      status,
      featured,
    } = body

    // Validate required fields if provided
    if (name !== undefined && !name) {
      return NextResponse.json(
        { error: 'El nombre no puede estar vacío' },
        { status: 400 }
      )
    }

    if (price !== undefined && (!price || parseFloat(price) <= 0)) {
      return NextResponse.json(
        { error: 'El precio debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) {
      updateData.name = name
      // Generate slug from name if name is being updated
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Check if slug already exists for another product
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single()

      if (existingProduct) {
        return NextResponse.json(
          { error: 'Ya existe un producto con un nombre similar' },
          { status: 400 }
        )
      }

      updateData.slug = slug
    }

    if (description !== undefined) updateData.description = description || null
    if (sku !== undefined) updateData.sku = sku || null
    if (part_number !== undefined) updateData.part_number = part_number || null
    if (price !== undefined) updateData.price = parseFloat(price)
    if (compare_at_price !== undefined) {
      updateData.compare_at_price = compare_at_price ? parseFloat(compare_at_price) : null
    }
    if (category_id !== undefined) updateData.category_id = category_id || null
    if (brand !== undefined) updateData.brand = brand || null
    if (motorcycle_brand !== undefined) updateData.motorcycle_brand = motorcycle_brand || null
    if (motorcycle_model !== undefined) updateData.motorcycle_model = motorcycle_model || null
    if (compatibility !== undefined) {
      updateData.compatibility = compatibility && Array.isArray(compatibility) ? compatibility : null
    }
    if (images !== undefined) {
      updateData.images = images && Array.isArray(images) ? images : null
    }
    if (status !== undefined) updateData.status = status
    if (featured !== undefined) updateData.featured = featured

    // Update product
    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return NextResponse.json(
        { error: 'Error al actualizar el producto', details: error.message },
        { status: 500 }
      )
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ product })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/products/[id]:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', details: error.message },
      { status: 500 }
    )
  }
}

