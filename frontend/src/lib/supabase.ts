/**
 * Supabase Client Configuration
 * 配置 Supabase 客户端
 */

import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
