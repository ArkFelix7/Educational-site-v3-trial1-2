const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTableStructure() {
  try {
    // Check if quiz_attempts table exists and its structure
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error accessing quiz_attempts table:', error.message);
      
      // Try to get table info from information_schema
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('get_table_columns', { table_name: 'quiz_attempts' });
      
      if (tableError) {
        console.error('Could not get table structure:', tableError.message);
      } else {
        console.log('Table columns:', tableInfo);
      }
    } else {
      console.log('quiz_attempts table exists');
      console.log('Sample data structure:', data);
    }
  } catch (err) {
    console.error('Script error:', err);
  }
}

checkTableStructure();