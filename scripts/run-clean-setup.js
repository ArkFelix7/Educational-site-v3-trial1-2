const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runCleanSetup() {
  try {
    console.log('🧹 Cleaning up database...');

    // Drop existing tables
    await supabase.rpc('exec', { sql: 'DROP TABLE IF EXISTS student_invitations CASCADE' });
    await supabase.rpc('exec', { sql: 'DROP TABLE IF EXISTS users CASCADE' });

    // Create users table
    await supabase.rpc('exec', { 
      sql: `CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auth_id UUID UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
    });

    // Create student_invitations table
    await supabase.rpc('exec', { 
      sql: `CREATE TABLE student_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        invite_code TEXT UNIQUE NOT NULL,
        student_id TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        is_used BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
    });

    // Insert admin user
    await supabase.rpc('exec', { 
      sql: `INSERT INTO users (auth_id, email, full_name, role) VALUES
        ('00000000-0000-0000-0000-000000000000', 'careerexp@admin.com', 'Admin Teacher', 'admin')`
    });

    console.log('✅ Database setup complete!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    
    // Alternative approach - direct table operations
    console.log('🔄 Trying alternative approach...');
    
    try {
      // Delete all data first
      await supabase.from('student_invitations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      console.log('✅ Tables cleared successfully!');
      console.log('ℹ️  You may need to manually update table structure in Supabase dashboard');
      
    } catch (altError) {
      console.error('❌ Alternative approach failed:', altError);
    }
  }
}

runCleanSetup();