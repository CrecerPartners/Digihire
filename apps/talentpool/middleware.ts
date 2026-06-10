import { next } from '@vercel/edge'

const SUPABASE_URL = 'https://yaojxewpkrjonrvqpsxi.supabase.co'
const BOT_AGENTS = /Googlebot|Twitterbot|facebookexternalhit|LinkedInBot|WhatsApp|Slackbot|TelegramBot|Discordbot/i

function buildMetaHtml(tags: Record<string, string>): string {
  const entries = Object.entries(tags)
    .map(([key, val]) => {
      const escaped = val.replace(/"/g, '&quot;')
      if (key.startsWith('og:') || key.startsWith('twitter:')) {
        const attr = key.startsWith('og:') ? 'property' : 'name'
        return `<meta ${attr}="${key}" content="${escaped}" />`
      }
      return `<meta name="${key}" content="${escaped}" />`
    })
    .join('\n    ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${entries}
</head>
<body></body>
</html>`
}

async function fetchJobMeta(jobId: string, anonKey: string) {
  const url = `${SUPABASE_URL}/rest/v1/job_listings?id=eq.${encodeURIComponent(jobId)}&select=title,description,location,category&limit=1`
  const res = await fetch(url, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    signal: AbortSignal.timeout(2000),
  })
  if (!res.ok) return null
  const rows = await res.json() as Array<{ title: string; description: string; location: string; category: string }>
  return rows[0] ?? null
}

export default async function middleware(request: Request): Promise<Response> {
  const ua = request.headers.get('user-agent') || ''
  if (!BOT_AGENTS.test(ua)) return next()

  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!anonKey) return next()

  const { pathname } = new URL(request.url)

  try {
    const jobMatch = pathname.match(/^\/talent\/jobs\/([^/?#]+)/)
    if (jobMatch) {
      const jobId = jobMatch[1]
      const job = await fetchJobMeta(jobId, anonKey)
      if (!job) return next()

      const description = job.description
        ? job.description.replace(/<[^>]*>/g, '').slice(0, 155)
        : `${job.title}${job.location ? ` in ${job.location}` : ''} — Apply on DigiHire Talent`
      const title = `${job.title} — DigiHire Talent`
      const ogImage = 'https://talents.digihire.io/images/og-default.png'

      const html = buildMetaHtml({
        title,
        description,
        'og:type': 'website',
        'og:title': title,
        'og:description': description,
        'og:url': `https://talents.digihire.io/talent/jobs/${jobId}`,
        'og:image': ogImage,
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:site_name': 'DigiHire Talent',
        'twitter:card': 'summary_large_image',
        'twitter:title': title,
        'twitter:description': description,
        'twitter:image': ogImage,
      })
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
        },
      })
    }
  } catch {
    // fall through on any error
  }

  return next()
}

export const config = {
  matcher: ['/talent/jobs/:id*'],
}
