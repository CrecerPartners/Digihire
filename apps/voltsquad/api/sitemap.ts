const SUPABASE_URL = 'https://yaojxewpkrjonrvqpsxi.supabase.co'
const BASE_URL = 'https://voltsquad.digihire.io'

async function fetchSlugs(anonKey: string): Promise<{ products: string[]; shops: string[] }> {
  const [productsRes, shopsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/products?select=slug&status=eq.published&limit=1000`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      signal: AbortSignal.timeout(5000),
    }),
    // public_shop_profiles is the anon-safe view (base profiles is no longer
    // anon-readable). It only contains rows where shop_slug IS NOT NULL.
    fetch(`${SUPABASE_URL}/rest/v1/public_shop_profiles?select=shop_slug&limit=1000`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      signal: AbortSignal.timeout(5000),
    }),
  ])

  const products = productsRes.ok
    ? ((await productsRes.json()) as Array<{ slug: string }>).map(r => r.slug).filter(Boolean)
    : []
  const shops = shopsRes.ok
    ? ((await shopsRes.json()) as Array<{ shop_slug: string }>).map(r => r.shop_slug).filter(Boolean)
    : []

  return { products, shops }
}

function buildSitemap(products: string[], shops: string[]): string {
  const today = new Date().toISOString().split('T')[0]

  const staticUrls = [
    { loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${BASE_URL}/about/brands`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${BASE_URL}/about/students`, priority: '0.8', changefreq: 'monthly' },
  ]

  const productUrls = products.map(slug => ({
    loc: `${BASE_URL}/product/${slug}`,
    priority: '0.7',
    changefreq: 'daily',
  }))

  const shopUrls = shops.map(slug => ({
    loc: `${BASE_URL}/s/${slug}`,
    priority: '0.6',
    changefreq: 'weekly',
  }))

  const urlEntries = [...staticUrls, ...productUrls, ...shopUrls]
    .map(
      u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`
}

export default async function handler(_req: Request): Promise<Response> {
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!anonKey) {
    return new Response('SUPABASE_ANON_KEY not configured', { status: 500 })
  }

  try {
    const { products, shops } = await fetchSlugs(anonKey)
    const xml = buildSitemap(products, shops)
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    })
  } catch (err) {
    console.error('Sitemap generation failed:', err)
    return new Response('Sitemap generation failed', { status: 500 })
  }
}
