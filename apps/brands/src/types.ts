export interface BrandProfile {
  id: string;
  company_name?: string;
  contact_name?: string;
  phone?: string;
  website?: string;
  company_type?: string;
  industry?: string;
  company_size?: string;
  city?: string;
  country?: string;
  primary_goal?: string;
  description?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BrandCampaign {
  id: string;
  brand_id: string;
  campaign_name: string;
  brand_name?: string;
  campaign_goal?: string;
  product_name?: string;
  product_category?: string;
  target_audience?: string;
  city?: string;
  region?: string;
  start_date?: string;
  end_date?: string;
  payout_model?: string;
  target_volume?: number;
  tracking_link?: string;
  notes?: string;
  status: string;
  total_sellers: number;
  total_conversions: number;
  total_leads: number;
  tracking_code?: string;
  asset_urls?: string[];
  created_at: string;
  updated_at: string;
}

export interface RecruitmentRequest {
  id: string;
  brand_id: string;
  contact_person?: string;
  hiring_timeline?: string;
  location?: string;
  industry?: string;
  job_title: string;
  num_hires?: number;
  role_type?: string;
  experience_level?: string;
  industry_preference?: string;
  responsibilities?: string;
  required_skills?: string[];
  salary_min?: number;
  salary_max?: number;
  work_type?: string;
  job_location?: string;
  deadline?: string;
  additional_notes?: string;
  status: string;
  applicant_count: number;
  shortlist_count: number;
  assigned_support?: string;
  created_at: string;
  updated_at: string;
}

export interface JobListing {
  id: string;
  brand_id?: string;
  company_name: string;
  title: string;
  job_type: 'full_time' | 'part_time' | 'contract' | 'gig' | 'internship';
  category: string;
  location?: string;
  work_mode?: 'onsite' | 'remote' | 'hybrid';
  salary_min?: number;
  salary_max?: number;
  pay_type?: 'salary' | 'commission' | 'hourly' | 'per_gig';
  description?: string;
  requirements?: string;
  skills?: string[];
  experience_level?: 'entry' | 'mid' | 'senior' | 'any';
  duration?: string;
  slots?: number;
  deadline?: string;
  status: 'draft' | 'published' | 'closed';
  featured?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivationRequest {
  id: string;
  brand_id: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  activation_type?: string;
  location?: string;
  preferred_start_date?: string;
  preferred_end_date?: string;
  goals?: string;
  approximate_scale?: string;
  notes?: string;
  num_talents?: number;
  talent_types?: string[];
  talent_duties?: string;
  budget_details?: string;
  booking_type: string;
  meeting_slot?: string;
  status: string;
  created_at: string;
  updated_at: string;
}
