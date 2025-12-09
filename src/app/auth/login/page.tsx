'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Listen for auth state changes and redirect when signed in
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Wait a bit to ensure cookies are persisted before redirecting
        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 300)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Verify we got a session
      if (!data.session) {
        setError('No se pudo crear la sesión. Por favor, intenta de nuevo.')
        setLoading(false)
        return
      }

      // Wait longer for cookies to be properly set and persisted
      // Supabase needs time to write cookies to the browser
      await new Promise(resolve => setTimeout(resolve, 500))

      // Verify session exists and is persisted
      const { data: { session: verifiedSession } } = await supabase.auth.getSession()
      if (!verifiedSession) {
        setError('No se pudo verificar la sesión. Por favor, intenta de nuevo.')
        setLoading(false)
        return
      }

      // Double-check that the session is actually persisted
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('No se pudo verificar el usuario. Por favor, intenta de nuevo.')
        setLoading(false)
        return
      }

      // Use router.push() instead of window.location to avoid hard reload
      // This preserves cookies and doesn't cause a full page reload
      router.push('/')
      router.refresh()
      
      // Note: We don't set loading to false here because we're navigating away
    } catch (err: any) {
      setError(err.message || 'Error inesperado al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Iniciar sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O{' '}
            <Link href="/auth/signup" className="font-semibold text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] transition-colors">
              crea una cuenta nueva
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6 bg-white rounded-xl p-8 shadow-sm border border-gray-200" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="text-sm font-medium text-red-800">{error}</div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] focus:border-[var(--color-primary-600)] sm:text-sm transition-all"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] focus:border-[var(--color-primary-600)] sm:text-sm transition-all"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/auth/forgot-password" className="font-semibold text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

