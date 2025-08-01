const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkQuizAttempts() {
  try {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Quiz attempts found:', data?.length || 0);
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Script error:', err);
  }
}

checkQuizAttempts();