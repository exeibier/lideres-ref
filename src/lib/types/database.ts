export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          phone: string | null
          role: 'customer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          sku: string | null
          part_number: string | null
          price: number
          compare_at_price: number | null
          category_id: string | null
          brand: string | null
          motorcycle_brand: string | null
          motorcycle_model: string | null
          compatibility: string[] | null
          images: string[] | null
          status: 'active' | 'inactive' | 'draft'
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          sku?: string | null
          part_number?: string | null
          price: number
          compare_at_price?: number | null
          category_id?: string | null
          brand?: string | null
          motorcycle_brand?: string | null
          motorcycle_model?: string | null
          compatibility?: string[] | null
          images?: string[] | null
          status?: 'active' | 'inactive' | 'draft'
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          sku?: string | null
          part_number?: string | null
          price?: number
          compare_at_price?: number | null
          category_id?: string | null
          brand?: string | null
          motorcycle_brand?: string | null
          motorcycle_model?: string | null
          compatibility?: string[] | null
          images?: string[] | null
          status?: 'active' | 'inactive' | 'draft'
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      cart: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      shipping_addresses: {
        Row: {
          id: string
          user_id: string
          full_name: string
          phone: string
          address_line1: string
          address_line2: string | null
          city: string
          state: string
          postal_code: string
          country: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          phone: string
          address_line1: string
          address_line2?: string | null
          city: string
          state: string
          postal_code: string
          country?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          phone?: string
          address_line1?: string
          address_line2?: string | null
          city?: string
          state?: string
          postal_code?: string
          country?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          order_number: string
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          shipping_address_id: string | null
          shipping_address: Json | null
          subtotal: number
          shipping_cost: number
          total: number
          notes: string | null
          n8n_webhook_triggered: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_number: string
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          shipping_address_id?: string | null
          shipping_address?: Json | null
          subtotal: number
          shipping_cost?: number
          total: number
          notes?: string | null
          n8n_webhook_triggered?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_number?: string
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          shipping_address_id?: string | null
          shipping_address?: Json | null
          subtotal?: number
          shipping_cost?: number
          total?: number
          notes?: string | null
          n8n_webhook_triggered?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_sku: string | null
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_sku?: string | null
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_sku?: string | null
          quantity?: number
          price?: number
          created_at?: string
        }
      }
    }
  }
}

