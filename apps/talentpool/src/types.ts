export type TalentStatus = 'incomplete' | 'complete' | 'under_review' | 'shortlisted' | 'matched' | 'archived';

export interface TalentProfile {
  id: string;
  full_name: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  city?: string;
  state?: string;
  country?: string;
  preferred_work_location?: string;
  work_preference?: string;
  job_type_preference?: string[];
  role_interests?: string[];
  experience_years?: number;
  industry_experience?: string[];
  bio?: string;
  education?: any[];
  certifications?: any[];
  work_history?: any[];
  skills?: string[];
  languages?: string[];
  linkedin_url?: string;
  portfolio_url?: string;
  cv_url?: string;
  profile_photo_url?: string;
  salary_min?: number;
  salary_max?: number;
  availability?: string;
  gig_availability?: string;
  gig_cities?: string[];
  status: TalentStatus;
  profile_completion?: number;
  created_at?: string;
  updated_at?: string;
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

export interface JobApplication {
  id: string;
  job_id: string;
  talent_id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  cover_note?: string;
  cv_url?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  created_at: string;
  updated_at: string;
  job_listings?: {
    title: string;
    company_name: string;
    job_type: string;
    location?: string;
  };
}

export interface TalentCourse {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  category?: string;
  modules: { title: string; duration_minutes?: number; content?: string; youtube_url?: string }[];
  has_certificate: boolean;
  is_published: boolean;
  created_at?: string;
}

export interface TalentEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  completed_modules: number[];
  completed_at?: string;
  created_at?: string;
}
