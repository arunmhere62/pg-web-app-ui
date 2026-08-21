import { useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Calendar, Clock, ArrowLeft, ArrowRight, Tag } from 'lucide-react'
import { Seo, articleSchema, breadcrumbSchema } from '@/components/seo'
import { Badge } from '@/components/ui/badge'
import { getPostBySlug, getRelatedPosts } from '@/blog/blog-posts'

export function BlogPostScreen() {
  const { slug } = useParams<{ slug: string }>()

  const post = useMemo(() => (slug ? getPostBySlug(slug) : undefined), [slug])
  const relatedPosts = useMemo(() => (slug ? getRelatedPosts(slug, 3) : []), [slug])

  if (!post) {
    return <Navigate to='/blog' replace />
  }

  return (
    <>
      <Seo
        title={`${post.title} | IPGM Blog`}
        description={post.description}
        keywords={post.keywords}
        canonical={`/blog/${post.slug}`}
        schema={[
          articleSchema({
            title: post.title,
            description: post.description,
            slug: post.slug,
            datePublished: post.datePublished,
            dateModified: post.dateModified,
            image: post.coverImage,
            author: post.author,
            keywords: post.keywords,
          }),
          breadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Blog', url: '/blog' },
            { name: post.title, url: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <div className='container mx-auto max-w-3xl px-4 py-10 sm:py-12'>
        {/* Back link */}
        <Link
          to='/blog'
          className='mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary'
        >
          <ArrowLeft className='size-4' />
          Back to Blog
        </Link>

        {/* Article header */}
        <article>
          <div className='mb-4 flex flex-wrap items-center gap-3'>
            <Badge variant='secondary'>{post.category}</Badge>
            <span className='flex items-center gap-1 text-xs text-muted-foreground'>
              <Calendar className='size-3.5' />
              {new Date(post.datePublished).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
            <span className='flex items-center gap-1 text-xs text-muted-foreground'>
              <Clock className='size-3.5' />
              {post.readTime}
            </span>
          </div>

          <h1 className='mb-4 text-3xl font-bold leading-tight sm:text-4xl'>{post.title}</h1>
          <p className='mb-8 text-lg text-muted-foreground'>{post.description}</p>

          {/* Cover image */}
          {post.coverImage && (
            <img
              src={post.coverImage}
              alt={post.title}
              className='mb-8 w-full rounded-2xl border'
            />
          )}

          {/* Markdown content */}
          <div className='prose prose-slate max-w-none prose-headings:scroll-mt-20 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-lg prose-p:leading-relaxed prose-a:text-primary prose-strong:font-semibold prose-ul:my-4 prose-li:my-1 prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground'>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>

          {/* Keywords */}
          {post.keywords.length > 0 && (
            <div className='mt-10 flex flex-wrap items-center gap-2 border-t pt-6'>
              <Tag className='size-4 text-muted-foreground' />
              {post.keywords.map((kw) => (
                <Badge key={kw} variant='outline' className='text-xs'>
                  {kw}
                </Badge>
              ))}
            </div>
          )}

          {/* Author */}
          <div className='mt-8 rounded-2xl border bg-muted/30 p-5'>
            <div className='text-sm font-semibold'>Written by {post.author}</div>
            <div className='mt-1 text-xs text-muted-foreground'>
              IPGM — Indian PG Management System. The all-in-one platform for PG owners and hostel managers in India.
            </div>
            <Link
              to='/'
              className='mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline'
            >
              Try IPGM free for 30 days <ArrowRight className='size-3.5' />
            </Link>
          </div>
        </article>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className='mt-16'>
            <h2 className='mb-6 text-xl font-bold'>Related Articles</h2>
            <div className='grid gap-4 sm:grid-cols-3'>
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.slug}
                  to={`/blog/${rp.slug}`}
                  className='group rounded-xl border bg-white p-4 transition-all hover:shadow-md'
                >
                  <Badge variant='outline' className='mb-2 text-xs'>{rp.category}</Badge>
                  <h3 className='line-clamp-2 text-sm font-semibold group-hover:text-primary'>
                    {rp.title}
                  </h3>
                  <div className='mt-2 flex items-center gap-2 text-xs text-muted-foreground'>
                    <Clock className='size-3' />
                    {rp.readTime}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
