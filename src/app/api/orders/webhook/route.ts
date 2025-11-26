import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// This endpoint will be called by n8n after order creation
// For now, it's a placeholder that will be implemented when n8n is configured

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify webhook (you should add proper authentication here)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.N8N_WEBHOOK_SECRET

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, orderData } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId es requerido' }, { status: 400 })
    }

    // Update order to mark n8n webhook as triggered
    const { error } = await supabase
      .from('orders')
      .update({ 
        n8n_webhook_triggered: true,
        // You can store additional n8n response data here if needed
      })
      .eq('id', orderId)

    if (error) {
      return NextResponse.json({ 
        error: 'Error al actualizar el pedido',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Webhook procesado correctamente'
    })
  } catch (error: any) {
    console.error('Error en webhook de pedido:', error)
    return NextResponse.json({ 
      error: 'Error al procesar el webhook',
      details: error.message 
    }, { status: 500 })
  }
}

