'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Brain, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { getPublishedArticles, getPublishedQuizzes } from '@/app/actions/content-management';

export default function StudentDashboard() {
  const [articles, setArticles] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [articlesResult, quizzesResult] = await Promise.all([
        getPublishedArticles(5), // Get latest 5 articles
        getPublishedQuizzes()
      ]);

      if (articlesResult.success) {
        setArticles(articlesResult.data);
      }
      if (quizzesResult.success) {
        setQuizzes(quizzesResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
        <p className="text-muted-foreground">Access your learning materials and quizzes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Articles Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Articles
            </CardTitle>
            <CardDescription>
              Latest published educational content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {articles.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No articles available yet
              </p>
            ) : (
              <div className="space-y-4">
                {articles.slice(0, 3).map((article) => (
                  <div key={article.id} className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium line-clamp-2">{article.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.intro}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{article.source_name}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(article.published_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                <Button asChild className="w-full">
                  <Link href="/student/articles">View All Articles</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quizzes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Available Quizzes
            </CardTitle>
            <CardDescription>
              Test your knowledge with interactive quizzes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quizzes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No quizzes available yet
              </p>
            ) : (
              <div className="space-y-4">
                {quizzes.slice(0, 3).map((quiz) => (
                  <div key={quiz.id} className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium line-clamp-2">{quiz.title}</h4>
                    {quiz.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {quiz.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {quiz.quiz_data?.questions?.length || 0} questions
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(quiz.published_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                <Button asChild className="w-full">
                  <Link href="/student/quizzes">View All Quizzes</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}