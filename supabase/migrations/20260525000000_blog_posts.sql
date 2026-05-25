-- Blog posts table for DigiHire CMS
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text,
  cover_image text,
  excerpt text,
  content text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  reading_time integer DEFAULT 5,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast slug lookups (used by landing page dynamic fetch)
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts (slug);
CREATE INDEX IF NOT EXISTS blog_posts_status_published_at_idx ON blog_posts (status, published_at DESC);

-- RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "blog_posts_public_read"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- Authenticated users (admins) can do everything
CREATE POLICY "blog_posts_admin_all"
  ON blog_posts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed the 7 existing static articles so they appear immediately
INSERT INTO blog_posts (title, slug, category, cover_image, excerpt, status, reading_time, published_at) VALUES
(
  'How to Structure a Performance-Based Sales Campaign That Actually Converts',
  'performance-campaign',
  'Sales Strategy',
  'https://plus.unsplash.com/premium_photo-1674586421844-99330bd20c65?w=800&h=600&fit=crop&q=80',
  'Learn the exact framework top-performing brands use to launch commission-based campaigns, activate the right talent, and drive measurable user acquisition without wasting upfront marketing budget.',
  'published',
  7,
  '2026-05-10T00:00:00Z'
),
(
  'Why African Companies Are Winning with Remote-First Hiring',
  'remote-hiring',
  'Recruitment',
  'https://images.unsplash.com/photo-1611432579402-7037e3e2c1e4?w=800&h=600&fit=crop&q=80',
  'Discover how forward-thinking companies are accessing top talent pools across the continent and building distributed teams that outperform.',
  'published',
  6,
  '2026-04-18T00:00:00Z'
),
(
  'DigiHire Launches Advanced AI Resume Optimization',
  'ai-resume',
  'Digihire Updates',
  'https://plus.unsplash.com/premium_photo-1681398563948-c2045c0c8660?w=800&h=600&fit=crop&q=80',
  'Our new AI-powered resume builder helps professionals get past ATS filters and land interviews faster than ever before.',
  'published',
  5,
  '2026-04-12T00:00:00Z'
),
(
  'The Blueprint for High-ROI Mall Activations',
  'mall-activations',
  'Activations',
  'https://plus.unsplash.com/premium_photo-1663957841080-550d9534591a?w=800&h=600&fit=crop&q=80',
  'Field marketing does not have to be guesswork. Here is how to track, measure, and scale physical activations for maximum return.',
  'published',
  8,
  '2026-04-05T00:00:00Z'
),
(
  'How to Break Into Tech Sales with Zero Experience',
  'tech-sales',
  'Talent Growth',
  'https://plus.unsplash.com/premium_photo-1677553953699-e62954777d8f?w=800&h=600&fit=crop&q=80',
  'A practical guide to landing your first tech sales role in Africa''s booming technology sector.',
  'published',
  6,
  '2026-03-28T00:00:00Z'
),
(
  'The Gig Economy is Changing Sales Forever',
  'gig-economy',
  'Future of Work',
  'https://plus.unsplash.com/premium_photo-1707155465391-5cfc46746a34?w=800&h=600&fit=crop&q=80',
  'Why fractional sales professionals and commission-only reps are becoming the standard for rapid growth companies.',
  'published',
  5,
  '2026-03-22T00:00:00Z'
),
(
  'Closing the Enterprise Deal: What Most Reps Get Wrong',
  'enterprise-sales',
  'Sales',
  'https://images.unsplash.com/photo-1610251064409-8d94b0939629?w=800&h=600&fit=crop&q=80',
  'B2B sales cycles can be long and painful. Learn the crucial steps you need to shorten the timeline and close faster.',
  'published',
  7,
  '2026-03-15T00:00:00Z'
)
ON CONFLICT (slug) DO NOTHING;
