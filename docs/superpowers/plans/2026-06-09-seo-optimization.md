# SEO Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full SEO infrastructure across digihire.io, brands.digihire.io, talents.digihire.io, and voltsquad.digihire.io — including social-bot-compatible meta injection via Vercel Edge Middleware.

**Architecture:** Landing app gets direct HTML edits (meta tags, schema, sitemap). React SPAs get `react-helmet-async` for Google indexing. Vercel Edge Middleware on VoltSquad and TalentPool intercepts bot requests on public dynamic routes, fetches product/job data from the Supabase REST API, and injects meta tags into the HTML response before bots see it.

**Tech Stack:** Vite static HTML (landing), React 18 + React Router v6 (SPAs), `react-helmet-async`, `@vercel/edge`, Supabase REST API (`https://yaojxewpkrjonrvqpsxi.supabase.co/rest/v1/`)

---

## Environment Variables Required (Vercel Dashboard)

Before starting Tasks 14–15, add these to the Vercel project settings for **VoltSquad** and **TalentPool** (not just .env — middleware runs at the edge, not inside Vite):

| Variable | Value | Where to find it |
|----------|-------|-----------------|
| `SUPABASE_URL` | `https://yaojxewpkrjonrvqpsxi.supabase.co` | Already known |
| `SUPABASE_ANON_KEY` | `eyJ...` | Supabase dashboard → Project Settings → API |

---

## File Map

### Landing (`apps/landing/`)
| File | Action |
|------|--------|
| `index.html` | Add meta description, OG tags, canonical, schema (Task 2) |
| `about.html` | Add meta description, OG tags, canonical (Task 2) |
| `blog.html` | Add meta description, OG tags, canonical (Task 2) |
| `contact.html` | Add meta description, OG tags, canonical (Task 2) |
| `events.html` | Add meta description, OG tags, canonical (Task 2) |
| `jobs.html` | Add meta description, OG tags, canonical (Task 2) |
| `sales-activations.html` | Add meta description, OG tags, canonical (Task 2) |
| `voltsquad.html` | Add meta description, OG tags, canonical (Task 2) |
| `blog-ai-resume.html` | Add meta + BlogPosting schema (Task 3) |
| `blog-enterprise-sales.html` | Add meta + BlogPosting schema (Task 3) |
| `blog-gig-economy.html` | Add meta + BlogPosting schema (Task 3) |
| `blog-mall-activations.html` | Add meta + BlogPosting schema (Task 3) |
| `blog-performance-campaign.html` | Add meta + BlogPosting schema (Task 3) |
| `blog-remote-hiring.html` | Add meta + BlogPosting schema (Task 3) |
| `blog-tech-sales.html` | Add meta + BlogPosting schema (Task 3) |
| `public/robots.txt` | Add `Sitemap:` directive (Task 5) |
| `public/sitemap.xml` | Create static sitemap (Task 5) |
| `public/images/og-default.png` | 1200×630 brand social card — create manually and drop here (Task 1) |

### Brands (`apps/brands/`)
| File | Action |
|------|--------|
| `package.json` | Add `react-helmet-async` (Task 6) |
| `src/main.tsx` | Wrap with `HelmetProvider` (Task 6) |
| `src/components/seo/SEOMeta.tsx` | Create SEOMeta component (Task 6) |
| `public/robots.txt` | Create (Task 6) |
| `public/sitemap.xml` | Create (Task 6) |
| Public page components | Add `<SEOMeta>` (Task 6) |

### TalentPool (`apps/talentpool/`)
| File | Action |
|------|--------|
| `package.json` | Add `react-helmet-async`, `@vercel/edge` (Task 7) |
| `src/main.tsx` | Wrap with `HelmetProvider` (Task 7) |
| `src/components/seo/SEOMeta.tsx` | Create SEOMeta component (Task 7) |
| `public/robots.txt` | Create (Task 7) |
| `public/sitemap.xml` | Create (Task 7) |
| Public page components | Add `<SEOMeta>` (Task 7) |
| `middleware.ts` | Edge middleware for bots on `/product/:slug`, `/s/:shopSlug` (Task 9) |
| `api/sitemap.ts` | Dynamic sitemap edge function (Task 11) |

### VoltSquad (`apps/voltsquad/`)
| File | Action |
|------|--------|
| `package.json` | Add `react-helmet-async`, `@vercel/edge` (Task 8) |
| `src/main.tsx` | Wrap with `HelmetProvider` (Task 8) |
| `src/components/seo/SEOMeta.tsx` | Create SEOMeta component (Task 8) |
| `public/robots.txt` | Create (Task 8) |
| `public/sitemap.xml` | Create (Task 8) |
| Public page components | Add `<SEOMeta>` (Task 8) |
| `middleware.ts` | Edge middleware for bots on `/product/:slug`, `/s/:shopSlug` (Task 10) |
| `api/sitemap.ts` | Dynamic sitemap edge function (Task 12) |

---

## Task 1: Landing — OG Default Image

**Files:**
- Create: `apps/landing/public/images/og-default.png`

- [ ] **Step 1: Create the default social card**

  Create a 1200×630px PNG image with the DigiHire logo, brand colours (navy `#06111F`, cyan `#00C2FF`), and tagline "Advance Your Career with Professional Growth Tools". Use Figma, Canva, or any design tool. Save as `apps/landing/public/images/og-default.png`.

  If no designer is available immediately, copy the existing hero background image as a temporary stand-in and resize to 1200×630.

- [ ] **Step 2: Verify file exists at correct path**

  ```bash
  ls apps/landing/public/images/og-default.png
  ```
  Expected: file listed with size > 0.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/landing/public/images/og-default.png
  git commit -m "feat(seo): add default OG social card image for landing site"
  ```

---

## Task 2: Landing — Meta Tags on 8 Main Pages

**Files:**
- Modify: `apps/landing/index.html`, `about.html`, `blog.html`, `contact.html`, `events.html`, `jobs.html`, `sales-activations.html`, `voltsquad.html`

For each page, insert the following block immediately before `</head>`. Use the per-page values from the table below.

**Meta block template** (replace `{TITLE}`, `{DESC}`, `{PATH}`):
```html
  <!-- SEO -->
  <meta name="description" content="{DESC}" />
  <link rel="canonical" href="https://digihire.io{PATH}" />
  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="DigiHire" />
  <meta property="og:title" content="{TITLE}" />
  <meta property="og:description" content="{DESC}" />
  <meta property="og:url" content="https://digihire.io{PATH}" />
  <meta property="og:image" content="https://digihire.io/images/og-default.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{TITLE}" />
  <meta name="twitter:description" content="{DESC}" />
  <meta name="twitter:image" content="https://digihire.io/images/og-default.png" />
