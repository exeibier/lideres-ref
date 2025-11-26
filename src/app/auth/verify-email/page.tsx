'use client'

import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Verifica tu email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Hemos enviado un enlace de verificación a tu correo electrónico.
            Por favor, revisa tu bandeja de entrada y haz clic en el enlace para verificar tu cuenta.
          </p>
        </div>
        <div>
          <Link
            href="/auth/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

