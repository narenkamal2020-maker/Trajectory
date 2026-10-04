import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/** SEO assets: absolute URLs in index.html, robots.txt and sitemap.xml, from VITE_SITE_URL. */
function seo(siteUrl: string): Plugin {
  const base = siteUrl.replace(/\/$/, '')
  return {
    name: 'trajectory-seo',
    transformIndexHtml(html) {
      // Without a site URL, fall back to relative paths (previews need absolute URLs in production).
      return base ? html.replaceAll('__SITE_URL__', base) : html.replaceAll('__SITE_URL__/', './').replace(/\s*<link rel="canonical"[^>]*>/, '')
    },
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10)
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source:
        `User-agent: *
Allow: /
Disallow: /api/
${base ? `Sitemap: ${base}/sitemap.xml
` : ''}` })
      // The app uses hash routes (#/privacy…), which crawlers treat as one page, so only the root is listed.
      if (base) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source:
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>
` })
    },
  }
}

export default defineConfig(({ mode }) => ({
  // Relative asset paths so the same build loads from file:// (Electron) and capacitor:// (mobile).
  base: './',
  plugins: [tailwindcss(), react(), seo(loadEnv(mode, process.cwd(), '').VITE_SITE_URL ?? '')],
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
  build: {
    chunkSizeWarningLimit: 900,
  },
}))
