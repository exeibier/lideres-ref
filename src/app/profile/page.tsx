import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/profile/ProfileForm'
import ShippingAddresses from '@/components/profile/ShippingAddresses'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login?redirect=/profile')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: addresses } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi perfil</h1>
      
      <div className="space-y-8">
        <ProfileForm 
          user={user} 
          profile={profile || {
            id: user.id,
            email: user.email || '',
            full_name: '',
            phone: '',
            role: 'customer',
          }} 
        />
        
        <ShippingAddresses addresses={addresses || []} />
      </div>
    </div>
  )
}

