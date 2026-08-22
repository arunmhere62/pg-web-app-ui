export interface BlogPostMeta {
  slug: string
  title: string
  description: string
  category: string
  author: string
  datePublished: string
  dateModified?: string
  keywords: string[]
  excerpt: string
  readTime: string
  coverImage?: string
}

export interface BlogPost extends BlogPostMeta {
  content: string
}

// Use Vite's import.meta.glob to load all markdown files as raw strings
const markdownFiles = import.meta.glob('/src/blog/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

// Browser-safe frontmatter parser — replaces gray-matter (which needs Node Buffer)
function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }

  const yamlBlock = match[1]
  const content = match[2]
  const data: Record<string, unknown> = {}

  let currentArray: string[] | null = null

  for (const line of yamlBlock.split(/\r?\n/)) {
    // Array item under current key
    if (currentArray !== null && /^\s+-\s+/.test(line)) {
      const val = line.replace(/^\s+-\s+/, '').trim().replace(/^["']|["']$/g, '')
      currentArray.push(val)
      continue
    }
    // Reset array context if line doesn't start with "- "
    currentArray = null

    const kvMatch = line.match(/^(\w+):\s*(.*)$/)
    if (kvMatch) {
      const key = kvMatch[1]
      const value = kvMatch[2].trim()

      if (value === '') {
        // Could be an array or multiline — assume array if next lines have "- "
        currentArray = []
        data[key] = currentArray
      } else {
        // Strip quotes from scalar values
        data[key] = value.replace(/^["']|["']$/g, '')
      }
    }
  }

  return { data, content }
}

function calculateReadTime(content: string): string {
  const words = content.trim().split(/\s+/).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}

function extractExcerpt(content: string, maxLength = 160): string {
  const text = content
    .replace(/^#+\s+.*/gm, '')
    .replace(/[*_`~>[\]()!#-]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
  return text.length > maxLength ? text.slice(0, maxLength).trimEnd() + '…' : text
}

function slugify(filename: string): string {
  return filename
    .replace(/^.*[\\/]/, '')
    .replace(/\.md$/, '')
    .toLowerCase()
}

// Parse all markdown files and extract frontmatter + content
const allPosts: BlogPost[] = Object.entries(markdownFiles).map(([filepath, raw]) => {
  const { data, content } = parseFrontmatter(raw)
  const slug = (data.slug as string) || slugify(filepath)

  return {
    slug,
    title: (data.title as string) || slug,
    description: (data.description as string) || '',
    category: (data.category as string) || 'General',
    author: (data.author as string) || 'Satz Techno Solutions',
    datePublished: (data.datePublished as string) || new Date().toISOString().split('T')[0],
    dateModified: data.dateModified as string | undefined,
    keywords: (data.keywords as string[]) || [],
    excerpt: (data.excerpt as string) || extractExcerpt(content),
    readTime: (data.readTime as string) || calculateReadTime(content),
    coverImage: data.coverImage as string | undefined,
    content,
  }
})

// Sort by date published (newest first)
allPosts.sort((a, b) => b.datePublished.localeCompare(a.datePublished))

export function getAllPosts(): BlogPostMeta[] {
  return allPosts.map(({ content, ...meta }) => meta)
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return allPosts.find((p) => p.slug === slug)
}

export function getPostsByCategory(category: string): BlogPostMeta[] {
  return allPosts
    .filter((p) => p.category.toLowerCase() === category.toLowerCase())
    .map(({ content, ...meta }) => meta)
}

export function getCategories(): string[] {
  const categories = new Set(allPosts.map((p) => p.category))
  return Array.from(categories).sort()
}

export function getRelatedPosts(slug: string, limit = 3): BlogPostMeta[] {
  const current = allPosts.find((p) => p.slug === slug)
  if (!current) return []
  return allPosts
    .filter((p) => p.slug !== slug && p.category === current.category)
    .slice(0, limit)
    .map(({ content, ...meta }) => meta)
}