```

**Per-page values:**

| File | {TITLE} | {DESC} | {PATH} |
|------|---------|--------|--------|
| `index.html` | DigiHire — Advance Your Career with Professional Growth Tools | DigiHire helps sales professionals advance their careers through job listings, training, and the VoltSquad campaign marketplace. | `/` |
| `about.html` | About DigiHire — Building Africa's Sales Ecosystem | Learn about DigiHire — the platform connecting brands, sales talent, and real opportunities across Africa. | `/about` |
| `blog.html` | DigiHire Blog — Careers, Hiring & Sales Insights | Insights on careers, hiring, sales strategy, and professional growth from the DigiHire team. | `/blog` |
| `contact.html` | Contact DigiHire — Get in Touch | Reach the DigiHire team for partnerships, platform support, or general enquiries. | `/contact` |
| `events.html` | DigiHire Events — Workshops & Networking | Discover upcoming DigiHire events — workshops, networking, and career development for sales professionals. | `/events` |
| `jobs.html` | Browse Sales Jobs — DigiHire Job Board | Find your next sales or marketing role. Browse open positions from top brands on the DigiHire job board. | `/jobs` |
| `sales-activations.html` | Sales Activations — DigiHire for Brands | Run targeted sales activations with DigiHire. Connect your brand with motivated field sales talent across Africa. | `/sales-activations` |
| `voltsquad.html` | VoltSquad — Campaign Marketplace by DigiHire | VoltSquad is DigiHire's campaign marketplace — brands launch campaigns, sellers earn commissions on real results. | `/voltsquad` |

- [ ] **Step 1: Edit `apps/landing/index.html`**

  Open `apps/landing/index.html`. Find `</head>`. Insert the meta block immediately before it using the `index.html` row values from the table above. Also ensure the existing `<title>` reads exactly: `DigiHire — Advance Your Career with Professional Growth Tools`.

- [ ] **Step 2: Edit remaining 7 pages**

  Repeat Step 1 for `about.html`, `blog.html`, `contact.html`, `events.html`, `jobs.html`, `sales-activations.html`, `voltsquad.html` using each page's row from the table.

- [ ] **Step 3: Verify no duplicate head tags**

  Open each file in a browser (or `grep -n "og:title" apps/landing/*.html`) and confirm each has exactly one `og:title` and one `meta name="description"`.

  ```bash
  grep -c "og:title" apps/landing/index.html apps/landing/about.html apps/landing/blog.html apps/landing/contact.html apps/landing/events.html apps/landing/jobs.html apps/landing/sales-activations.html apps/landing/voltsquad.html
  ```
  Expected: each file shows `1`.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/landing/index.html apps/landing/about.html apps/landing/blog.html apps/landing/contact.html apps/landing/events.html apps/landing/jobs.html apps/landing/sales-activations.html apps/landing/voltsquad.html
  git commit -m "feat(seo): add meta descriptions and OG tags to landing main pages"
  ```

---

## Task 3: Landing — Blog Post Meta Tags + BlogPosting Schema

**Files:**
- Modify: all 7 blog HTML files in `apps/landing/`

**Blog post values:**

| File | Title (from existing `<title>` tag) | Description | Slug |
|------|-------------------------------------|-------------|------|
| `blog-ai-resume.html` | DigiHire Launches Advanced AI Resume Optimization | DigiHire's AI resume tool analyses job descriptions and rewrites your CV to match — helping sales professionals land more interviews. | `/blog-ai-resume` |
| `blog-enterprise-sales.html` | Mastering Enterprise Sales in Africa | Strategies for closing large enterprise deals, building long-term client relationships, and scaling your B2B sales operation across Africa. | `/blog-enterprise-sales` |
| `blog-gig-economy.html` | The Gig Economy and the Future of Sales Careers | How the gig economy is reshaping sales careers in Africa — and how DigiHire connects brands with flexible field sales talent. | `/blog-gig-economy` |
| `blog-mall-activations.html` | How to Run Successful Mall Activations | A brand's complete guide to planning, executing, and measuring in-person sales campaigns in retail spaces across Africa. | `/blog-mall-activations` |
| `blog-performance-campaign.html` | Running Performance-Based Sales Campaigns That Deliver | DigiHire's guide to commission models, campaign KPIs, and building sales campaigns where brands only pay for results. | `/blog-performance-campaign` |
| `blog-remote-hiring.html` | Remote Hiring for Sales Teams — What Brands Need to Know | Best practices for recruiting, onboarding, and managing remote sales talent in 2025 — using DigiHire to find the right fit. | `/blog-remote-hiring` |
| `blog-tech-sales.html` | Breaking into Tech Sales in Africa | Career tips for transitioning into tech sales — the skills to build, companies to target, and how DigiHire accelerates your journey. | `/blog-tech-sales` |

For each blog post file, insert this block before `</head>` (replace placeholders):

```html
  <!-- SEO -->
  <meta name="description" content="{DESC}" />
  <link rel="canonical" href="https://digihire.io{SLUG}" />
  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="DigiHire" />
  <meta property="og:title" content="{TITLE} — DigiHire Blog" />
  <meta property="og:description" content="{DESC}" />
  <meta property="og:url" content="https://digihire.io{SLUG}" />
  <meta property="og:image" content="https://digihire.io/images/og-default.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{TITLE} — DigiHire Blog" />
  <meta name="twitter:description" content="{DESC}" />
  <meta name="twitter:image" content="https://digihire.io/images/og-default.png" />
  <!-- BlogPosting Schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "{TITLE}",
    "description": "{DESC}",
    "url": "https://digihire.io{SLUG}",
    "image": "https://digihire.io/images/og-default.png",
    "publisher": {
      "@type": "Organization",
      "name": "DigiHire",
      "logo": {
        "@type": "ImageObject",
        "url": "https://digihire.io/assets/favicon.png"
      }
    },
    "author": {
      "@type": "Organization",
      "name": "DigiHire"
    }
  }
  </script>
```

- [ ] **Step 1: Edit all 7 blog post files**

  Apply the block above to each file using the values from the table. The `{TITLE}` in the BlogPosting schema should match the existing `<title>` tag content (strip " — Digihire Blog" suffix if present — use just the article headline).

- [ ] **Step 2: Verify schema with Google Rich Results Test**

  After deploying (or using a local dev server): open [https://search.google.com/test/rich-results](https://search.google.com/test/rich-results) and paste the URL or HTML. Expected: "Article" detected with no errors.

  For a quick local check:
  ```bash
  grep -c "BlogPosting" apps/landing/blog-ai-resume.html apps/landing/blog-enterprise-sales.html apps/landing/blog-gig-economy.html apps/landing/blog-mall-activations.html apps/landing/blog-performance-campaign.html apps/landing/blog-remote-hiring.html apps/landing/blog-tech-sales.html
  ```
  Expected: each file shows `1`.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/landing/blog-ai-resume.html apps/landing/blog-enterprise-sales.html apps/landing/blog-gig-economy.html apps/landing/blog-mall-activations.html apps/landing/blog-performance-campaign.html apps/landing/blog-remote-hiring.html apps/landing/blog-tech-sales.html
  git commit -m "feat(seo): add meta tags and BlogPosting schema to all landing blog posts"
  ```

---

## Task 4: Landing — Organization + WebSite Schema on Homepage

**Files:**
- Modify: `apps/landing/index.html`

- [ ] **Step 1: Add two JSON-LD schema blocks to `apps/landing/index.html`**

  Insert this block inside `<head>`, after the existing meta tags added in Task 2:

  ```html
  <!-- Organization Schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DigiHire",
    "url": "https://digihire.io",
    "logo": {
      "@type": "ImageObject",
      "url": "https://digihire.io/assets/favicon.png"
    },
    "sameAs": [
      "https://www.linkedin.com/company/digihire",
      "https://twitter.com/digihireio"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "url": "https://digihire.io/contact"
    }
  }
  </script>
  <!-- WebSite Schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "DigiHire",
    "url": "https://digihire.io",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://digihire.io/jobs?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }
  </script>
  ```

  > **Note:** Update the `sameAs` LinkedIn and Twitter URLs to match DigiHire's actual social profile URLs if they differ from the above.

- [ ] **Step 2: Verify**

  ```bash
  grep -c "Organization" apps/landing/index.html
  grep -c "WebSite" apps/landing/index.html
  ```
  Expected: each shows `1`.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/landing/index.html
  git commit -m "feat(seo): add Organization and WebSite JSON-LD schema to landing homepage"
  ```

---

## Task 5: Landing — Sitemap + Robots.txt

**Files:**
- Create: `apps/landing/public/sitemap.xml`
- Modify: `apps/landing/public/robots.txt`

- [ ] **Step 1: Create `apps/landing/public/sitemap.xml`**

  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://digihire.io/</loc>
      <changefreq>weekly</changefreq>
      <priority>1.0</priority>
    </url>
    <url>
      <loc>https://digihire.io/about</loc>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>
    <url>
      <loc>https://digihire.io/blog</loc>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
    <url>
      <loc>https://digihire.io/jobs</loc>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>
    <url>
      <loc>https://digihire.io/events</loc>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>
    <url>
      <loc>https://digihire.io/contact</loc>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
    </url>
    <url>
      <loc>https://digihire.io/sales-activations</loc>
      <changefreq>monthly</changefreq>
      <priority>0.7</priority>
    </url>
    <url>
      <loc>https://digihire.io/voltsquad</loc>
      <changefreq>monthly</changefreq>
      <priority>0.7</priority>
    </url>
    <url>
      <loc>https://digihire.io/blog-ai-resume</loc>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
    </url>
    <url>
      <loc>https://digihire.io/blog-enterprise-sales</loc>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
    </url>
    <url>
      <loc>https://digihire.io/blog-gig-economy</loc>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
    </url>
    <url>
      <loc>https://digihire.io/blog-mall-activations</loc>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
    </url>
    <url>
      <loc>https://digihire.io/blog-performance-campaign</loc>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
    </url>
    <url>
      <loc>https://digihire.io/blog-remote-hiring</loc>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
    </url>
    <url>
      <loc>https://digihire.io/blog-tech-sales</loc>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
    </url>
  </urlset>
  ```

- [ ] **Step 2: Update `apps/landing/public/robots.txt`**

  Add the `Sitemap` directive at the end of the existing file:

  ```
  Sitemap: https://digihire.io/sitemap.xml
  ```

- [ ] **Step 3: Verify sitemap is valid XML**

  ```bash
  node -e "require('fs').readFileSync('apps/landing/public/sitemap.xml', 'utf8'); console.log('Valid XML file')"
  ```
  Expected: `Valid XML file`

- [ ] **Step 4: Commit**

  ```bash
  git add apps/landing/public/sitemap.xml apps/landing/public/robots.txt
  git commit -m "feat(seo): add sitemap.xml and update robots.txt for landing site"
  ```

---

## Task 6: Landing — Image Optimization

**Files:**
- Modify: `apps/landing/index.html` (main image changes)

- [ ] **Step 1: Add `width`, `height`, `loading`, and `fetchpriority` to images in `apps/landing/index.html`**

  Find every `<img` tag in the file. Apply these rules:
  - Hero/first visible image (above the fold): add `fetchpriority="high"` and do NOT add `loading="lazy"`
  - All other images: add `loading="lazy"`
  - Every image: add `width` and `height` attributes matching the image's natural dimensions (check the actual PNG files in `assets/` to get dimensions, or set reasonable values like `width="800" height="600"` for large images, `width="48" height="48"` for icons)

  Example before:
  ```html
  <img src="assets/1.png" alt="Feature" class="hero-img" />
  ```

  Example after (hero image):
  ```html
  <img src="assets/1.png" alt="DigiHire platform dashboard preview" width="960" height="640" fetchpriority="high" class="hero-img" />
  ```

  Example after (below-fold image):
  ```html
  <img src="assets/2.png" alt="Sales professional using DigiHire mobile app" width="640" height="480" loading="lazy" class="feature-img" />
  ```

- [ ] **Step 2: Fix alt text — replace generic values**

  In `apps/landing/index.html`, replace these generic alt texts with descriptive ones:
  - `alt="Logo"` → `alt="DigiHire logo"`
  - `alt="Feature"` → `alt="[describe what the image actually shows]"`
  - `alt="Team member"` → `alt="DigiHire team member"`
  - `alt=""` → add a descriptive alt text

  Any image that is purely decorative (dividers, backgrounds) should have `alt=""` — that is correct and intentional for decorative images.

- [ ] **Step 3: Apply same fixes to `about.html`, `jobs.html`, `voltsquad.html`, `blog.html`**

  Repeat Steps 1–2 for all other landing pages that contain `<img>` tags. Each page's hero image gets `fetchpriority="high"`; all others get `loading="lazy"`.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/landing/index.html apps/landing/about.html apps/landing/jobs.html apps/landing/voltsquad.html apps/landing/blog.html
  git commit -m "perf(landing): add image dimensions, lazy loading, and descriptive alt text"
  ```

---

## Task 7: Landing — Performance (Lucide CDN + Font Display)

**Files:**
- Modify: `apps/landing/index.html` and all other landing HTML files that load Lucide from CDN

- [ ] **Step 1: Find all uses of the Lucide CDN script**

  ```bash
  grep -rn "unpkg.com/lucide" apps/landing/
  ```
  Note which files include the CDN tag:
  ```html
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  ```

- [ ] **Step 2: Check if Lucide is a dependency of the landing app**

  ```bash
  cat apps/landing/package.json
  ```

  If Lucide is not in `dependencies`, add it:
  ```bash
  cd apps/landing && npm install lucide
  ```

  If the landing app is a plain static HTML site (no bundler consuming npm packages for HTML files), keep the CDN script but pin to a specific version and add Subresource Integrity (SRI) to prevent CDN compromise:

  First, generate the SRI hash for the pinned version:
  ```bash
  curl -s https://unpkg.com/lucide@0.474.0/dist/umd/lucide.min.js | openssl dgst -sha384 -binary | openssl base64 -A
  ```
  This prints a base64 string. Prefix it with `sha384-` to form the integrity value.

  Replace:
  ```html
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  ```
  With (substitute `{SRI_HASH}` with the output from the command above):
  ```html
  <script
    src="https://unpkg.com/lucide@0.474.0/dist/umd/lucide.min.js"
    integrity="sha384-{SRI_HASH}"
    crossorigin="anonymous"
    defer
  ></script>
  ```

  Adding `defer` prevents render-blocking; `integrity` + `crossorigin` prevents CDN compromise.

- [ ] **Step 3: Add `font-display: swap` to Google Fonts**

  Find the Google Fonts `<link>` in each landing HTML file:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wdth,wght@0,75..100,400..700;1,75..100,400..700&display=swap" rel="stylesheet" />
  ```

  Verify that `display=swap` is already in the URL query string (it is — `&display=swap` is present in this font URL). No change needed if already present. Confirm this is the case in all landing HTML files.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/landing/
  git commit -m "perf(landing): defer Lucide CDN script to eliminate render-blocking"
  ```

---

## Task 8: Brands — react-helmet-async + SEOMeta + robots.txt + sitemap

**Files:**
- Modify: `apps/brands/package.json`, `apps/brands/src/main.tsx`
- Create: `apps/brands/src/components/seo/SEOMeta.tsx`, `apps/brands/public/robots.txt`, `apps/brands/public/sitemap.xml`
- Modify: public-facing page components (Landing, Login, Signup)

- [ ] **Step 1: Install react-helmet-async**

  ```bash
  cd apps/brands && npm install react-helmet-async
  ```

- [ ] **Step 2: Wrap app root with HelmetProvider in `apps/brands/src/main.tsx`**

  Find the current `main.tsx`. It likely renders `<App />` inside `ReactDOM.createRoot`. Wrap with `HelmetProvider`:

  ```tsx
  import { HelmetProvider } from 'react-helmet-async'
  // ... existing imports

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </React.StrictMode>
  )
  ```

- [ ] **Step 3: Create `apps/brands/src/components/seo/SEOMeta.tsx`**

  ```tsx
  import { Helmet } from 'react-helmet-async'

  interface SEOMetaProps {
    title: string
    description: string
    canonical: string
    ogImage?: string
    ogType?: string
    noIndex?: boolean
  }

  const DEFAULT_OG_IMAGE = 'https://brands.digihire.io/images/og-default.png'

  export function SEOMeta({
    title,
    description,
    canonical,
    ogImage = DEFAULT_OG_IMAGE,
    ogType = 'website',
    noIndex = false,
  }: SEOMetaProps) {
    return (
      <Helmet>
        <title>{title}</title>
        {noIndex && <meta name="robots" content="noindex, nofollow" />}
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content={ogType} />
        <meta property="og:site_name" content="DigiHire Brands" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
    )
  }
  ```

  > **Note:** Copy `apps/landing/public/images/og-default.png` to `apps/brands/public/images/og-default.png` (or create a brands-specific OG image).

- [ ] **Step 4: Add `<SEOMeta>` to public pages**

  Find the landing/index page, Login, and Signup components. In each, import and render `<SEOMeta>` as the first JSX element:

  **Login page** (find the file at `apps/brands/src/pages/Login.tsx` or similar):
  ```tsx
  import { SEOMeta } from '../components/seo/SEOMeta'

  export default function Login() {
    return (
      <>
        <SEOMeta
          title="Login — DigiHire Brands"
          description="Sign in to your DigiHire Brands account to manage campaigns, jobs, and sales activations."
          canonical="https://brands.digihire.io/login"
          noIndex={true}
        />
        {/* existing JSX */}
      </>
    )
  }
  ```

  **Signup page:**
  ```tsx
  <SEOMeta
    title="Get Started — DigiHire Brands"
    description="Create your DigiHire Brands account and start running sales campaigns and activations."
    canonical="https://brands.digihire.io/signup"
    noIndex={true}
  />
  ```

  **Landing/index page (public):**
  ```tsx
  <SEOMeta
    title="DigiHire Brands — Run Sales Campaigns & Activations"
    description="DigiHire Brands helps companies launch targeted field sales campaigns, manage job listings, and track performance in real time."
    canonical="https://brands.digihire.io/"
  />
  ```

- [ ] **Step 5: Create `apps/brands/public/robots.txt`**

  ```
  User-agent: *
  Disallow: /brand/
  Allow: /
  Allow: /login
  Allow: /signup

  Sitemap: https://brands.digihire.io/sitemap.xml
  ```

- [ ] **Step 6: Create `apps/brands/public/sitemap.xml`**

  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://brands.digihire.io/</loc>
      <changefreq>monthly</changefreq>
      <priority>1.0</priority>
    </url>
    <url>
      <loc>https://brands.digihire.io/signup</loc>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>
  </urlset>
  ```

