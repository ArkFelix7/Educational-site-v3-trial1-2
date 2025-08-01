const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createQuizAttemptsTable() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS quiz_attempts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          quiz_id UUID,
          student_id UUID,
          score INTEGER NOT NULL,
          total_questions INTEGER NOT NULL,
          time_taken INTEGER DEFAULT 0,
          answers JSONB,
          completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (error) {
      console.error('Error creating table:', error);
    } else {
      console.log('quiz_attempts table created successfully');
    }
  } catch (err) {
    console.error('Script error:', err);
  }
}

createQuizAttemptsTable();