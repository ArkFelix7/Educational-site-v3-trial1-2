const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSupabaseMigration() {
  try {
    console.log('🚀 Starting Supabase migration for student management...');

    // Step 1: Check current schema
    console.log('📋 Checking current schema...');
    
    // Check if student_id column exists in users table
    const { data: userColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .eq('column_name', 'student_id');
    
    console.log('Users table student_id column:', userColumns?.length > 0 ? 'EXISTS' : 'MISSING');

    // Check if password_resets table exists
    const { data: passwordResetTable } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'password_resets');
    
    console.log('Password resets table:', passwordResetTable?.length > 0 ? 'EXISTS' : 'MISSING');

    // Check student_invitations table columns
    const { data: invitationColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'student_invitations')
      .in('column_name', ['invitation_type', 'expires_at']);
    
    console.log('Student invitations new columns:', invitationColumns?.length || 0, 'of 2 found');

    // Step 2: Update existing data to fix the password reset issue
    console.log('🔧 Updating existing data...');
    
    // First, let's see what data we have
    const { data: invitations, error: invitationsError } = await supabase
      .from('student_invitations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
    } else {
      console.log(`Found ${invitations?.length || 0} invitations`);
      
      // Show current invitations
      invitations?.forEach((inv, index) => {
        console.log(`${index + 1}. ${inv.full_name} (${inv.email}) - Reset: ${inv.is_password_reset ? 'YES' : 'NO'}`);
      });
    }

    // Step 3: Clean up password reset entries that should not be in pending invitations
    console.log('🧹 Cleaning up password reset entries...');
    
    // Delete password reset entries that are already used or expired
    const { data: deletedResets, error: deleteError } = await supabase
      .from('student_invitations')
      .delete()
      .eq('is_password_reset', true)
      .eq('is_registered', true);
    
    if (deleteError) {
      console.error('Error deleting used password resets:', deleteError);
    } else {
      console.log('✅ Cleaned up used password reset entries');
    }

    // Step 4: Update users table to ensure all students have student_id
    console.log('👥 Updating student IDs...');
    
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: true });
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
    } else {
      console.log(`Found ${students?.length || 0} students`);
      
      // Update students without student_id
      for (let i = 0; i < (students?.length || 0); i++) {
        const student = students[i];
        if (!student.student_id) {
          const newStudentId = `STU${String(i + 1).padStart(6, '0')}`;
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ student_id: newStudentId })
            .eq('id', student.id);
          
          if (updateError) {
            console.error(`Error updating student ${student.email}:`, updateError);
          } else {
            console.log(`✅ Updated ${student.email} with student_id: ${newStudentId}`);
          }
        }
      }
    }

    console.log('🎉 Migration completed successfully!');
    
    // Step 5: Show final state
    console.log('📊 Final state:');
    
    const { data: finalInvitations } = await supabase
      .from('student_invitations')
      .select('*')
      .order('created_at', { ascending: false });
    
    const { data: finalStudents } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });
    
    console.log(`📝 Active invitations: ${finalInvitations?.filter(inv => !inv.is_registered && !inv.is_password_reset).length || 0}`);
    console.log(`🔄 Password reset requests: ${finalInvitations?.filter(inv => inv.is_password_reset && !inv.is_registered).length || 0}`);
    console.log(`👥 Registered students: ${finalStudents?.length || 0}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  runSupabaseMigration()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runSupabaseMigration };