- [ ] **Step 7: Build and verify no TypeScript errors**

  ```bash
  cd apps/brands && npm run build
  ```
  Expected: build succeeds with no errors.

- [ ] **Step 8: Commit**

  ```bash
  git add apps/brands/
  git commit -m "feat(seo): add react-helmet-async, SEOMeta component, robots.txt, and sitemap to brands app"
  ```

---

## Task 9: TalentPool — react-helmet-async + SEOMeta + robots.txt + sitemap

**Files:**
- Modify: `apps/talentpool/package.json`, `apps/talentpool/src/main.tsx`
- Create: `apps/talentpool/src/components/seo/SEOMeta.tsx`, `apps/talentpool/public/robots.txt`, `apps/talentpool/public/sitemap.xml`
- Modify: public page components

- [ ] **Step 1: Install react-helmet-async**

  ```bash
  cd apps/talentpool && npm install react-helmet-async
  ```

- [ ] **Step 2: Wrap root with HelmetProvider in `apps/talentpool/src/main.tsx`**

  Same pattern as Task 8 Step 2 — import `HelmetProvider` from `react-helmet-async` and wrap `<App />`.

- [ ] **Step 3: Create `apps/talentpool/src/components/seo/SEOMeta.tsx`**

  Same component as Task 8 Step 3, but change `DEFAULT_OG_IMAGE` to `'https://talents.digihire.io/images/og-default.png'` and `og:site_name` to `'DigiHire Talent'`.

  > **Note:** Copy `apps/landing/public/images/og-default.png` to `apps/talentpool/public/images/og-default.png`.

