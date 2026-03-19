import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mqwwswunwtutgwwlsonh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xd3dzd3Vud3R1dGd3d2xzb25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDc1NTEsImV4cCI6MjA4OTQyMzU1MX0.Y0EMIHfI9KMzF4nGCJtXMx3Q0eU5VZuIl5Of2QdKTRw'

export const supabase = createClient(supabaseUrl, supabaseKey)