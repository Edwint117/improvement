import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jzgemdmxbjrshvvwytjs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Z2VtZG14Ympyc2h2dnd5dGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NjkwNzQsImV4cCI6MjA1OTQ0NTA3NH0.QzA7yKKzTX2_1pZm7DplWiDC6HYkXcA4vGXeVHnvtRs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 