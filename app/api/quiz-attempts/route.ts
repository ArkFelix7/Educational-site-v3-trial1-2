import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: attempts, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .order('completed_at', { ascending: false });

    console.log('Raw attempts data:', attempts);

    if (error) {
      throw error;
    }

    const formattedAttempts = attempts?.map(attempt => {
      const totalPossiblePoints = attempt.total_questions * 10; // Each question worth 10 points
      return {
        id: attempt.id,
        quiz_id: attempt.quiz_id || 'practice',
        quiz_title: 'Practice Quiz',
        student_name: attempt.student_name || 'Unknown Student',
        student_email: attempt.student_email || 'unknown@example.com',
        score: attempt.score, // Raw score from database (e.g., 20)
        total_questions: totalPossiblePoints, // Total possible points (e.g., 30)
        percentage: Math.round((attempt.score / totalPossiblePoints) * 100),
        answers: Array.isArray(attempt.answers) ? attempt.answers.map((ans: any, idx: number) => ({
          question: ans.question || `Question ${idx + 1}`,
          selected: ans.userAnswer ? ans.userAnswer.charCodeAt(0) - 65 : 0,
          correct: ans.correctAnswer ? ans.correctAnswer.charCodeAt(0) - 65 : 0,
          isCorrect: ans.isCorrect || false
        })) : [],
        time_taken: attempt.time_taken || 0,
        attempted_at: attempt.completed_at
      };
    }) || [];

    return NextResponse.json({ success: true, data: formattedAttempts });
  } catch (error: any) {
    console.error('Error fetching quiz attempts:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quiz_id, user_id, student_name, student_email, score, total_questions, answers, time_taken } = body;
    
    console.log('Attempting to insert:', {
      quiz_id,
      user_id: user_id,
      student_name: student_name || 'Unknown Student',
      student_email: student_email || 'unknown@example.com',
      score: Math.round(score),
      total_questions,
      time_taken: time_taken,
      answers,
      completed_at: new Date().toISOString()
    });

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id,
        user_id: user_id,
        student_name: student_name || 'Unknown Student',
        student_email: student_email || 'unknown@example.com',
        score: Math.round(score),
        total_questions,
        time_taken: time_taken,
        answers,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Quiz attempt recorded successfully',
      data 
    });
  } catch (error: any) {
    console.error('Error saving quiz attempt:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: error.details || 'No additional details'
    }, { status: 500 });
  }
}