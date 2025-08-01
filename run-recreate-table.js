const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function recreateTable() {
  try {
    // Drop existing table
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS quiz_attempts;'
    });

    if (dropError) {
      console.error('Error dropping table:', dropError);
      return;
    }

    console.log('Table dropped successfully');

    // Create new table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE quiz_attempts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          quiz_id UUID,
          user_id UUID NOT NULL,
          score INTEGER NOT NULL,
          total_questions INTEGER NOT NULL,
          time_taken INTEGER DEFAULT 0,
          answers JSONB,
          completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createError) {
      console.error('Error creating table:', createError);
      return;
    }

    console.log('Table created successfully with all needed columns');
  } catch (err) {
    console.error('Script error:', err);
  }
}

recreateTable();