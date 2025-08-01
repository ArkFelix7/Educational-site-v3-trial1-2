const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addTimeTakenColumn() {
  try {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error accessing table:', error);
      return;
    }

    console.log('Current table structure:', Object.keys(data[0] || {}));
    
    // Try minimal insert to see what columns are required
    const { error: insertError } = await supabase
      .from('quiz_attempts')
      .insert({});

    console.log('Insert error (shows required columns):', insertError?.message || 'No error');
    
    // Try with just basic columns
    const { error: insertError2 } = await supabase
      .from('quiz_attempts')
      .insert({ id: 1 });
    
    console.log('Insert with id error:', insertError2?.message || 'No error');
  } catch (err) {
    console.error('Script error:', err);
  }
}

addTimeTakenColumn();