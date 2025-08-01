'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Eye, Clock, User, Target, CheckCircle, XCircle, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface QuizAttempt {
  id: string;
  quiz_id: string;
  quiz_title: string;
  student_name: string;
  student_email: string;
  score: number;
  total_questions: number;
  percentage: number;
  answers: Array<{
    question: string;
    selected: number;
    correct: number;
    isCorrect: boolean;
  }>;
  time_taken: number;
  attempted_at: string;
}

interface QuizSummary {
  quiz_id: string;
  quiz_title: string;
  total_attempts: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  attempts: QuizAttempt[];
}

export function QuizScoreboard() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [quizSummaries, setQuizSummaries] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizSummary | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    loadQuizAttempts();
  }, []);

  const loadQuizAttempts = async () => {
    try {
      const response = await fetch('/api/quiz-attempts');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAttempts(result.data);
          groupAttemptsByQuiz(result.data);
        } else {
          throw new Error(result.error);
        }
      } else {
        throw new Error('Failed to fetch quiz attempts');
      }
    } catch (error) {
      console.error('Error loading quiz attempts:', error);
      setAttempts([]);
      setQuizSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  const groupAttemptsByQuiz = (attempts: QuizAttempt[]) => {
    const grouped = attempts.reduce((acc, attempt) => {
      if (!acc[attempt.quiz_id]) {
        acc[attempt.quiz_id] = {
          quiz_id: attempt.quiz_id,
          quiz_title: attempt.quiz_title,
          attempts: []
        };
      }
      acc[attempt.quiz_id].attempts.push(attempt);
      return acc;
    }, {} as Record<string, { quiz_id: string; quiz_title: string; attempts: QuizAttempt[] }>);

    const summaries: QuizSummary[] = Object.values(grouped).map(group => {
      const scores = group.attempts.map(a => a.percentage);
      return {
        ...group,
        total_attempts: group.attempts.length,
        average_score: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        highest_score: Math.max(...scores),
        lowest_score: Math.min(...scores)
      };
    });

    setQuizSummaries(summaries);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz attempts...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Quiz Scoreboard
        </CardTitle>
        <CardDescription>
          View student quiz attempts and detailed answers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {quizSummaries.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quiz attempts yet</h3>
            <p className="text-gray-600">Students haven't attempted any quizzes yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Quizzes</p>
                      <p className="text-2xl font-bold">{quizSummaries.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Attempts</p>
                      <p className="text-2xl font-bold">{attempts.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Overall Avg Score</p>
                      <p className="text-2xl font-bold">
                        {attempts.length > 0 ? (attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quiz Summary Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz Title</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Highest Score</TableHead>
                    <TableHead>Lowest Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizSummaries.map((quiz) => (
                    <TableRow key={quiz.quiz_id}>
                      <TableCell>
                        <p className="font-medium">{quiz.quiz_title}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{quiz.total_attempts}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getScoreColor(quiz.average_score)}`}>
                          {quiz.average_score.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getScoreColor(quiz.highest_score)}`}>
                          {quiz.highest_score.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getScoreColor(quiz.lowest_score)}`}>
                          {quiz.lowest_score.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedQuiz(quiz)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-6xl max-h-[90vh]">
                            <DialogHeader>
                              <DialogTitle>Quiz Details: {selectedQuiz?.quiz_title}</DialogTitle>
                              <DialogDescription>
                                All attempts for this quiz with detailed results
                              </DialogDescription>
                            </DialogHeader>
                            {selectedQuiz && (
                              <ScrollArea className="max-h-[75vh]">
                                <div className="space-y-6">
                                  {/* Quiz Stats */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                      <p className="text-sm text-gray-600">Total Attempts</p>
                                      <p className="font-bold text-lg">{selectedQuiz.total_attempts}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Average Score</p>
                                      <p className={`font-bold text-lg ${getScoreColor(selectedQuiz.average_score)}`}>
                                        {selectedQuiz.average_score.toFixed(1)}%
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Highest Score</p>
                                      <p className={`font-bold text-lg ${getScoreColor(selectedQuiz.highest_score)}`}>
                                        {selectedQuiz.highest_score.toFixed(1)}%
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Lowest Score</p>
                                      <p className={`font-bold text-lg ${getScoreColor(selectedQuiz.lowest_score)}`}>
                                        {selectedQuiz.lowest_score.toFixed(1)}%
                                      </p>
                                    </div>
                                  </div>

                                  {/* All Attempts for this Quiz */}
                                  <div>
                                    <h4 className="font-semibold mb-4">All Student Attempts</h4>
                                    <div className="rounded-md border">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Score</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {selectedQuiz.attempts.map((attempt) => (
                                            <TableRow key={attempt.id}>
                                              <TableCell>
                                                <div>
                                                  <p className="font-medium">{attempt.student_name}</p>
                                                  <p className="text-sm text-gray-600">{attempt.student_email}</p>
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <div className="flex items-center gap-2">
                                                  <Badge className={getScoreBadge(attempt.percentage)}>
                                                    {attempt.score}/{attempt.total_questions}
                                                  </Badge>
                                                  <span className={`font-medium ${getScoreColor(attempt.percentage)}`}>
                                                    {attempt.percentage.toFixed(1)}%
                                                  </span>
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <div className="flex items-center gap-1">
                                                  <Clock className="h-3 w-3" />
                                                  <span className="text-sm">{formatTime(attempt.time_taken)}</span>
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <span className="text-sm">
                                                  {new Date(attempt.attempted_at).toLocaleDateString()}
                                                </span>
                                              </TableCell>
                                              <TableCell>
                                                <Dialog>
                                                  <DialogTrigger asChild>
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      onClick={() => setSelectedAttempt(attempt)}
                                                    >
                                                      <Eye className="h-4 w-4 mr-1" />
                                                      Answers
                                                    </Button>
                                                  </DialogTrigger>
                                                  <DialogContent className="max-w-4xl max-h-[80vh]">
                                                    <DialogHeader>
                                                      <DialogTitle>Student Answers</DialogTitle>
                                                      <DialogDescription>
                                                        {selectedAttempt?.student_name} - {selectedAttempt?.quiz_title}
                                                      </DialogDescription>
                                                    </DialogHeader>
                                                    {selectedAttempt && (
                                                      <ScrollArea className="max-h-[60vh]">
                                                        <div className="space-y-4">
                                                          {/* Summary */}
                                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                                                            <div>
                                                              <p className="text-sm text-gray-600">Score</p>
                                                              <p className="font-bold text-lg">{selectedAttempt.score}/{selectedAttempt.total_questions}</p>
                                                            </div>
                                                            <div>
                                                              <p className="text-sm text-gray-600">Percentage</p>
                                                              <p className={`font-bold text-lg ${getScoreColor(selectedAttempt.percentage)}`}>
                                                                {selectedAttempt.percentage.toFixed(1)}%
                                                              </p>
                                                            </div>
                                                            <div>
                                                              <p className="text-sm text-gray-600">Time Taken</p>
                                                              <p className="font-bold text-lg">{formatTime(selectedAttempt.time_taken)}</p>
                                                            </div>
                                                            <div>
                                                              <p className="text-sm text-gray-600">Date</p>
                                                              <p className="font-bold text-lg">
                                                                {new Date(selectedAttempt.attempted_at).toLocaleDateString()}
                                                              </p>
                                                            </div>
                                                          </div>

                                                          {/* Detailed Answers */}
                                                          <div className="space-y-4">
                                                            <h4 className="font-semibold">Question-wise Answers</h4>
                                                            {selectedAttempt.answers.map((answer, index) => (
                                                              <div key={index} className="border rounded-lg p-4">
                                                                <div className="flex items-start gap-2 mb-2">
                                                                  {answer.isCorrect ? (
                                                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                                                  ) : (
                                                                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                                                  )}
                                                                  <div className="flex-1">
                                                                    <p className="font-medium mb-2">
                                                                      Q{index + 1}: {answer.question}
                                                                    </p>
                                                                    <div className="space-y-1">
                                                                      <p className="text-sm">
                                                                        <span className="font-medium">Student's Answer:</span>{' '}
                                                                        <span className={answer.isCorrect ? 'text-green-600' : 'text-red-600'}>
                                                                          Option {String.fromCharCode(65 + answer.selected)}
                                                                        </span>
                                                                      </p>
                                                                      {!answer.isCorrect && (
                                                                        <p className="text-sm">
                                                                          <span className="font-medium">Correct Answer:</span>{' '}
                                                                          <span className="text-green-600">
                                                                            Option {String.fromCharCode(65 + answer.correct)}
                                                                          </span>
                                                                        </p>
                                                                      )}
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            ))}
                                                          </div>
                                                        </div>
                                                      </ScrollArea>
                                                    )}
                                                  </DialogContent>
                                                </Dialog>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </div>
                              </ScrollArea>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}