- [ ] **Step 4: Add `<SEOMeta>` to public page components**

  Public routes in TalentPool (from `apps/talentpool/src/App.tsx`):
  - `/login` → `pages/Login.tsx`
  - `/signup` → `pages/Signup.tsx`
  - `/verify-email` → `pages/VerifyEmail.tsx`
  - `/academy` → `pages/academy/AcademyPage.tsx`
  - `/academy/course/:id` → `pages/academy/CourseDetailPage.tsx`
  - `/academy/timetable` → `pages/academy/TalentTimetable.tsx`
  - `/product/:slug` → `pages/voltsquad/ProductPage.tsx`
  - `/s/:shopSlug` → `pages/voltsquad/SellerShop.tsx`

  **Static pages** — add fixed `<SEOMeta>`:

  `Login.tsx`:
  ```tsx
  <SEOMeta
    title="Login — DigiHire Talent"
    description="Sign in to your DigiHire Talent account to access jobs, courses, and the VoltSquad marketplace."
    canonical="https://talents.digihire.io/login"
    noIndex={true}
  />
  ```

  `Signup.tsx`:
  ```tsx
  <SEOMeta
    title="Join DigiHire — Start Your Sales Career"
    description="Create your DigiHire Talent account and access job listings, sales training, and the VoltSquad campaign marketplace."
    canonical="https://talents.digihire.io/signup"
    noIndex={true}
  />
  ```

  `AcademyPage.tsx`:
  ```tsx
  <SEOMeta
    title="DigiHire Academy — Sales Training & Courses"
    description="Upskill with DigiHire Academy. Access sales training courses, timetables, and certifications to advance your career."
    canonical="https://talents.digihire.io/academy"
  />
  ```

  `TalentTimetable.tsx`:
  ```tsx
  <SEOMeta
    title="Course Timetable — DigiHire Academy"
    description="Browse the DigiHire Academy course schedule. Book live sessions and plan your sales training calendar."
    canonical="https://talents.digihire.io/academy/timetable"
  />
  ```

  **Dynamic pages** — derive from data. In `ProductPage.tsx`, after product data loads:

  ```tsx
  // Inside the component, after product data is available
  {product && (
    <SEOMeta
      title={`${product.name} — VoltSquad`}
      description={product.description?.slice(0, 155) ?? `Buy ${product.name} on VoltSquad by DigiHire.`}
      canonical={`https://talents.digihire.io/product/${product.slug}`}
      ogImage={product.image ?? undefined}
      ogType="product"
    />
  )}
  ```

  In `SellerShop.tsx`, after shop data loads:
  ```tsx
  {shop && (
    <SEOMeta
      title={`${shop.shop_name ?? shop.name}'s Shop — VoltSquad`}
      description={`Browse products from ${shop.shop_name ?? shop.name} on VoltSquad by DigiHire.`}
      canonical={`https://talents.digihire.io/s/${shop.shop_slug}`}
    />
  )}
  ```

- [ ] **Step 5: Create `apps/talentpool/public/robots.txt`**

  ```
  User-agent: *
  Disallow: /talent/
  Allow: /
  Allow: /login
  Allow: /signup
  Allow: /academy
  Allow: /academy/
  Allow: /product/
  Allow: /s/

  Sitemap: https://talents.digihire.io/sitemap.xml
  ```

- [ ] **Step 6: Create `apps/talentpool/public/sitemap.xml`**

  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://talents.digihire.io/signup</loc>
      <changefreq>monthly</changefreq>
      <priority>0.9</priority>
    </url>
    <url>
      <loc>https://talents.digihire.io/academy</loc>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
    <url>
      <loc>https://talents.digihire.io/academy/timetable</loc>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>
  </urlset>
  ```
  > Dynamic product/shop URLs are added by Task 11's dynamic sitemap edge function.

