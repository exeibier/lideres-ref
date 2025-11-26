'use client'

export default function LogoutButton() {
  const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Use server-side logout route - it handles cookies properly and redirects
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/auth/logout'
    document.body.appendChild(form)
    form.submit()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
    >
      Cerrar sesión
    </button>
  )
}

