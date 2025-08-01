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

async function testEnhancedStudentSystem() {
  console.log('🧪 Testing Enhanced Student Management System...\n');

  try {
    // Test 1: Check current data state
    console.log('📊 Current System State:');
    console.log('========================');

    const { data: invitations, error: invError } = await supabase
      .from('student_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (invError) {
      console.error('Error fetching invitations:', invError);
    } else {
      console.log(`📝 Total invitations: ${invitations?.length || 0}`);
      
      const regularInvitations = invitations?.filter(inv => !inv.is_password_reset) || [];
      const passwordResets = invitations?.filter(inv => inv.is_password_reset) || [];
      const pendingInvitations = regularInvitations.filter(inv => !inv.is_registered);
      const usedInvitations = regularInvitations.filter(inv => inv.is_registered);
      const activeResets = passwordResets.filter(inv => !inv.is_registered);
      const usedResets = passwordResets.filter(inv => inv.is_registered);

      console.log(`   📋 Regular invitations: ${regularInvitations.length}`);
      console.log(`      ⏳ Pending: ${pendingInvitations.length}`);
      console.log(`      ✅ Used: ${usedInvitations.length}`);
      console.log(`   🔑 Password resets: ${passwordResets.length}`);
      console.log(`      ⏳ Active: ${activeResets.length}`);
      console.log(`      ✅ Used: ${usedResets.length}`);

      // Show details of pending invitations
      if (pendingInvitations.length > 0) {
        console.log('\n📋 Pending Invitations:');
        pendingInvitations.forEach((inv, index) => {
          console.log(`   ${index + 1}. ${inv.full_name} (${inv.email}) - Code: ${inv.invite_code}`);
        });
      }

      // Show details of active password resets
      if (activeResets.length > 0) {
        console.log('\n🔑 Active Password Resets:');
        activeResets.forEach((reset, index) => {
          console.log(`   ${index + 1}. ${reset.full_name} (${reset.email}) - Token: ${reset.invite_code}`);
        });
      }
    }

    // Test 2: Check registered students
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
    } else {
      console.log(`\n👥 Registered students: ${students?.length || 0}`);
      students?.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.full_name} (${student.email}) - ID: ${student.student_id || 'N/A'}`);
      });
    }

    // Test 3: Validate data integrity
    console.log('\n🔍 Data Integrity Check:');
    console.log('=======================');

    // Check for duplicate invite codes
    const codes = invitations?.map(inv => inv.invite_code) || [];
    const duplicateCodes = codes.filter((code, index) => codes.indexOf(code) !== index);
    
    if (duplicateCodes.length > 0) {
      console.log('❌ Found duplicate invite codes:', duplicateCodes);
    } else {
      console.log('✅ All invite codes are unique');
    }

    // Check for duplicate emails in pending invitations
    const pendingEmails = invitations?.filter(inv => !inv.is_registered).map(inv => inv.email) || [];
    const duplicateEmails = pendingEmails.filter((email, index) => pendingEmails.indexOf(email) !== index);
    
    if (duplicateEmails.length > 0) {
      console.log('❌ Found duplicate emails in pending invitations:', duplicateEmails);
    } else {
      console.log('✅ No duplicate emails in pending invitations');
    }

    // Check for orphaned invitations (registered but no user account)
    const registeredInvitations = invitations?.filter(inv => inv.is_registered && !inv.is_password_reset) || [];
    const studentEmails = students?.map(s => s.email) || [];
    const orphanedInvitations = registeredInvitations.filter(inv => !studentEmails.includes(inv.email));
    
    if (orphanedInvitations.length > 0) {
      console.log('⚠️  Found orphaned invitations (registered but no user account):');
      orphanedInvitations.forEach(inv => {
        console.log(`   - ${inv.full_name} (${inv.email})`);
      });
    } else {
      console.log('✅ No orphaned invitations found');
    }

    // Test 4: System Health Summary
    console.log('\n📈 System Health Summary:');
    console.log('=========================');
    
    const totalInvitations = invitations?.length || 0;
    const totalStudents = students?.length || 0;
    const regularInvitations = invitations?.filter(inv => !inv.is_password_reset) || [];
    const passwordResets = invitations?.filter(inv => inv.is_password_reset) || [];
    const pendingInvitations = regularInvitations.filter(inv => !inv.is_registered);
    const activeResets = passwordResets.filter(inv => !inv.is_registered);
    const pendingCount = pendingInvitations.length;
    const resetCount = activeResets.length;
    
    console.log(`📊 Total system activity: ${totalInvitations + totalStudents} records`);
    console.log(`📝 Invitation success rate: ${totalStudents > 0 ? Math.round((totalStudents / (totalStudents + pendingCount)) * 100) : 0}%`);
    console.log(`⏳ Pending actions: ${pendingCount + resetCount}`);
    console.log(`✅ System status: ${duplicateCodes.length === 0 && duplicateEmails.length === 0 ? 'HEALTHY' : 'NEEDS ATTENTION'}`);

    // Test 5: Recommendations
    console.log('\n💡 Recommendations:');
    console.log('===================');
    
    if (activeResets.length > 0) {
      console.log('🔑 You have active password reset requests that need attention');
    }
    
    if (pendingInvitations.length > 0) {
      console.log('📋 You have pending invitations waiting for student registration');
    }
    
    if (orphanedInvitations.length > 0) {
      console.log('🧹 Consider cleaning up orphaned invitations');
    }
    
    if (duplicateCodes.length > 0 || duplicateEmails.length > 0) {
      console.log('⚠️  Data integrity issues found - please review and clean up');
    }
    
    if (pendingCount === 0 && resetCount === 0) {
      console.log('✨ System is clean - no pending actions required');
    }

    console.log('\n🎉 Enhanced Student Management System Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testEnhancedStudentSystem()
    .then(() => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testEnhancedStudentSystem };