"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StudentOnly } from '@/components/auth/role-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Calendar, 
  Globe,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Article {
  id: string;
  title: string;
  intro?: string;
  content?: string;
  source_name: string;
  published_at: string;
  url?: string;
  table_source: string;
}

interface Section {
  id: string;
  title: string;
  content: string;
  type: string;
  bullets?: Array<{
    id: string;
    content: string;
    bullet_order: number;
  }>;
}

export default function StudentArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadArticle(params.id as string);
    }
  }, [params.id]);

  const loadArticle = async (articleId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/articles/${articleId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Article Not Found",
            description: "This article may not be published or may have been removed.",
            variant: "destructive"
          });
          router.push('/student/articles');
          return;
        }
        throw new Error('Failed to fetch article');
      }
      
      const data = await response.json();
      setArticle(data.article);
      setSections(data.sections || []);
    } catch (error) {
      console.error('Error loading article:', error);
      toast({
        title: "Error",
        description: "Failed to load article. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (section: Section) => {
    switch (section.type) {
      case 'list':
        return (
          <div key={section.id} className="mb-6">
            <h3 className="text-lg font-semibold mb-3">{section.title}</h3>
            {section.content && (
              <p className="text-muted-foreground mb-3">{section.content}</p>
            )}
            {section.bullets && section.bullets.length > 0 && (
              <ul className="list-disc list-inside space-y-2 ml-4">
                {section.bullets.map((bullet) => (
                  <li key={bullet.id} className="text-sm">
                    {bullet.content}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      
      case 'paragraph':
      default:
        return (
          <div key={section.id} className="mb-6">
            {section.title && (
              <h3 className="text-lg font-semibold mb-3">{section.title}</h3>
            )}
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{section.content}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <StudentOnly>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="sm" asChild>
              <Link href="/student/articles">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Articles
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full mb-4" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-6 w-1/2 mb-4" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : article ? (
            <div className="space-y-6">
              {/* Article Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-4">{article.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Published {format(new Date(article.published_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {article.source_name}
                        </Badge>
                      </div>
                    </div>
                    {article.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Original Source
                        </a>
                      </Button>
                    )}
                  </div>
                  {article.intro && (
                    <CardContent className="px-0 pb-0">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">
                          {article.intro}
                        </p>
                      </div>
                    </CardContent>
                  )}
                </CardHeader>
              </Card>

              {/* Article Content */}
              {sections.length > 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none">
                      {sections.map(renderSection)}
                    </div>
                  </CardContent>
                </Card>
              ) : article.content ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap">{article.content}</div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Content Not Available</h3>
                    <p className="text-muted-foreground">
                      The full content for this article is not available at the moment.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Footer Actions */}
              <div className="flex justify-center pt-6">
                <Button variant="outline" asChild>
                  <Link href="/student/articles">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to All Articles
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Article Not Found</h3>
                <p className="text-muted-foreground mb-4">
                  This article may not be published or may have been removed.
                </p>
                <Button asChild>
                  <Link href="/student/articles">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Articles
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </StudentOnly>
  );
}