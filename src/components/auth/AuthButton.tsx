'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import LogoutButton from './LogoutButton'

export default function AuthButton() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/profile"
          className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
        >
          Perfil
        </Link>
        <LogoutButton />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/auth/login"
        className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
      >
        Iniciar sesión
      </Link>
      <Link
        href="/auth/signup"
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
      >
        Registrarse
      </Link>
    </div>
  )
}

