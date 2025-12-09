'use client'

import Link from 'next/link'
import AuthButton from '@/components/auth/AuthButton'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    
    const checkAdminStatus = async (userId: string) => {
      if (!mounted) return
      
      try {
        const response = await fetch('/api/check-admin')
        
        if (!response.ok) {
          setIsAdmin(false)
          return
        }
        
        const data = await response.json()
        
        if (!mounted) return
        
        setIsAdmin(data.isAdmin === true)
      } catch (error) {
        if (!mounted) return
        setIsAdmin(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (currentUser) {
        await checkAdminStatus(currentUser.id)
      } else {
        setIsAdmin(false)
      }
    })

    supabase.auth.getUser()
      .then(async ({ data: { user }, error }) => {
        if (!mounted) return
        
        if (error && error.name !== 'AuthSessionMissingError') {
          console.error('Error getting user:', error)
        }
        
        setUser(user)
        if (user) {
          await checkAdminStatus(user.id)
        } else {
          setIsAdmin(false)
        }
      })
      .catch((error) => {
        if (!mounted) return
        if (error?.name !== 'AuthSessionMissingError') {
          console.error('Error getting user:', error)
        }
        setUser(null)
        setIsAdmin(false)
      })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <span className="text-2xl font-bold text-primary group-hover:text-[var(--color-primary-700)] transition-colors">
                MotoParts
              </span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 rounded-lg transition-all hover:text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)]"
              >
                Productos
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 rounded-lg transition-all hover:text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)]"
              >
                Categorías
              </Link>
              {user && (
                <Link
                  href="/cart"
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 rounded-lg transition-all hover:text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)]"
                >
                  Carrito
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <AuthButton isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </nav>
  )
}

