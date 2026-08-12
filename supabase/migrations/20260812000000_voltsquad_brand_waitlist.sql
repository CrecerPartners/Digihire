-- Migration for VoltSquad by Digihire Brand Waitlist
CREATE TABLE IF NOT EXISTS public.voltsquad_brand_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  phone TEXT,
  campaign_objective TEXT,
  team_size TEXT,
  notes TEXT,
  status TEXT DEFAULT 'New',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.voltsquad_brand_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow public insertion
CREATE POLICY "Allow anonymous insert for voltsquad_brand_waitlist"
  ON public.voltsquad_brand_waitlist
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated admins to view and update waitlist
CREATE POLICY "Allow admin access to voltsquad_brand_waitlist"
  ON public.voltsquad_brand_waitlist
  FOR ALL
  TO authenticated
  USING (true);
