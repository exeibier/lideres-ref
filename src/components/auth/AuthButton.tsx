'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import LogoutButton from './LogoutButton'

interface AuthButtonProps {
  isAdmin?: boolean
}

export default function AuthButton({ isAdmin = false }: AuthButtonProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthButtons, setShowAuthButtons] = useState<boolean | null>(null) // null = not checked yet

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    // Check maintenance mode and cookie status
    const checkMaintenanceAccess = async () => {
      try {
        const response = await fetch('/api/maintenance/check', {
          cache: 'no-store' // Ensure fresh check on each load
        })
        if (!response.ok) {
          throw new Error('Failed to check maintenance mode')
        }
        const data = await response.json()
        
        if (mounted) {
          // If maintenance mode is enabled, check if user has access (cookie is set)
          if (data.enabled === true) {
            // Show buttons only if maintenance cookie is set (hasAccess)
            setShowAuthButtons(data.hasAccess === true)
          } else {
            // Maintenance mode is off, always show buttons
            setShowAuthButtons(true)
          }
        }
      } catch (error) {
        // If check fails, assume maintenance mode is off (fail open)
        console.warn('Could not check maintenance mode, assuming off:', error)
        if (mounted) {
          setShowAuthButtons(true)
        }
      }
    }

    checkMaintenanceAccess()
    
    // Also check on cookie changes (when maintenance password is entered)
    const checkCookieInterval = setInterval(() => {
      if (mounted) {
        checkMaintenanceAccess()
      }
    }, 1000) // Check every second

    // Function to update user state and stop loading
    const updateUserState = (user: any) => {
      if (!mounted) return
      setUser(user)
      setLoading(false)
    }

    // Set up auth state change listener FIRST (this fires immediately on mount if session exists)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateUserState(session?.user ?? null)
    })

    // Get initial user state - try both getUser and getSession for better compatibility
    Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession()
    ])
      .then(([userResult, sessionResult]) => {
        if (!mounted) return
        
        // Prefer user from getUser, fallback to session
        const user = userResult.data.user || sessionResult.data.session?.user
        
        // Only log non-session-missing errors
        if (userResult.error && userResult.error.name !== 'AuthSessionMissingError') {
          console.error('Error getting auth state:', userResult.error)
        }
        
        updateUserState(user)
      })
      .catch((error) => {
        if (!mounted) return
        // Don't log AuthSessionMissingError - it's expected when not logged in
        if (error?.name !== 'AuthSessionMissingError') {
          console.error('Error in auth check:', error)
        }
        updateUserState(null)
      })

    // Fallback timeout to prevent infinite loading (reduced to 2 seconds)
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('AuthButton: Loading timeout, showing default state')
        setLoading(false)
      }
    }, 2000)

    return () => {
      mounted = false
      clearTimeout(timeout)
      clearInterval(checkCookieInterval)
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  // Show a minimal loading state that matches the button size
  // Show loading if we're still checking user OR maintenance access
  if (loading || showAuthButtons === null) {
    return (
      <div className="flex items-center gap-4">
        <div className="h-8 w-16 bg-gray-100 animate-pulse rounded"></div>
        <div className="h-8 w-20 bg-gray-100 animate-pulse rounded"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {isAdmin && (
          <Link
            href="/admin"
            className="text-gray-700 hover:text-[var(--color-primary-600)] px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Admin
          </Link>
        )}
        <Link
          href="/profile"
          className="text-gray-700 hover:text-[var(--color-primary-600)] px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          Perfil
        </Link>
        <LogoutButton />
      </div>
    )
  }

  // Hide login/signup buttons if maintenance mode is on but cookie is not set
  if (showAuthButtons === false) {
    return null
  }

  // Show login/signup buttons (maintenance mode is off OR cookie is set)

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/auth/login"
        className="text-gray-700 hover:text-[var(--color-primary-600)] px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
      >
        Iniciar sesión
      </Link>
      <Link
        href="/auth/signup"
        className="bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 hover:shadow-md active:scale-[0.98]"
      >
        Registrarse
      </Link>
    </div>
  )
}

