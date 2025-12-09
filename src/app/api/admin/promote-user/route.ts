import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to promote a user to admin role
 * 
 * This endpoint requires:
 * 1. A secret key in the request header (X-Admin-Secret-Key)
 * 2. The secret must match ADMIN_PROMOTION_SECRET in environment variables
 * 3. The user email in the request body
 * 
 * Usage:
 * POST /api/admin/promote-user
 * Headers: { "X-Admin-Secret-Key": "your-secret-key" }
 * Body: { "email": "user@example.com" }
 */
export async function POST(request: NextRequest) {
  try {
    // Check for secret key
    const secretKey = request.headers.get('X-Admin-Secret-Key')
    const requiredSecret = process.env.ADMIN_PROMOTION_SECRET

    if (!requiredSecret) {
      return NextResponse.json(
        { error: 'Admin promotion secret not configured. Please set ADMIN_PROMOTION_SECRET in your environment variables.' },
        { status: 500 }
      )
    }

    if (secretKey !== requiredSecret) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid secret key.' },
        { status: 401 }
      )
    }

    // Get email from request body
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Find user by email - try admin API first, fallback to direct query
    let userId: string | null = null

    try {
      // Method 1: Use admin API to find user
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (!authError && authUsers) {
        const user = authUsers.users.find(u => u.email === email)
        if (user) {
          userId = user.id
        }
      }
    } catch (error) {
      // If admin API fails, try direct query
      console.warn('Admin API failed, trying direct query:', error)
    }

    // Method 2: Direct query to user_profiles (fallback)
    if (!userId) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profileError || !profile) {
        return NextResponse.json(
          { error: `User with email ${email} not found` },
          { status: 404 }
        )
      }

      userId = profile.id
    }

    // Update user profile role to admin
    const { data: profile, error: updateError } = await supabase
      .from('user_profiles')
      .update({ role: 'admin' })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update user role', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} has been promoted to admin`,
      user: {
        id: userId,
        email: email,
        role: profile.role,
      },
    })
  } catch (error) {
    console.error('Error promoting user to admin:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