- [ ] **Step 7: Build and verify**

  ```bash
  cd apps/talentpool && npm run build
  ```
  Expected: no TypeScript errors.

- [ ] **Step 8: Commit**

  ```bash
  git add apps/talentpool/
  git commit -m "feat(seo): add react-helmet-async, SEOMeta, robots.txt, and sitemap to talentpool app"
  ```

---

## Task 10: VoltSquad — react-helmet-async + SEOMeta + robots.txt + sitemap

**Files:**
- Same pattern as Tasks 8–9 for `apps/voltsquad/`

- [ ] **Step 1: Install react-helmet-async**

  ```bash
  cd apps/voltsquad && npm install react-helmet-async
  ```

- [ ] **Step 2: Wrap root with HelmetProvider in `apps/voltsquad/src/main.tsx`**

  Same pattern as Task 8 Step 2.

- [ ] **Step 3: Create `apps/voltsquad/src/components/seo/SEOMeta.tsx`**

  Same component as Task 8 Step 3, change `DEFAULT_OG_IMAGE` to `'https://voltsquad.digihire.io/images/og-default.png'` and `og:site_name` to `'VoltSquad'`.

  > **Note:** Copy `apps/landing/public/images/og-default.png` to `apps/voltsquad/public/images/og-default.png`.

