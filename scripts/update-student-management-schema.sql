-- Update student management schema for better password reset handling

-- First, add student_id column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id TEXT;

-- Create password_resets table for better tracking
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reset_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(reset_token);
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);

-- Update student_invitations table structure
ALTER TABLE student_invitations ADD COLUMN IF NOT EXISTS invitation_type TEXT DEFAULT 'registration';
ALTER TABLE student_invitations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Update existing records to set proper invitation type
UPDATE student_invitations 
SET invitation_type = CASE 
  WHEN is_password_reset = true THEN 'password_reset'
  ELSE 'registration'
END
WHERE invitation_type IS NULL;

-- Set expiration for existing invitations (30 days from creation)
UPDATE student_invitations 
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL;

-- Add constraint to ensure invitation_type is valid
ALTER TABLE student_invitations 
ADD CONSTRAINT check_invitation_type 
CHECK (invitation_type IN ('registration', 'password_reset'));

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  -- Clean up expired password resets
  DELETE FROM password_resets 
  WHERE expires_at < NOW() AND used_at IS NULL;
  
  -- Clean up expired invitations
  DELETE FROM student_invitations 
  WHERE expires_at < NOW() AND is_registered = false;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-tokens', '0 2 * * *', 'SELECT cleanup_expired_tokens();');

-- Add some useful views
CREATE OR REPLACE VIEW active_student_invitations AS
SELECT 
  id,
  email,
  invite_code,
  student_id,
  full_name,
  is_registered,
  invitation_type,
  expires_at,
  created_at,
  CASE 
    WHEN expires_at < NOW() THEN 'expired'
    WHEN is_registered = true THEN 'used'
    ELSE 'active'
  END as status
FROM student_invitations
WHERE invitation_type = 'registration';

CREATE OR REPLACE VIEW active_password_resets AS
SELECT 
  pr.id,
  pr.email,
  pr.reset_token,
  pr.expires_at,
  pr.used_at,
  pr.created_at,
  u.full_name,
  u.student_id,
  CASE 
    WHEN pr.used_at IS NOT NULL THEN 'used'
    WHEN pr.expires_at < NOW() THEN 'expired'
    ELSE 'active'
  END as status
FROM password_resets pr
JOIN users u ON pr.user_id = u.id;

-- Update users table to ensure student_id is properly set
UPDATE users 
SET student_id = COALESCE(student_id, 'STU' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 6, '0'))
WHERE role = 'student' AND (student_id IS NULL OR student_id = '');