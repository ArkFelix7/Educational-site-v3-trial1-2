"use client";

import { StudentOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  FileQuestion,
  TrendingUp,
  Clock,
  Award,
  LogOut,
  User,
  Eye,
  Play
} from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboard() {
  const { signOut, userProfile } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <StudentOnly>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Student Portal</h1>
                  <p className="text-sm text-muted-foreground">
                    Welcome back, {userProfile?.full_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  <User className="h-3 w-3 mr-1" />
                  Student
                </Badge>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quizzes Completed</CardTitle>
                <FileQuestion className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-xs text-muted-foreground">+5% from last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24h</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Study Materials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Study Materials
                </CardTitle>
                <CardDescription>Access published educational content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Current Affairs Articles</p>
                      <p className="text-sm text-muted-foreground">Latest published articles</p>
                    </div>
                    <Button size="sm" asChild>
                      <Link href="/student/articles">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Study Presentations</p>
                      <p className="text-sm text-muted-foreground">Interactive presentations</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/student/presentations">
                        <Play className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quizzes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileQuestion className="h-5 w-5" />
                  Available Quizzes
                </CardTitle>
                <CardDescription>Test your knowledge with practice quizzes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Current Affairs Quiz</p>
                      <p className="text-sm text-muted-foreground">10 questions • 15 mins</p>
                    </div>
                    <Button size="sm" asChild>
                      <Link href="/student/quizzes">
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Science & Technology</p>
                      <p className="text-sm text-muted-foreground">8 questions • 12 mins</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/student/quizzes">
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Link>
                    </Button>
                  </div>

                  <div className="text-center pt-4">
                    <Button variant="outline" asChild>
                      <Link href="/student/quizzes">View All Quizzes</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest quiz results and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Award className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Technology Quiz - Score: 90%</p>
                      <p className="text-sm text-muted-foreground">Completed 2 hours ago</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Excellent</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Read: Economic Policy Updates</p>
                      <p className="text-sm text-muted-foreground">Yesterday</p>
                    </div>
                  </div>
                  <Badge variant="outline">Completed</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <FileQuestion className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">Science Quiz - Score: 75%</p>
                      <p className="text-sm text-muted-foreground">3 days ago</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Good</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentOnly>
  );
}