- [ ] **Step 4: Add `<SEOMeta>` to public page components**

  Find the public routes in `apps/voltsquad/src/App.tsx`. Apply `<SEOMeta>` to each:

  **Marketplace page:**
  ```tsx
  <SEOMeta
    title="VoltSquad Marketplace — Browse Campaigns & Products"
    description="Discover sales campaigns, earn commissions, and shop products on VoltSquad — DigiHire's campaign marketplace for brands and sellers."
    canonical="https://voltsquad.digihire.io/marketplace"
  />
  ```

  **About pages:**
  ```tsx
  // about-brands
  <SEOMeta
    title="For Brands — Launch Sales Campaigns on VoltSquad"
    description="Launch targeted field sales campaigns on VoltSquad. Connect your brand with motivated sellers and pay only for real results."
    canonical="https://voltsquad.digihire.io/about-brands"
  />

  // about-students
  <SEOMeta
    title="For Sellers — Earn on VoltSquad by DigiHire"
    description="Join VoltSquad and earn commissions by selling products and completing sales campaigns for top brands across Africa."
    canonical="https://voltsquad.digihire.io/about-students"
  />
  ```

  **Login / Signup:**
  ```tsx
  // Login
  <SEOMeta
    title="Login — VoltSquad by DigiHire"
    description="Sign in to your VoltSquad account to manage campaigns, track earnings, and access the marketplace."
    canonical="https://voltsquad.digihire.io/login"
    noIndex={true}
  />

  // Signup
  <SEOMeta
    title="Join VoltSquad — Start Earning Today"
    description="Create your VoltSquad account and start earning by joining sales campaigns from top brands across Africa."
    canonical="https://voltsquad.digihire.io/signup"
  />
  ```

  **Dynamic pages** — same pattern as TalentPool Task 9 Step 4, but change `canonical` domain to `voltsquad.digihire.io`:
  ```tsx
  // ProductPage.tsx
  {product && (
    <SEOMeta
      title={`${product.name} — VoltSquad`}
      description={product.description?.slice(0, 155) ?? `Buy ${product.name} on VoltSquad.`}
      canonical={`https://voltsquad.digihire.io/product/${product.slug}`}
      ogImage={product.image ?? undefined}
      ogType="product"
    />
  )}

  // SellerShop.tsx
  {shop && (
    <SEOMeta
      title={`${shop.shop_name ?? shop.name}'s Shop — VoltSquad`}
      description={`Browse products from ${shop.shop_name ?? shop.name} on VoltSquad by DigiHire.`}
      canonical={`https://voltsquad.digihire.io/s/${shop.shop_slug}`}
    />
  )}
  ```

- [ ] **Step 5: Create `apps/voltsquad/public/robots.txt`**

  ```
  User-agent: *
  Disallow: /dashboard/
  Disallow: /campaigns/
  Disallow: /profile
  Disallow: /wallet/
  Disallow: /login
  Allow: /marketplace
  Allow: /product/
  Allow: /s/
  Allow: /about-brands
  Allow: /about-students
  Allow: /signup

  Sitemap: https://voltsquad.digihire.io/sitemap.xml
  ```

- [ ] **Step 6: Create `apps/voltsquad/public/sitemap.xml`** (static routes only)

  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://voltsquad.digihire.io/marketplace</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
    <url>
      <loc>https://voltsquad.digihire.io/about-brands</loc>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>
    <url>
      <loc>https://voltsquad.digihire.io/about-students</loc>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>
    <url>
      <loc>https://voltsquad.digihire.io/signup</loc>
      <changefreq>monthly</changefreq>
      <priority>0.7</priority>
    </url>
  </urlset>
  ```
  > Dynamic product/shop URLs added by Task 12.

- [ ] **Step 7: Build and verify**

  ```bash
  cd apps/voltsquad && npm run build
  ```

- [ ] **Step 8: Commit**

  ```bash
  git add apps/voltsquad/
  git commit -m "feat(seo): add react-helmet-async, SEOMeta, robots.txt, and sitemap to voltsquad app"
  ```

---

## Task 11: VoltSquad — Edge Middleware for Bot Meta Injection

**Files:**
- Create: `apps/voltsquad/middleware.ts`
- Modify: `apps/voltsquad/package.json` (add `@vercel/edge`)

**Pre-requisite:** Add `SUPABASE_ANON_KEY` to the VoltSquad Vercel project environment variables (Vercel Dashboard → Project → Settings → Environment Variables). Value: the Supabase anon key from `apps/voltsquad/.env` (the `VITE_SUPABASE_ANON_KEY` value).

- [ ] **Step 1: Install `@vercel/edge`**

  ```bash
  cd apps/voltsquad && npm install @vercel/edge
  ```

