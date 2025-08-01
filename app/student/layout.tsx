import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, Brain, Home, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/student" className="text-xl font-bold">
                Learning Portal
              </Link>
              <nav className="flex space-x-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/student" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/student/articles" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Articles
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/student/quizzes" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Quizzes
                  </Link>
                </Button>
              </nav>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth/login" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-grow bg-gray-50">{children}</main>
    </div>
  )
}
