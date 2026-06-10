const SUPABASE_URL = 'https://yaojxewpkrjonrvqpsxi.supabase.co'
const BASE_URL = 'https://talents.digihire.io'

async function fetchJobIds(anonKey: string): Promise<string[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/job_listings?select=id&status=eq.published&limit=5000`,
    {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      signal: AbortSignal.timeout(5000),
    }
  )
  if (!res.ok) return []
  const rows = (await res.json()) as Array<{ id: string }>
  return rows.map(r => r.id).filter(Boolean)
}

function buildSitemap(jobIds: string[]): string {
  const today = new Date().toISOString().split('T')[0]

  const staticUrls = [
    { loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${BASE_URL}/login`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${BASE_URL}/signup`, priority: '0.6', changefreq: 'monthly' },
  ]

  const jobUrls = jobIds.map(id => ({
    loc: `${BASE_URL}/talent/jobs/${id}`,
    priority: '0.7',
    changefreq: 'weekly',
  }))

  const urlEntries = [...staticUrls, ...jobUrls]
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
    const jobIds = await fetchJobIds(anonKey)
    const xml = buildSitemap(jobIds)
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    })
  } catch (err) {
    return new Response(`Sitemap generation failed: ${String(err)}`, { status: 500 })
  }
}
