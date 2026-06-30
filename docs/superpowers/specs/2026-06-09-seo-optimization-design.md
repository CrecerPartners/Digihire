
# SEO Optimization Design — DigiHire Monorepo

**Date:** 2026-06-09
**Scope:** apps/landing, apps/brands, apps/talentpool, apps/voltsquad (admin excluded)
**Approach:** Vercel Edge Middleware for social bot meta injection

---

## Context & Problem

The DigiHire monorepo has four customer-facing apps deployed across four domains:

| App | Domain | Framework |
|-----|--------|-----------|
| Landing | digihire.io | Vite static HTML |
| Brands | brands.digihire.io | React 18 SPA + React Router v6 |
| TalentPool | talents.digihire.io | React 18 SPA + React Router v6 |
| VoltSquad | voltsquad.digihire.io | React 18 SPA + React Router v6 + Capacitor |

**Current state:** Zero SEO infrastructure across all apps. No meta descriptions, no Open Graph tags, no schema markup, no sitemaps, no canonical tags. VoltSquad and TalentPool have public-facing product and job pages that are completely invisible to social bots and poorly indexed by Google.

**Core constraint:** Social bots (WhatsApp, LinkedIn, Twitter, Facebook) do not execute JavaScript. React SPA meta tags injected via JS are invisible to them. Product and job links must generate correct sharing previews — this requires server-side HTML with meta tags already present.

**Key requirement:** Social sharing previews must work for product links AND job links. Public APIs for products and jobs are available without authentication.

---

## Architecture Decision: Vercel Edge Middleware

Three options were evaluated:

| Approach | Summary | Decision |
|----------|---------|---------|
| **A — Vercel Edge Middleware** | Detect bots at edge, fetch API data, inject meta into HTML | **Selected** |
| B — Next.js migration | Move public pages to Next.js app with SSR | Overkill, weeks of work |
| C — Prerendering service | Route bot traffic to prerender.io/Rendertron | External dependency, paid, no control |

**Approach A selected** because it requires no SPA architecture changes, works with all social platforms, fits the existing Vercel deployment, and is zero additional cost.

---

## Section 1: Landing App (digihire.io)

### Meta Tags — All 15 Pages

Every page receives the following `<head>` additions:

```html
<meta name="description" content="[unique per page, 150-160 chars]">
<meta property="og:title" content="[page title]">
<meta property="og:description" content="[same as meta description]">
<meta property="og:image" content="https://digihire.io/images/og-default.png">
<meta property="og:url" content="https://digihire.io/[page-path]">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[page title]">
<meta name="twitter:description" content="[same as meta description]">
<meta name="twitter:image" content="https://digihire.io/images/og-default.png">
<link rel="canonical" href="https://digihire.io/[page-path]">
```

Blog pages use `og:type: article` and a post-specific image where available.

**Per-page meta descriptions:**

| Page | Description |
|------|-------------|
| index.html | DigiHire helps sales professionals advance their careers through job listings, training, and the VoltSquad campaign marketplace. |
| about.html | Learn about DigiHire — the platform building Africa's sales ecosystem by connecting brands, talent, and opportunities. |
| blog.html | Insights on careers, hiring, sales, and professional growth from the DigiHire team. |
| contact.html | Get in touch with DigiHire. Reach our team for partnerships, support, or general enquiries. |
| events.html | Discover upcoming DigiHire events — workshops, networking, and career development opportunities for sales professionals. |
| jobs.html | Browse open sales and marketing jobs on DigiHire. Find your next career opportunity with top brands. |
| sales-activations.html | Run targeted sales activations with DigiHire. Connect your brand with motivated field sales talent. |
| voltsquad.html | VoltSquad is DigiHire's campaign marketplace — brands launch campaigns, sellers earn commissions on real results. |
| blog-ai-resume.html | [Post-specific description from content] |
| blog-enterprise-sales.html | [Post-specific description from content] |
| blog-remote-hiring.html | [Post-specific description from content] |
| Remaining blog posts | [Post-specific descriptions from content] |

### Sitemap

Static `/sitemap.xml` in the `public/` folder:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://digihire.io/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://digihire.io/about</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://digihire.io/blog</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>https://digihire.io/jobs</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <!-- all 15 pages -->
</urlset>
```

`robots.txt` updated to add: `Sitemap: https://digihire.io/sitemap.xml`

### Schema Markup

**`index.html`** — two JSON-LD blocks:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "DigiHire",
  "url": "https://digihire.io",
  "logo": "https://digihire.io/images/logo.png",
  "sameAs": ["https://linkedin.com/company/digihire", "https://twitter.com/digihire"]
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://digihire.io",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://digihire.io/jobs?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

**Blog pages** — `BlogPosting` schema per post with `headline`, `datePublished`, `author`, `publisher`, `image`, `url`.

### Image Optimization

- Explicit `width` / `height` on every `<img>` tag (eliminates CLS)
- `fetchpriority="high"` on hero/LCP image
- `loading="lazy"` on all below-fold images
- Descriptive alt text replacing generic values ("Logo" → "DigiHire logo", "Feature" → meaningful description)
- PNG → WebP conversion for all images
- Default OG social card: `/images/og-default.png` at 1200×630px

