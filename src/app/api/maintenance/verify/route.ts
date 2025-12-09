import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    const maintenancePassword = process.env.MAINTENANCE_PASSWORD
    const maintenanceModeEnabled = process.env.MAINTENANCE_MODE_ENABLED === 'true'

    // If maintenance mode is not enabled, allow access
    if (!maintenanceModeEnabled) {
      return NextResponse.json({ 
        success: true,
        message: 'Maintenance mode is not enabled'
      })
    }

    // If no password is configured, deny access
    if (!maintenancePassword) {
      return NextResponse.json({ 
        error: 'Maintenance mode is enabled but no password is configured'
      }, { status: 500 })
    }

    // Verify password
    if (password !== maintenancePassword) {
      return NextResponse.json({ 
        error: 'Contraseña incorrecta'
      }, { status: 401 })
    }

    // Create response with success
    const response = NextResponse.json({ 
      success: true,
      message: 'Password verified'
    })

    // Set maintenance access cookie (expires in 24 hours)
    response.cookies.set('maintenance_access', 'granted', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Error verifying maintenance password:', error)
    return NextResponse.json({ 
      error: 'Error al verificar la contraseña'
    }, { status: 500 })
  }
}

