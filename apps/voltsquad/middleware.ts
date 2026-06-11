import { next } from '@vercel/edge'

const SUPABASE_URL = 'https://yaojxewpkrjonrvqpsxi.supabase.co'
const BOT_AGENTS = /Googlebot|Twitterbot|facebookexternalhit|LinkedInBot|WhatsApp|Slackbot|TelegramBot|Discordbot/i

function buildMetaHtml(tags: Record<string, string>): string {
  const entries = Object.entries(tags)
    .map(([key, val]) => {
      const escaped = val
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
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

async function fetchProductMeta(slug: string, anonKey: string) {
  const url = `${SUPABASE_URL}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}&select=name,description,image,slug&limit=1`
  const res = await fetch(url, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    signal: AbortSignal.timeout(2000),
  })
  if (!res.ok) return null
  const rows = await res.json() as Array<{ name: string; description: string; image: string; slug: string }>
  return rows[0] ?? null
}

async function fetchShopMeta(shopSlug: string, anonKey: string) {
  // public_shop_profiles is the anon-safe view; the base profiles table is no
  // longer readable by the anon role (it holds bank/NIN/BVN/PIN data).
  const url = `${SUPABASE_URL}/rest/v1/public_shop_profiles?shop_slug=eq.${encodeURIComponent(shopSlug)}&select=shop_name,name,shop_logo_url,shop_slug&limit=1`
  const res = await fetch(url, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    signal: AbortSignal.timeout(2000),
  })
  if (!res.ok) return null
  const rows = await res.json() as Array<{ shop_name: string; name: string; shop_logo_url: string; shop_slug: string }>
  return rows[0] ?? null
}

export default async function middleware(request: Request): Promise<Response> {
  const ua = request.headers.get('user-agent') || ''
  if (!BOT_AGENTS.test(ua)) return next()

  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!anonKey) return next()

  const { pathname } = new URL(request.url)

  try {
    const productMatch = pathname.match(/^\/product\/([^/?#]+)/)
    if (productMatch) {
      const slug = productMatch[1]
      const product = await fetchProductMeta(slug, anonKey)
      if (!product) return next()

      const ogImage = product.image || 'https://voltsquad.digihire.io/images/og-default.png'
      const html = buildMetaHtml({
        title: `${product.name} — VoltSquad`,
        description: product.description || `Buy ${product.name} on VoltSquad`,
        'og:type': 'product',
        'og:title': `${product.name} — VoltSquad`,
        'og:description': product.description || `Buy ${product.name} on VoltSquad`,
        'og:url': `https://voltsquad.digihire.io/product/${slug}`,
        'og:image': ogImage,
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:site_name': 'VoltSquad',
        'twitter:card': 'summary_large_image',
        'twitter:title': `${product.name} — VoltSquad`,
        'twitter:description': product.description || `Buy ${product.name} on VoltSquad`,
        'twitter:image': ogImage,
      })
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
        },
      })
    }

    const shopMatch = pathname.match(/^\/s\/([^/?#]+)/)
    if (shopMatch) {
      const shopSlug = shopMatch[1]
      const shop = await fetchShopMeta(shopSlug, anonKey)
      if (!shop) return next()

      const displayName = shop.shop_name || shop.name || 'Seller'
      const ogImage = shop.shop_logo_url || 'https://voltsquad.digihire.io/images/og-default.png'
      const html = buildMetaHtml({
        title: `${displayName}'s Shop — VoltSquad`,
        description: `Browse products from ${displayName} on VoltSquad. Shop and earn commissions on every referral.`,
        'og:type': 'website',
        'og:title': `${displayName}'s Shop — VoltSquad`,
        'og:description': `Browse products from ${displayName} on VoltSquad. Shop and earn commissions on every referral.`,
        'og:url': `https://voltsquad.digihire.io/s/${shopSlug}`,
        'og:image': ogImage,
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:site_name': 'VoltSquad',
        'twitter:card': 'summary_large_image',
        'twitter:title': `${displayName}'s Shop — VoltSquad`,
        'twitter:description': `Browse products from ${displayName} on VoltSquad.`,
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
  matcher: ['/product/:slug*', '/s/:shopSlug*'],
}
