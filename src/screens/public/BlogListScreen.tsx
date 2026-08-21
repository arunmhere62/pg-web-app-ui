import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, ArrowRight, Search } from 'lucide-react'
import { Seo, blogSchema, breadcrumbSchema } from '@/components/seo'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { getAllPosts, getCategories, type BlogPostMeta } from '@/blog/blog-posts'

export function BlogListScreen() {
  const allPosts = useMemo(() => getAllPosts(), [])
  const categories = useMemo(() => getCategories(), [])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = useMemo(() => {
    let posts = allPosts
    if (selectedCategory) {
      posts = posts.filter((p) => p.category === selectedCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.keywords.some((k) => k.toLowerCase().includes(q))
      )
    }
    return posts
  }, [allPosts, selectedCategory, searchQuery])

  const featuredPost = allPosts[0]
  const restPosts = filteredPosts.filter((p) => p.slug !== featuredPost?.slug)

  return (
    <>
      <Seo
        title='IPGM Blog — PG Management Tips, Rent Collection & Hostel Software Insights'
        description='Expert blog posts on PG management, rent collection strategies, tenant management, hostel operations, and co-living business tips for PG owners in India. Learn how to grow your PG business with IPGM.'
        keywords={[
          'PG management blog', 'PG business tips India', 'rent collection tips',
          'hostel management guide', 'tenant management best practices',
          'PG owner advice', 'co-living business tips', 'property management blog India',
        ]}
        canonical='/blog'
        schema={[
          blogSchema(),
          breadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Blog', url: '/blog' },
          ]),
        ]}
      />
      <div className='container mx-auto max-w-5xl px-4 py-10 sm:py-12'>
        {/* Header */}
        <div className='mb-10 text-center'>
          <h1 className='text-3xl font-bold sm:text-4xl'>IPGM Blog</h1>
          <p className='mt-3 text-muted-foreground'>
            PG management tips, rent collection strategies, and hostel business insights for PG owners in India.
          </p>
        </div>

        {/* Featured post */}
        {featuredPost && !selectedCategory && !searchQuery && (
          <Link
            to={`/blog/${featuredPost.slug}`}
            className='group mb-10 block overflow-hidden rounded-3xl border border-primary/10 bg-white p-6 shadow-sm transition-all hover:shadow-md sm:p-8'
          >
            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <Badge variant='secondary' className='mb-3'>Featured</Badge>
                <h2 className='text-xl font-bold sm:text-2xl'>{featuredPost.title}</h2>
                <p className='mt-3 text-sm text-muted-foreground'>{featuredPost.excerpt}</p>
                <div className='mt-4 flex items-center gap-4 text-xs text-muted-foreground'>
                  <span className='flex items-center gap-1'>
                    <Calendar className='size-3.5' />
                    {new Date(featuredPost.datePublished).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                  <span className='flex items-center gap-1'>
                    <Clock className='size-3.5' />
                    {featuredPost.readTime}
                  </span>
                </div>
              </div>
              <div className='flex items-center justify-end'>
                <ArrowRight className='size-8 text-primary transition-transform group-hover:translate-x-2' />
              </div>
            </div>
          </Link>
        )}

        {/* Search + Category filters */}
        <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='relative max-w-xs'>
            <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search articles...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9'
            />
          </div>
          <div className='flex flex-wrap gap-2'>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !selectedCategory ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === cat ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Post grid */}
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {(selectedCategory || searchQuery ? filteredPosts : restPosts).map((post: BlogPostMeta) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className='group flex flex-col overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md'
            >
              <Badge variant='outline' className='mb-3 w-fit'>{post.category}</Badge>
              <h3 className='line-clamp-2 font-semibold leading-snug group-hover:text-primary'>
                {post.title}
              </h3>
              <p className='mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground'>{post.excerpt}</p>
              <div className='mt-4 flex items-center gap-3 text-xs text-muted-foreground'>
                <span className='flex items-center gap-1'>
                  <Calendar className='size-3' />
                  {new Date(post.datePublished).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short',
                  })}
                </span>
                <span className='flex items-center gap-1'>
                  <Clock className='size-3' />
                  {post.readTime}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className='py-20 text-center text-muted-foreground'>
            No articles found. Try a different search or category.
          </div>
        )}
      </div>
    </>
  )
}
