/**
 * Next.js 16 Proxy File
 * This file handles middleware functionality for Supabase authentication,
 * maintenance mode protection, and admin-only access control.
 * Note: Only this file should exist - no middleware.ts file should be present.
 */
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/uploadthing') ||
    pathname.startsWith('/api/orders/webhook') ||
    pathname.startsWith('/api/maintenance/verify') ||
    pathname.startsWith('/api/maintenance/check') ||
    pathname.startsWith('/api/check-admin') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next()
  }

  // Check maintenance mode
  const maintenanceModeEnabled = process.env.MAINTENANCE_MODE_ENABLED === 'true'
  const maintenancePassword = process.env.MAINTENANCE_PASSWORD

  // If maintenance mode is enabled, block all auth routes except maintenance page
  if (maintenanceModeEnabled && pathname.startsWith('/auth')) {
    // Allow maintenance page itself
    if (pathname === '/maintenance') {
      return NextResponse.next()
    }
    
    // Block signup completely in maintenance mode
    if (pathname.startsWith('/auth/signup')) {
      const url = request.nextUrl.clone()
      url.pathname = '/maintenance'
      return NextResponse.redirect(url)
    }
    
    // Block all other auth routes (login, etc.) - redirect to maintenance
    const url = request.nextUrl.clone()
    url.pathname = '/maintenance'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Maintenance mode: Check maintenance cookie for all routes
  if (maintenanceModeEnabled) {
    const maintenanceCookie = request.cookies.get('maintenance_access')
    
    // Allow maintenance page itself
    if (pathname === '/maintenance') {
      return NextResponse.next()
    }

    // Check if maintenance password is set
    if (!maintenancePassword) {
      console.warn('MAINTENANCE_MODE_ENABLED is true but MAINTENANCE_PASSWORD is not set')
      return NextResponse.next()
    }

    // If no valid maintenance cookie, redirect to maintenance page
    if (!maintenanceCookie || maintenanceCookie.value !== 'granted') {
      const url = request.nextUrl.clone()
      url.pathname = '/maintenance'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Admin-only protection for admin routes
  if (pathname.startsWith('/admin')) {
    // In maintenance mode, maintenance password is enough - skip login and admin checks
    if (maintenanceModeEnabled) {
      // Maintenance password grants full access - no login or admin check needed
      return updateSession(request)
    }

    // Normal mode: require authentication and admin role for admin routes
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // No-op for read-only check
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // If not authenticated, redirect to login
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Check if user is admin
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error || !profile || profile.role !== 'admin') {
        // Non-admin user - redirect to home
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error('Error checking admin status in proxy:', error)
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Continue with session update for all requests
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)',
  ],
}

// Default export for Next.js 16 proxy
export default proxy

