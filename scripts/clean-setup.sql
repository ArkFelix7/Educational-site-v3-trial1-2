-- Clean setup for student management system

-- Drop existing tables
DROP TABLE IF EXISTS student_invitations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table (profile data only)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL, -- Links to Supabase Auth user
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create student_invitations table
CREATE TABLE student_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  student_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert admin user
INSERT INTO users (auth_id, email, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000000', 'careerexp@admin.com', 'Admin Teacher', 'admin');