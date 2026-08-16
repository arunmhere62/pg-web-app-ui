import type { Plugin } from 'vite'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

interface SitemapPluginOptions {
  hostname: string
  routes: { path: string; priority?: number; changefreq?: string; lastmod?: string }[]
  /** API base URL for fetching dynamic sitemap from backend */
  apiUrl?: string
}

/**
 * Vite plugin that generates a sitemap.xml at build time.
 *
 * If apiUrl is provided, it fetches the complete sitemap XML from the backend
 * (which includes all city pages, area pages, and PG listing pages).
 * Falls back to static routes if the API is unreachable.
 */
export function sitemapPlugin(options: SitemapPluginOptions): Plugin {
  return {
    name: 'vite-plugin-sitemap',
    apply: 'build',
    async closeBundle() {
      const { hostname, routes, apiUrl } = options
      const outDir = resolve(process.cwd(), 'dist')
      mkdirSync(outDir, { recursive: true })

      // Try fetching the complete sitemap from the backend API
      if (apiUrl) {
        try {
          const res = await fetch(`${apiUrl}/api/v1/public/sitemap?hostname=${hostname}`)
          if (res.ok) {
            const xml = await res.text()
            if (xml.includes('<urlset') && xml.includes('<url>')) {
              writeFileSync(resolve(outDir, 'sitemap.xml'), xml, 'utf-8')
              const urlCount = (xml.match(/<url>/g) || []).length
              console.log(`\n✓ sitemap.xml generated with ${urlCount} URLs (fetched from API)`)
              return
            }
          }
          console.warn('  WARNING: API sitemap response was not valid XML. Falling back to static routes.')
        } catch (e) {
          console.warn('  WARNING: Could not fetch sitemap from API. Falling back to static routes.')
          console.warn(`  Error: ${(e as Error).message}`)
        }
      }

      // Fallback: generate sitemap from static routes only
      const urls = routes.map((r) => {
        const priority = (r.priority ?? 0.7).toFixed(1)
        const changefreq = r.changefreq ?? 'monthly'
        const lastmodTag = r.lastmod ? `\n    <lastmod>${r.lastmod}</lastmod>` : ''
        return `  <url>
    <loc>${hostname}${r.path}</loc>${lastmodTag}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
      })

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

      writeFileSync(resolve(outDir, 'sitemap.xml'), xml, 'utf-8')
      console.log(`\n✓ sitemap.xml generated with ${routes.length} URLs (static fallback)`)
    },
  }
}
