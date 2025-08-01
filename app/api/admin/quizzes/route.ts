import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching quizzes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quizzes' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('Error in quizzes API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { title, questions, article_ids } = body;
    
    if (!title || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Invalid quiz data' },
        { status: 400 }
      );
    }
    
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({
        title,
        questions,
        article_ids: article_ids || []
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating quiz:', error);
      return NextResponse.json(
        { error: 'Failed to create quiz' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('Error in quiz creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}