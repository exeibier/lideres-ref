import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const maintenanceModeEnabled = process.env.MAINTENANCE_MODE_ENABLED === 'true'
  const maintenanceCookie = request.cookies.get('maintenance_access')
  const hasMaintenanceAccess = maintenanceCookie && maintenanceCookie.value === 'granted'
  
  return NextResponse.json({ 
    enabled: maintenanceModeEnabled,
    hasAccess: hasMaintenanceAccess
  })
}