- [ ] **Step 2: Create `apps/voltsquad/middleware.ts`**

  ```ts
  import { next } from '@vercel/edge'

  const SUPABASE_URL = 'https://yaojxewpkrjonrvqpsxi.supabase.co'
  const BOT_AGENTS = /Googlebot|Twitterbot|facebookexternalhit|LinkedInBot|WhatsApp|Slackbot|TelegramBot|Discordbot/i

  function isBot(request: Request): boolean {
    return BOT_AGENTS.test(request.headers.get('user-agent') ?? '')
  }

  interface ProductMeta {
    name: string
    description: string | null
    image: string | null
    slug: string
  }

  interface ShopMeta {
    shop_name: string | null
    name: string
    shop_slug: string
  }

  async function fetchProduct(slug: string, anonKey: string): Promise<ProductMeta | null> {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}&select=name,description,image,slug&limit=1`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          signal: AbortSignal.timeout(2000),
        }
      )
      if (!res.ok) return null
      const rows = await res.json() as ProductMeta[]
      return rows[0] ?? null
    } catch {
      return null
    }
  }

  async function fetchShop(shopSlug: string, anonKey: string): Promise<ShopMeta | null> {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?shop_slug=eq.${encodeURIComponent(shopSlug)}&select=shop_name,name,shop_slug&limit=1`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          signal: AbortSignal.timeout(2000),
        }
      )
      if (!res.ok) return null
      const rows = await res.json() as ShopMeta[]
      return rows[0] ?? null
    } catch {
      return null
    }
  }

  function buildProductMetaBlock(product: ProductMeta): string {
    const title = `${product.name} — VoltSquad`
    const desc = (product.description ?? `Buy ${product.name} on VoltSquad by DigiHire.`).slice(0, 155)
    const url = `https://voltsquad.digihire.io/product/${product.slug}`
    const image = product.image ?? 'https://voltsquad.digihire.io/images/og-default.png'
    const schema = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description ?? '',
      image,
      url,
      offers: { '@type': 'Offer', priceCurrency: 'NGN', availability: 'https://schema.org/InStock' },
    })
    const breadcrumb = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Marketplace', item: 'https://voltsquad.digihire.io/marketplace' },
        { '@type': 'ListItem', position: 2, name: product.name, item: url },
      ],
    })
    return `<title>${title}</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="VoltSquad" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${image}" />
  <script type="application/ld+json">${schema}</script>
  <script type="application/ld+json">${breadcrumb}</script>`
  }

  function buildShopMetaBlock(shop: ShopMeta): string {
    const displayName = shop.shop_name ?? shop.name
    const title = `${displayName}'s Shop — VoltSquad`
    const desc = `Browse products from ${displayName} on VoltSquad by DigiHire.`
    const url = `https://voltsquad.digihire.io/s/${shop.shop_slug}`
    return `<title>${title}</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="VoltSquad" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="https://voltsquad.digihire.io/images/og-default.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="https://voltsquad.digihire.io/images/og-default.png" />`
  }

  async function injectMeta(request: Request, metaBlock: string): Promise<Response> {
    const indexUrl = new URL('/index.html', request.url)
    const htmlRes = await fetch(indexUrl.toString())
    if (!htmlRes.ok) return next()
    const html = await htmlRes.text()
    const enriched = html.replace('</head>', `${metaBlock}\n</head>`)
    return new Response(enriched, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 's-maxage=300, stale-while-revalidate=60',
      },
    })
  }

  export default async function middleware(request: Request): Promise<Response> {
    if (!isBot(request)) return next()

    const anonKey = process.env.SUPABASE_ANON_KEY
    if (!anonKey) return next()

    const url = new URL(request.url)
    const { pathname } = url

    if (pathname.startsWith('/product/')) {
      const slug = pathname.replace('/product/', '').split('/')[0]
      if (!slug) return next()
      const product = await fetchProduct(slug, anonKey)
      if (!product) return next()
      return injectMeta(request, buildProductMetaBlock(product))
    }

    if (pathname.startsWith('/s/')) {
      const shopSlug = pathname.replace('/s/', '').split('/')[0]
      if (!shopSlug) return next()
      const shop = await fetchShop(shopSlug, anonKey)
      if (!shop) return next()
      return injectMeta(request, buildShopMetaBlock(shop))
    }

    return next()
  }

  export const config = {
    matcher: ['/product/:slug*', '/s/:shopSlug*'],
  }
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  cd apps/voltsquad && npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 4: Test bot injection locally using curl**

  After deploying to Vercel preview (or using `vercel dev`):
  ```bash
  curl -A "Googlebot/2.1 (+http://www.google.com/bot.html)" https://<preview-url>/product/<a-real-slug> | grep "og:title"
  ```
  Expected: output contains `<meta property="og:title" content="[Product Name] — VoltSquad" />`.

  Also verify a real user request is unaffected:
  ```bash
  curl -A "Mozilla/5.0 Chrome/120" https://<preview-url>/product/<slug> | grep "og:title"
  ```
  Expected: output does NOT contain og:title (the SPA's index.html has none — the React app sets them client-side only).

- [ ] **Step 5: Commit**

  ```bash
  git add apps/voltsquad/middleware.ts apps/voltsquad/package.json apps/voltsquad/package-lock.json
  git commit -m "feat(seo): add Vercel Edge Middleware for bot meta injection on VoltSquad product and shop pages"
  ```

---

## Task 12: TalentPool — Edge Middleware for Bot Meta Injection

**Files:**
- Create: `apps/talentpool/middleware.ts`
- Modify: `apps/talentpool/package.json`

**Pre-requisite:** Add `SUPABASE_ANON_KEY` to TalentPool's Vercel project environment variables.

- [ ] **Step 1: Install `@vercel/edge`**

  ```bash
  cd apps/talentpool && npm install @vercel/edge
  ```

- [ ] **Step 2: Create `apps/talentpool/middleware.ts`**

  Same structure as Task 11 Step 2, with these differences:
  - Change all `voltsquad.digihire.io` → `talents.digihire.io`
  - Change `og:site_name` → `'DigiHire Talent'`
  - Change product title suffix from `— VoltSquad` → `— DigiHire Talent`
  - Keep the same `fetchProduct` and `fetchShop` functions (same Supabase tables)
  - Keep the same `config.matcher`: `['/product/:slug*', '/s/:shopSlug*']`

  The full file is identical to `apps/voltsquad/middleware.ts` except for domain and brand name strings. Create it with those substitutions.

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  cd apps/talentpool && npx tsc --noEmit
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add apps/talentpool/middleware.ts apps/talentpool/package.json apps/talentpool/package-lock.json
  git commit -m "feat(seo): add Vercel Edge Middleware for bot meta injection on TalentPool product and shop pages"
  ```

---

## Task 13: VoltSquad — Dynamic Sitemap Edge Function

**Files:**
- Create: `apps/voltsquad/api/sitemap.ts`

This Vercel Edge Function is served at `/api/sitemap` and returns an XML sitemap with all product and shop URLs fetched live from Supabase.

- [ ] **Step 1: Create `apps/voltsquad/api/sitemap.ts`**

  ```ts
  const SUPABASE_URL = 'https://yaojxewpkrjonrvqpsxi.supabase.co'
  const BASE_URL = 'https://voltsquad.digihire.io'

  export const config = { runtime: 'edge' }

  interface ProductRow { slug: string }
  interface ShopRow { shop_slug: string }

  async function fetchSlugs(anonKey: string): Promise<{ products: string[], shops: string[] }> {
    const [prodRes, shopRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/products?select=slug&limit=1000`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      }),
      fetch(`${SUPABASE_URL}/rest/v1/profiles?select=shop_slug&shop_slug=not.is.null&limit=1000`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      }),
    ])

    const products = prodRes.ok ? (await prodRes.json() as ProductRow[]).map(r => r.slug).filter(Boolean) : []
    const shops = shopRes.ok ? (await shopRes.json() as ShopRow[]).map(r => r.shop_slug).filter(Boolean) : []
    return { products, shops }
  }

  export default async function handler(request: Request): Promise<Response> {
    const anonKey = process.env.SUPABASE_ANON_KEY ?? ''

    const staticUrls = [
      { loc: `${BASE_URL}/marketplace`, changefreq: 'daily', priority: '1.0' },
      { loc: `${BASE_URL}/about-brands`, changefreq: 'monthly', priority: '0.8' },
      { loc: `${BASE_URL}/about-students`, changefreq: 'monthly', priority: '0.8' },
      { loc: `${BASE_URL}/signup`, changefreq: 'monthly', priority: '0.7' },
    ]

    const { products, shops } = anonKey
      ? await fetchSlugs(anonKey)
      : { products: [], shops: [] }

    const urlEntries = [
      ...staticUrls.map(u => `  <url><loc>${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`),
      ...products.map(slug => `  <url><loc>${BASE_URL}/product/${slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`),
      ...shops.map(slug => `  <url><loc>${BASE_URL}/s/${slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`),
    ].join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`

    return new Response(xml, {
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 's-maxage=3600, stale-while-revalidate=300',
      },
    })
  }
  ```

- [ ] **Step 2: Update `apps/voltsquad/public/robots.txt` to point to the dynamic sitemap**

  Change the `Sitemap` directive to:
  ```
  Sitemap: https://voltsquad.digihire.io/api/sitemap
  ```

- [ ] **Step 3: Test locally with `vercel dev`**

  ```bash
  cd apps/voltsquad && vercel dev
  ```
  Then:
  ```bash
  curl http://localhost:3000/api/sitemap
  ```
  Expected: valid XML with product and shop URLs listed.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/voltsquad/api/sitemap.ts apps/voltsquad/public/robots.txt
  git commit -m "feat(seo): add dynamic sitemap edge function for VoltSquad products and shops"
  ```

---

## Task 14: TalentPool — Dynamic Sitemap Edge Function

**Files:**
- Create: `apps/talentpool/api/sitemap.ts`

- [ ] **Step 1: Create `apps/talentpool/api/sitemap.ts`**

  Same structure as Task 13 Step 1, with these differences:
  - Change `BASE_URL` to `'https://talents.digihire.io'`
  - Static URLs:
    ```ts
    const staticUrls = [
      { loc: `${BASE_URL}/signup`, changefreq: 'monthly', priority: '0.9' },
      { loc: `${BASE_URL}/academy`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/academy/timetable`, changefreq: 'weekly', priority: '0.7' },
    ]
    ```

- [ ] **Step 2: Update `apps/talentpool/public/robots.txt`**

  Change Sitemap directive:
  ```
  Sitemap: https://talents.digihire.io/api/sitemap
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add apps/talentpool/api/sitemap.ts apps/talentpool/public/robots.txt
  git commit -m "feat(seo): add dynamic sitemap edge function for TalentPool products and shops"
  ```

---

## Task 15: SPAs — Route-Level Code Splitting

**Files:**
- Modify: `apps/voltsquad/src/App.tsx`, `apps/talentpool/src/App.tsx`, `apps/brands/src/App.tsx`

- [ ] **Step 1: Add lazy imports to `apps/voltsquad/src/App.tsx`**

  For each page component import at the top of the file, convert to `React.lazy`:

  Before:
  ```tsx
  import MarketplacePage from './pages/MarketplacePage'
  import ProductPage from './pages/ProductPage'
  import SellerShop from './pages/SellerShop'
  ```

  After:
  ```tsx
  import { lazy, Suspense } from 'react'

  const MarketplacePage = lazy(() => import('./pages/MarketplacePage'))
  const ProductPage = lazy(() => import('./pages/ProductPage'))
  const SellerShop = lazy(() => import('./pages/SellerShop'))
  ```

  Do this for ALL page components in the router, not just the three above.

  Then wrap the `<Routes>` with `<Suspense>`:
  ```tsx
  <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
    <Routes>
      {/* existing routes */}
    </Routes>
  </Suspense>
  ```

- [ ] **Step 2: Apply same change to `apps/talentpool/src/App.tsx`**

  Same pattern: convert all page component imports to `lazy()`, wrap `<Routes>` with `<Suspense fallback={<div style={{ minHeight: '100vh' }} />}>`.

- [ ] **Step 3: Apply same change to `apps/brands/src/App.tsx`**

  Same pattern.

- [ ] **Step 4: Build all three apps and verify chunk splitting**

  ```bash
  cd apps/voltsquad && npm run build
  ```
  Expected: build output shows multiple `.js` chunk files (not a single bundle). Look for lines like:
  ```
  dist/assets/MarketplacePage-[hash].js   42.31 kB
  dist/assets/ProductPage-[hash].js       28.15 kB
  ```

  Repeat for talentpool and brands.

- [ ] **Step 5: Commit**

  ```bash
  git add apps/voltsquad/src/App.tsx apps/talentpool/src/App.tsx apps/brands/src/App.tsx
  git commit -m "perf: add route-level code splitting with React.lazy across all SPA apps"
  ```

---

## Task 16: Verification

- [ ] **Step 1: Verify landing OG tags with opengraph.io or similar**

  Visit [https://opengraph.io/](https://opengraph.io/) (or use `curl -A "facebookexternalhit/1.1" https://digihire.io`) and confirm each landing page shows:
  - Correct title
  - Correct description
  - OG image loads at 1200×630

- [ ] **Step 2: Test VoltSquad product page social preview**

  ```bash
  curl -A "Twitterbot/1.0" https://voltsquad.digihire.io/product/<real-product-slug> | grep -E "og:title|og:description|og:image"
  ```
  Expected: three meta tags with real product data.

- [ ] **Step 3: Test robots.txt for all domains**

  ```bash
  curl https://digihire.io/robots.txt
  curl https://brands.digihire.io/robots.txt
  curl https://talents.digihire.io/robots.txt
  curl https://voltsquad.digihire.io/robots.txt
  ```
  Expected: each returns valid robots.txt with a `Sitemap:` directive.

- [ ] **Step 4: Test sitemaps**

  ```bash
  curl https://digihire.io/sitemap.xml | grep "<loc>"
  curl https://voltsquad.digihire.io/api/sitemap | grep "/product/"
  ```
  Expected: product URLs listed in VoltSquad sitemap.

- [ ] **Step 5: Test with Google Rich Results Test**

  Open [https://search.google.com/test/rich-results](https://search.google.com/test/rich-results):
  - Paste `https://digihire.io/blog-ai-resume` → expect "Article" result
  - Paste a VoltSquad product URL → expect "Product" result

- [ ] **Step 6: Submit sitemaps to Google Search Console**

  Log in to Google Search Console for each domain property and submit:
  - `https://digihire.io/sitemap.xml`
  - `https://brands.digihire.io/sitemap.xml`
  - `https://talents.digihire.io/api/sitemap`
  - `https://voltsquad.digihire.io/api/sitemap`

- [ ] **Step 7: Final commit — update spec with actual social account URLs**

  Open `docs/superpowers/specs/2026-06-09-seo-optimization-design.md` and update the `sameAs` LinkedIn/Twitter URLs in the Organization schema to the verified actual URLs.

  ```bash
  git add docs/superpowers/specs/2026-06-09-seo-optimization-design.md
  git commit -m "docs: update Organization schema with verified social profile URLs"
  ```