---

## Section 2: React SPAs Base Layer

### react-helmet-async

Installed in: `apps/brands`, `apps/talentpool`, `apps/voltsquad`

Each app's `main.tsx` wrapped with `<HelmetProvider>`. Shared `SEOMeta` component per app:

```tsx
// src/components/seo/SEOMeta.tsx
import { Helmet } from 'react-helmet-async'

interface SEOMetaProps {
  title: string
  description: string
  canonical: string
  ogImage?: string
  ogType?: string
}

export function SEOMeta({ title, description, canonical, ogImage, ogType = 'website' }: SEOMetaProps) {
  const image = ogImage ?? '/images/og-default.png'
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  )
}
```

Dynamic pages (product, job, shop) use data from existing API queries to populate `<SEOMeta>` — once data loads, Googlebot sees correct tags.

### robots.txt per SPA

**brands.digihire.io:**

```
User-agent: *
Disallow: /brand/
Allow: /
Allow: /login
Allow: /signup

Sitemap: https://brands.digihire.io/sitemap.xml
```

**talents.digihire.io:**

```
User-agent: *
Disallow: /talent/
Allow: /
Allow: /login
Allow: /signup
Allow: /academy
Allow: /product/
Allow: /s/

Sitemap: https://talents.digihire.io/sitemap.xml
```

**voltsquad.digihire.io:**

```
User-agent: *
Disallow: /dashboard/
Disallow: /campaigns/
Disallow: /profile
Disallow: /wallet/
Allow: /marketplace
Allow: /product/
Allow: /s/
Allow: /about-brands
Allow: /about-students

Sitemap: https://voltsquad.digihire.io/sitemap.xml
```

### Static Sitemaps (known public routes)

Each app gets `/public/sitemap.xml` covering known static public routes. Dynamic routes (product slugs, job IDs) are covered by the dynamic sitemaps in Section 6.

---

## Section 3: Vercel Edge Middleware

### Bot Detection

```ts
const BOT_AGENTS = /Googlebot|Twitterbot|facebookexternalhit|LinkedInBot|WhatsApp|Slackbot|TelegramBot|Discordbot/i

function isBot(request: Request): boolean {
  return BOT_AGENTS.test(request.headers.get('user-agent') ?? '')
}
```

### VoltSquad `middleware.ts`

Handles: `/product/:slug`, `/s/:shopSlug`

> **Note:** These are Vite SPAs, not Next.js apps. Vercel supports edge middleware for any framework via the `@vercel/edge` package. The API differs from `next/server`: use `next()` from `@vercel/edge` instead of `NextResponse.next()`, and route matching is done inside the function rather than via a `config.matcher` export.

```ts
import { next } from '@vercel/edge'

export default async function middleware(request: Request) {
  if (!isBot(request)) return next()

  const url = new URL(request.url)
  const { pathname } = url

  if (pathname.startsWith('/product/')) {
    const slug = pathname.split('/product/')[1]
    const meta = await fetchProductMeta(slug)
    if (meta) return injectMeta(request, meta)
  }

  if (pathname.startsWith('/s/')) {
    const shopSlug = pathname.split('/s/')[1]
    const meta = await fetchShopMeta(shopSlug)
    if (meta) return injectMeta(request, meta)
  }

  return next()
}
```

**`fetchProductMeta`** — calls public products API, returns `{ title, description, image, url }`. Times out after 2s; on failure returns `null` so the middleware falls through without modifying HTML.

**`injectMeta`** — fetches the SPA's `index.html`, replaces `</head>` with the meta block + `</head>`, sets `Cache-Control: s-maxage=300`.

**Meta block injected for products:**

```html
<title>{product.name} — VoltSquad</title>
<meta name="description" content="{product.description}">
<meta property="og:title" content="{product.name} — VoltSquad">
<meta property="og:description" content="{product.description}">
<meta property="og:image" content="{product.image}">
<meta property="og:url" content="https://voltsquad.digihire.io/product/{slug}">
<meta property="og:type" content="product">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{Product schema JSON}</script>
<script type="application/ld+json">{BreadcrumbList JSON}</script>
```

### TalentPool `middleware.ts`

Handles: job detail/listing pages

Same pattern — fetches job data from public jobs API, injects:

```html
<title>{job.title} at {job.company} — DigiHire</title>
<meta property="og:title" content="{job.title} at {job.company}">
<meta property="og:description" content="{job.summary}">
<script type="application/ld+json">{JobPosting schema}</script>
```

### Fallback Guarantee

If API fetch fails or times out (2s threshold): middleware returns `NextResponse.next()` — the unmodified SPA HTML is served. Never a blank page or error response.

---

## Section 4: Schema Markup

### Landing

| Page | Schema Type |
|------|------------|
| index.html | Organization + WebSite |
| blog posts (×8) | BlogPosting |

### VoltSquad (via Edge Middleware)

