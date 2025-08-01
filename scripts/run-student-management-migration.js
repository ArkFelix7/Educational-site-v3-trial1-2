const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting student management schema migration...');

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'update-student-management-schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        // Continue with other statements
      }
    }

    console.log('🎉 Migration completed!');
    
    // Verify the migration
    console.log('🔍 Verifying migration...');
    
    // Check if password_resets table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'password_resets');
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else if (tables && tables.length > 0) {
      console.log('✅ password_resets table created successfully');
    } else {
      console.log('⚠️  password_resets table not found');
    }

    // Check student_invitations table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'student_invitations')
      .in('column_name', ['invitation_type', 'expires_at']);
    
    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
    } else {
      console.log(`✅ Found ${columns?.length || 0} new columns in student_invitations table`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative approach using direct SQL execution
async function runMigrationDirect() {
  try {
    console.log('🚀 Starting direct SQL migration...');

    // Execute SQL statements one by one
    const statements = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id TEXT',
      
      `CREATE TABLE IF NOT EXISTS password_resets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        reset_token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      
      'CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(reset_token)',
      'CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email)',
      'CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at)',
      
      'ALTER TABLE student_invitations ADD COLUMN IF NOT EXISTS invitation_type TEXT DEFAULT \'registration\'',
      'ALTER TABLE student_invitations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ',
      
      `UPDATE student_invitations 
       SET invitation_type = CASE 
         WHEN is_password_reset = true THEN 'password_reset'
         ELSE 'registration'
       END
       WHERE invitation_type IS NULL`,
       
      `UPDATE student_invitations 
       SET expires_at = created_at + INTERVAL '30 days'
       WHERE expires_at IS NULL`,
       
      `UPDATE users 
       SET student_id = COALESCE(student_id, 'STU' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 6, '0'))
       WHERE role = 'student' AND (student_id IS NULL OR student_id = '')`
    ];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.log(`⚠️  Statement ${i + 1} result:`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} exception:`, err.message);
      }
    }

    console.log('🎉 Direct migration completed!');

  } catch (error) {
    console.error('❌ Direct migration failed:', error);
  }
}

// Run the migration
if (require.main === module) {
  runMigrationDirect()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration, runMigrationDirect };