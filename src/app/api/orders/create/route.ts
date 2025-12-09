import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// This API route handles order creation and n8n webhook trigger
// Called from the checkout form

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { shippingAddressId, shippingAddress, notes } = body

    // Get cart items
    const { data: cartItems } = await supabase
      .from('cart')
      .select(`
        id,
        quantity,
        products (
          id,
          name,
          price,
          sku
        )
      `)
      .eq('user_id', user.id)

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products
      return sum + (product.price * item.quantity)
    }, 0)
    const shippingCost = 0
    const total = subtotal + shippingCost

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        shipping_address_id: shippingAddressId,
        shipping_address: shippingAddress,
        subtotal,
        shipping_cost: shippingCost,
        total,
        notes: notes || null,
        status: 'pending',
        n8n_webhook_triggered: false,
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ 
        error: 'Error al crear el pedido',
        details: orderError.message 
      }, { status: 500 })
    }

    // Create order items
    const orderItems = cartItems.map(item => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products
      return {
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: item.quantity,
        price: product.price,
      }
    })

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      return NextResponse.json({ 
        error: 'Error al crear los items del pedido',
        details: itemsError.message 
      }, { status: 500 })
    }

    // Clear cart
    await supabase
      .from('cart')
      .delete()
      .eq('user_id', user.id)

    // Trigger n8n webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_ORDER_CREATION
    if (n8nWebhookUrl) {
      try {
        await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: order.id,
            orderNumber: order.order_number,
            userId: user.id,
            total: order.total,
            status: order.status,
            shippingAddress: shippingAddress,
            orderItems: orderItems,
          }),
        })
        
        // Mark as triggered
        await supabase
          .from('orders')
          .update({ n8n_webhook_triggered: true })
          .eq('id', order.id)
      } catch (error) {
        console.error('Error al llamar webhook de n8n:', error)
        // Continue even if webhook fails
      }
    } else {
      // Mark as triggered even if webhook is not configured
      await supabase
        .from('orders')
        .update({ n8n_webhook_triggered: true })
        .eq('id', order.id)
    }

    return NextResponse.json({ 
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
    })
  } catch (error: any) {
    console.error('Error en creación de pedido:', error)
    return NextResponse.json({ 
      error: 'Error al procesar el pedido',
      details: error.message 
    }, { status: 500 })
  }
}

