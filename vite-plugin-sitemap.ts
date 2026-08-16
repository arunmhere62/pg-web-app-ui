import type { Plugin } from 'vite'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

interface SitemapPluginOptions {
  hostname: string
  routes: { path: string; priority?: number; changefreq?: string }[]
}

/**
 * Vite plugin that generates a sitemap.xml at build time.
 * Dynamic PG listing URLs should be fetched from the API and added to the routes array.
 */
export function sitemapPlugin(options: SitemapPluginOptions): Plugin {
  return {
    name: 'vite-plugin-sitemap',
    apply: 'build',
    closeBundle() {
      const { hostname, routes } = options
      const urls = routes.map((r) => {
        const priority = r.priority ?? 0.7
        const changefreq = r.changefreq ?? 'monthly'
        return `  <url>
    <loc>${hostname}${r.path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
      })

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

      const outDir = resolve(process.cwd(), 'dist')
      mkdirSync(outDir, { recursive: true })
      writeFileSync(resolve(outDir, 'sitemap.xml'), xml, 'utf-8')
      console.log(`\n✓ sitemap.xml generated with ${routes.length} URLs`)
    },
  }
}
