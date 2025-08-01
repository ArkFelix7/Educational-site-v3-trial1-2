import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'
import { safeQuery, safeCount } from '@/lib/db-utils'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const source = searchParams.get('source')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Get articles with retry logic
    const articles = await safeQuery(
      async (supabase) => {
        let query = supabase
          .from('gk_today_content')
          .select('*')
          .order('scraped_at', { ascending: false })

        // Apply filters
        if (search) {
          query = query.ilike('title', `%${search}%`)
        }
        if (source && source !== 'all') {
          query = query.eq('source_name', source)
        }
        if (dateFrom) {
          query = query.gte('scraped_at', dateFrom)
        }
        if (dateTo) {
          query = query.lte('scraped_at', dateTo)
        }

        return query
      },
      [],
      { timeout: 3000, maxRetries: 1 }
    )

    // Get quizzes with retry logic
    const quizzes = await safeQuery(
      async (supabase) => supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false }),
      [],
      { timeout: 2000, maxRetries: 1 }
    )

    return NextResponse.json({
      success: true,
      articles,
      quizzes
    })

  } catch (error) {
    console.error('Content fetch error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : String(error),
      hint: 'Check database connection and table existence',
      code: error instanceof Error && 'code' in error ? error.code : ''
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userRole = cookieStore.get('user-role')?.value

    // Check if user is admin
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { articleId, updates } = await request.json()

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 })
    }

    const supabase = getServerSupabase()
    
    // Update article
    const { data, error } = await supabase
      .from('gk_today_content')
      .update({
        ...updates
      })
      .eq('id', articleId)
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      article: data[0],
      message: 'Article updated successfully' 
    })

  } catch (error) {
    console.error('Article update error:', error)
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userRole = cookieStore.get('user-role')?.value

    // Check if user is admin
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 })
    }

    const supabase = getServerSupabase()
    
    // Delete article and related data
    const { error } = await supabase
      .from('gk_today_content')
      .delete()
      .eq('id', articleId)

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Article deleted successfully' 
    })

  } catch (error) {
    console.error('Article deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userRole = cookieStore.get('user-role')?.value

    // Check if user is admin
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const articleData = await request.json()

    // Validate required fields
    if (!articleData.title || !articleData.content || !articleData.section_id) {
      return NextResponse.json({ 
        error: 'Title, content, and section are required' 
      }, { status: 400 })
    }

    const supabase = getServerSupabase()
    
    // Create new article
    const { data, error } = await supabase
      .from('gk_today_content')
      .insert({
        ...articleData,
        scraped_at: new Date().toISOString()
      })
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      article: data[0],
      message: 'Article created successfully' 
    }, { status: 201 })

  } catch (error) {
    console.error('Article creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}