| Route | Schema Type |
|-------|------------|
| /product/:slug | Product + BreadcrumbList |
| /s/:shopSlug | Store + BreadcrumbList |

**Product schema:**

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{product.name}",
  "description": "{product.description}",
  "image": "{product.image}",
  "url": "https://voltsquad.digihire.io/product/{slug}",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "NGN",
    "availability": "https://schema.org/InStock"
  }
}
```

### TalentPool (via Edge Middleware)

| Route | Schema Type |
|-------|------------|
| Job pages | JobPosting |

**JobPosting schema:**

```json
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "{job.title}",
  "description": "{job.description}",
  "datePosted": "{job.createdAt}",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "{job.company}"
  },
  "jobLocation": {
    "@type": "Place",
    "address": "{job.location}"
  },
  "employmentType": "{job.type}"
}
```

`JobPosting` schema is the highest-value schema for a hiring platform — Google surfaces these as rich job cards directly in search results.

---

## Section 5: Core Web Vitals & Performance

### Landing App

| Fix | Metric | Implementation |
|-----|--------|---------------|
| `width`/`height` on all `<img>` | CLS ↓ | Direct HTML edit |
| `fetchpriority="high"` on hero image | LCP ↓ | Direct HTML edit |
| `loading="lazy"` on below-fold images | LCP ↓ | Direct HTML edit |
| PNG → WebP conversion | LCP ↓ | Manual conversion + `<picture>` fallback |
| Remove Lucide CDN (`unpkg.com`) → npm | FID ↓ | Remove CDN `<script>`, import locally |
| `font-display: swap` on Google Fonts | FCP ↓ | CSS edit |

### React SPAs

**Route-level code splitting** via `React.lazy` + `Suspense` on all page components in each router. Reduces initial JS bundle parse time, improving INP on first interaction.

```tsx
const Marketplace = React.lazy(() => import('./pages/Marketplace'))
const ProductPage = React.lazy(() => import('./pages/ProductPage'))
```

**Google Fonts preconnect** (consistent across all apps):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

---

## Section 6: Dynamic Sitemaps

### VoltSquad (`/sitemap.xml` — Edge Function)

Fetches all product slugs and shop slugs from public API on request. Returns complete XML sitemap. Cached `s-maxage=3600` (hourly refresh).

**Entries generated:**

```
/marketplace
/product/{slug} — one entry per product
/s/{shopSlug} — one entry per shop
/about-brands
/about-students
```

### TalentPool (`/sitemap.xml` — Edge Function)

Fetches all public job listings from public API. Returns sitemap with one entry per job URL plus static public routes.

### Landing (`/sitemap.xml` — Static)

Static file in `public/` covering all 15 pages (designed in Section 1).

### Brands (`/sitemap.xml` — Static)

Static file covering 3 public routes: `/`, `/login`, `/signup`.

### Google Search Console

After deployment: manually submit each sitemap URL once per domain in Google Search Console. Not automated — one-time post-launch step.

---

## Implementation Order

1. **Landing app** — highest crawlable impact, pure HTML edits, no dependencies
2. **react-helmet-async + robots.txt** — base layer for all SPAs, needed before middleware
3. **Edge Middleware** — VoltSquad first (highest public route count), then TalentPool
4. **Schema markup** — landing inline, SPAs via middleware extension
5. **Core Web Vitals** — landing images first, SPA code splitting second
6. **Dynamic Sitemaps** — last, after public routes are confirmed working

---

## Files to Create / Modify

### Landing (`apps/landing/`)

- `index.html` + all 14 other `.html` files — meta tags, schema, image attributes
- `public/robots.txt` — add Sitemap directive
- `public/sitemap.xml` — new file
- `public/images/og-default.png` — new 1200×630 social card

### Brands (`apps/brands/`)

- `index.html` — base meta tags
- `public/robots.txt` — new file
- `public/sitemap.xml` — new file
- `src/components/seo/SEOMeta.tsx` — new component
- `src/main.tsx` — wrap with HelmetProvider
- All public route page components — add `<SEOMeta>`

### TalentPool (`apps/talentpool/`)

- Same structure as Brands
- `middleware.ts` — new file (job page bot injection)
- `public/sitemap.xml` — static routes only (dynamic via edge function)

### VoltSquad (`apps/voltsquad/`)

- Same structure as Brands
- `middleware.ts` — new file (product + shop bot injection)
- `public/sitemap.xml` — static routes only (dynamic via edge function)

---

## Success Criteria

- [ ] All 15 landing pages have unique title, meta description, OG tags, and canonical
- [ ] Sharing a product link on WhatsApp shows correct product title, description, and image
- [ ] Sharing a job link on LinkedIn shows correct job title and company
- [ ] Google Search Console shows 0 "missing meta description" warnings after indexing
- [ ] JobPosting rich results appear in Google's Rich Results Test for job URLs
- [ ] Product schema passes Google's Rich Results Test for product URLs
- [ ] Core Web Vitals: Landing LCP < 2.5s, CLS < 0.1
- [ ] All sitemaps return valid XML and are submitted to Google Search Console
- [ ] No protected routes appear in any sitemap
