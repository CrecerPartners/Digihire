import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase as _supabase, useAuth, uploadFileToR2, RichTextContent } from '@digihire/shared';
import { Card, CardContent } from '@digihire/shared';
import { Badge } from '@digihire/shared';
import { Button } from '@digihire/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@digihire/shared';
import {
  Briefcase, MapPin, Clock, Users, Loader2, Building2,
  Banknote, Star, CheckCircle2, ArrowLeft, Upload, FileText,
  Send, AlertCircle, Share2, Heart, Sparkles, ChevronRight,
  TrendingUp, BarChart2, ExternalLink
} from 'lucide-react';
import { useTalentProfile } from '../../hooks/useTalentProfile';
import Lottie from 'lottie-react';
import successLottie from '../../../public/assets/success-1.json';

const supabase = _supabase as any;

interface BrandProfile {
  id: string;
  company_name?: string;
  industry?: string;
  company_size?: string;
  logo_url?: string;
  description?: string;
  website?: string;
  company_type?: string;
  city?: string;
  country?: string;
}

interface JobListing {
  id: string;
  brand_id?: string;
  company_name: string;
  title: string;
  job_type: string;
  category: string;
  location?: string;
  work_mode?: string;
  salary_min?: number;
  salary_max?: number;
  pay_type?: string;
  description?: string;
  requirements?: string;
  skills?: string[];
  experience_level?: string;
  duration?: string;
  slots?: number;
  deadline?: string;
  featured?: boolean;
  anonymous?: boolean;
  logo_url?: string;
  created_at: string;
  brand_profiles?: BrandProfile;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-Time',
  part_time: 'Part-Time',
  contract: 'Contract',
  gig: 'Gig',
  internship: 'Internship',
};

// The job_listings_public view returns brand fields flattened as brand_* and
// nulls all identity/PII for anonymous listings. Rebuild the nested
// brand_profiles object the UI expects.
function normalizeJob(row: Record<string, unknown>): JobListing {
  const r = row as Record<string, any>;
  return {
    ...r,
    brand_profiles: {
      id: r.brand_id,
      industry: r.brand_industry,
      company_type: r.brand_company_type,
      company_size: r.brand_company_size,
      city: r.brand_city,
      country: r.brand_country,
      description: r.brand_description,
      logo_url: r.brand_logo_url,
      website: r.brand_website,
    },
  } as JobListing;
}

const JOB_TYPE_COLORS: Record<string, string> = {
  full_time: 'text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400',
  part_time: 'text-purple-600 bg-purple-500/10 border-purple-500/20 dark:text-purple-400',
  contract: 'text-orange-600 bg-orange-500/10 border-orange-500/20 dark:text-orange-400',
  gig: 'text-green-600 bg-green-500/10 border-green-500/20 dark:text-green-400',
  internship: 'text-pink-600 bg-pink-500/10 border-pink-500/20 dark:text-pink-400',
};

const WORK_MODE_COLORS: Record<string, string> = {
  remote: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400',
  hybrid: 'text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400',
  onsite: 'text-muted-foreground bg-secondary border-border/50',
};

function formatSalary(min?: number, max?: number, pay_type?: string) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1000 ? `₦${(n / 1000).toFixed(0)}k` : `₦${n}`;
  const range = min && max ? `${fmt(min)} – ${fmt(max)}` : min ? `From ${fmt(min)}` : `Up to ${fmt(max!)}`;
  const suffix = pay_type === 'hourly' ? '/hr' : pay_type === 'per_gig' ? '/gig' : pay_type === 'commission' ? ' (commission)' : '/mo';
  return range + suffix;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { profile } = useTalentProfile();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [similarJobs, setSimilarJobs] = useState<JobListing[]>([]);
  const [activeJobsCount, setActiveJobsCount] = useState<number>(0);
  const [talentInDemandCount, setTalentInDemandCount] = useState<number>(0);
  const [applicantCount, setApplicantCount] = useState<number>(0);
  const [applied, setApplied] = useState(false);

  // Sharing & Favorites
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Apply Form State
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [useStoredCv, setUseStoredCv] = useState(true);
  const [newCvFile, setNewCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  // AI Tailoring State
  const [tailorOpen, setTailorOpen] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [tailorSuggestions, setTailorSuggestions] = useState<string[]>([]);
  const [tailorCoverNote, setTailorCoverNote] = useState('');
  const [tailorError, setTailorError] = useState<string | null>(null);
  const [tailorMatchScore, setTailorMatchScore] = useState<number | null>(null);
  const [tailorMatchingSkills, setTailorMatchingSkills] = useState<string[]>([]);
  const [tailorMissingSkills, setTailorMissingSkills] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchJobData = async () => {
      setLoading(true);
      try {
        // Fetch from the public view (identity/PII stripped for anonymous listings)
        const { data, error } = await supabase
          .from('job_listings_public')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          setJob(null);
          setLoading(false);
          return;
        }

        const jobListing = normalizeJob(data);
        setJob(jobListing);

        // Check if user already applied
        if (user?.id) {
          const { data: appData } = await supabase
            .from('job_applications')
            .select('id')
            .eq('job_id', jobListing.id)
            .eq('talent_id', user.id)
            .maybeSingle();
          setApplied(!!appData);
        }

        // Fetch application count to calculate competition via secure RPC
        const { data: appsCount, error: appsErr } = await supabase
          .rpc('get_job_applicant_count', { job_uuid: jobListing.id });
        if (!appsErr && typeof appsCount === 'number') {
          setApplicantCount(appsCount);
        } else {
          setApplicantCount(0);
        }

        // Fetch active jobs count for this brand (null for anonymous listings)
        if (jobListing.brand_id) {
          const { count: brandJobsCount } = await supabase
            .from('job_listings_public')
            .select('*', { count: 'exact', head: true })
            .eq('brand_id', jobListing.brand_id);
          setActiveJobsCount(brandJobsCount || 1);
        }

        // Fetch similar jobs
        const { data: similarData } = await supabase
          .from('job_listings_public')
          .select('*')
          .eq('category', jobListing.category)
          .neq('id', jobListing.id)
          .limit(3);
        setSimilarJobs((similarData || []).map(normalizeJob));

        // Fetch matching talent count for Category via secure RPC
        const { data: matchingTalents, error: talentErr } = await supabase
          .rpc('get_talent_count_by_category', { category_text: jobListing.category });

        if (!talentErr && typeof matchingTalents === 'number' && matchingTalents > 0) {
          setTalentInDemandCount(matchingTalents);
        } else {
          // Fallback realistic count based on total talent profiles
          const { count: totalTalents } = await supabase
            .from('talent_profiles')
            .select('*', { count: 'exact', head: true });
          const realisticCount = totalTalents ? Math.max(5, Math.floor(totalTalents * 0.18)) : 14;
          setTalentInDemandCount(realisticCount);
        }

      } catch (err) {
        console.error('Error fetching job details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [id, user?.id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = async () => {
    if (!job || !user?.id) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      let cvUrl = useStoredCv ? (profile?.cv_url || '') : '';

      // Upload new CV if provided
      if (!useStoredCv && newCvFile) {
        const fileExt = newCvFile.name.split('.').pop();
        const fileName = `${user.id}/apply-${job.id}-${Date.now()}.${fileExt}`;
        const publicUrl = await uploadFileToR2('talent-assets', fileName, newCvFile);
        cvUrl = publicUrl;
      }

      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          talent_id: user.id,
          full_name: profile?.full_name || (user.user_metadata?.full_name as string) || '',
          email: user.email,
          phone: profile?.phone || '',
          cover_note: coverNote,
          cv_url: cvUrl,
          status: 'pending',
        });

      if (error) throw error;

      setApplied(true);
      setSubmitSuccess(true);
      setApplicantCount(prev => prev + 1);

      // Fire-and-forget application confirmation email (to is derived server-side from JWT)
      supabase.functions.invoke('send-transactional-email', {
        body: {
          type: 'job_application',
          data: {
            jobTitle: job.title,
            company: job.company_name,
            appliedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          },
        },
      }).catch(() => {})
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? (err.message.includes('unique') ? 'You have already applied to this job.' : err.message)
          : 'Application failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const triggerTailorCV = async () => {
    if (!job) return;
    setTailorOpen(true);
    setTailoring(true);
    setTailorError(null);

    try {
      const { data, error } = await supabase.functions.invoke('tailor-cv', {
        body: {
          job: {
            title: job.title,
            company: job.anonymous ? 'Confidential' : job.company_name,
            category: job.category,
            description: job.description,
            requirements: job.requirements,
            skills: job.skills,
            work_mode: job.work_mode,
          },
          // Fallback only — the edge function fetches the authoritative
          // profile server-side from talent_profiles.
          profile: {
            full_name: profile?.full_name,
            bio: profile?.bio,
            skills: profile?.skills,
            work_history: profile?.work_history,
          },
        },
      });

      if (error) throw error;

      setTailorCoverNote(data.cover_note || '');
      setTailorSuggestions(data.suggestions || []);
      setTailorMatchScore(typeof data.match_score === 'number' ? data.match_score : null);
      setTailorMatchingSkills(Array.isArray(data.matching_skills) ? data.matching_skills : []);
      setTailorMissingSkills(Array.isArray(data.missing_skills) ? data.missing_skills : []);
    } catch (err) {
      console.error('tailor-cv failed', err);
      // FunctionsHttpError carries the function's JSON body on `context` —
      // surface the real reason instead of a blind generic message.
      let message = 'Failed to tailor CV using AI. Please try again.';
      if (err && typeof err === 'object' && 'context' in err) {
        try {
          const body = await (err as { context: Response }).context.json();
          if (body && typeof body.error === 'string') message = body.error;
        } catch { /* response body not JSON — keep generic message */ }
      }
      setTailorError(message);
    } finally {
      setTailoring(false);
    }
  };

  const applyTailoredCoverNote = () => {
    setCoverNote(tailorCoverNote);
    setTailorOpen(false);
    setApplyOpen(true);
  };

  const profileComplete = (profile?.profile_completion ?? 0) >= 40;

  // Determine competition tier
  const competitionTier = applicantCount < 5 ? 'Low' : applicantCount <= 20 ? 'Moderate' : 'High';
  const competitionColor = applicantCount < 5 ? 'text-green-500' : applicantCount <= 20 ? 'text-amber-500' : 'text-rose-500';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading job details...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20 max-w-md mx-auto space-y-4">
        <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Job Listing Not Found</h2>
        <p className="text-sm text-muted-foreground">
          This job may have been closed, deleted, or you followed an invalid URL.
        </p>
        <Button onClick={() => navigate('/talent/jobs')} variant="outline">
          Back to Jobs List
        </Button>
      </div>
    );
  }

  // Set company logo and details
  const isAnonymous = job.anonymous;
  const companyName = isAnonymous ? 'Anonymous Employer' : job.company_name;
  const companyLogo = job.logo_url
    ? job.logo_url
    : (isAnonymous
        ? `https://api.dicebear.com/7.x/identicon/svg?seed=${job.brand_id || 'anonymous'}`
        : (job.brand_profiles?.logo_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${job.id || 'anonymous'}`));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/talent/jobs"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Jobs</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full"
            onClick={handleShare}
            title="Share job"
          >
            <Share2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={`h-9 w-9 rounded-full ${isFavorite ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'}`}
            onClick={() => setIsFavorite(!isFavorite)}
            title="Add to favorites"
          >
            <Heart className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
          </Button>
        </div>
      </div>

      {copied && (
        <div className="fixed bottom-4 right-4 z-50 bg-navy-1 border border-cyan-border text-white text-xs px-3 py-2 rounded-lg shadow-lg">
          Link copied to clipboard!
        </div>
      )}

      {/* 1. Job Header Card */}
      <Card className="border-border/50 bg-card/45 shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-secondary/50 border border-border/30 overflow-hidden flex items-center justify-center shrink-0">
                {companyLogo ? (
                  <img src={companyLogo} alt={companyName} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{job.title}</h1>
                  {job.featured && (
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-none text-[10px] uppercase font-bold py-0.5">
                      ★ Featured
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-semibold text-muted-foreground">
                  {companyName} {job.brand_profiles?.industry && `• ${job.brand_profiles.industry}`}
                </p>
                
                {/* Meta details list */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground/80" /> {job.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/80" /> Posted {timeAgo(job.created_at)}
                  </span>
                  {job.deadline && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/80" /> Apply by {new Date(job.deadline).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* CTA action buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-4 md:pt-0 md:self-stretch md:justify-center md:items-end shrink-0">
              {applied ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-500/10 border border-green-500/20 px-4 py-2.5 rounded-xl text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4" /> Applied
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={triggerTailorCV}
                    className="gap-2 border-primary/40 hover:border-primary text-primary-dim dark:text-cyan hover:bg-primary/5 rounded-xl h-11 px-5"
                  >
                    <Sparkles className="h-4 w-4" />
                    Adapt my CV to this job
                  </Button>
                  <Button
                    onClick={() => setApplyOpen(true)}
                    className="gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl h-11 px-5"
                  >
                    <Send className="h-4 w-4" />
                    Apply Now
                  </Button>
                </>
              )}
            </div>
          </div>

          <hr className="border-border/40" />

          {/* Core attributes row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Job Type</span>
              <div>
                <Badge variant="outline" className={`text-xs py-0.5 px-2.5 ${JOB_TYPE_COLORS[job.job_type] || ''}`}>
                  {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Work Mode</span>
              <div>
                <Badge variant="outline" className={`text-xs py-0.5 px-2.5 ${WORK_MODE_COLORS[job.work_mode || 'onsite']}`}>
                  {job.work_mode ? job.work_mode.charAt(0).toUpperCase() + job.work_mode.slice(1) : 'Onsite'}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Compensation</span>
              <p className="text-sm font-semibold text-foreground">
                {formatSalary(job.salary_min, job.salary_max, job.pay_type) || 'Confidential'}
              </p>
            </div>
            {job.experience_level && (
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Experience Level</span>
                <p className="text-sm font-semibold text-foreground capitalize">
                  {job.experience_level === 'any' ? 'Any Experience' : `${job.experience_level} Level`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Job Description & Detail Sections */}
      <Card className="border-border/50 bg-card/45 shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-6">
          
          {/* Company details or generic placeholder */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest text-primary-dim dark:text-cyan">Company Description</h3>
            {isAnonymous || !job.brand_profiles?.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isAnonymous
                  ? `This is an anonymous employer hiring in the ${job.brand_profiles?.industry || 'Sales'} sector. They are looking to grow their presence and recruit top talent for their team.`
                  : `Learn more about opportunities at ${job.company_name}. They are committed to building high-performing sales teams.`}
              </p>
            ) : (
              <RichTextContent html={job.brand_profiles.description} className="text-muted-foreground" />
            )}
          </div>

          {/* Role Description */}
          {job.description && (
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest text-primary-dim dark:text-cyan">Role Description</h3>
              <RichTextContent html={job.description} className="text-muted-foreground" />
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest text-primary-dim dark:text-cyan">Requirements & Qualifications</h3>
              <RichTextContent html={job.requirements} className="text-muted-foreground" />
            </div>
          )}

          {/* Skills Badges */}
          {job.skills && job.skills.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest text-primary-dim dark:text-cyan">Key Skills & Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map(s => (
                  <span
                    key={s}
                    className="text-xs bg-secondary hover:bg-secondary/80 border border-border/40 text-foreground px-3 py-1 rounded-full transition-colors font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Sidebar Meta Information: About & Market Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* About Employer Card */}
        <Card className="border-border/50 bg-card/45 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest text-primary-dim dark:text-cyan">
              About {isAnonymous ? 'Confidential Employer' : companyName}
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-secondary/50 border border-border/30 overflow-hidden flex items-center justify-center shrink-0">
                {companyLogo ? (
                  <img src={companyLogo} alt={companyName} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{companyName}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {job.brand_profiles?.company_type || 'Private Organization'} • {job.brand_profiles?.company_size || 'Unknown Size'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2 pt-2 text-xs text-muted-foreground">
              {job.brand_profiles?.website && !isAnonymous && (
                <p>
                  <strong>Website: </strong>
                  <a
                    href={job.brand_profiles.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    {job.brand_profiles.website} <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              )}
              {job.brand_profiles?.city && (
                <p>
                  <strong>Headquarters: </strong> {job.brand_profiles.city}, {job.brand_profiles.country || 'Nigeria'}
                </p>
              )}
              <p>
                <strong>Active Jobs: </strong>
                <span className="text-foreground font-semibold">{activeJobsCount} roles open</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Market Insights Card */}
        <Card className="border-border/50 bg-card/45 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest text-primary-dim dark:text-cyan flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4" /> Market Insights
            </h3>
            
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground font-medium">Talent in Demand</p>
                  <p className="text-lg font-bold text-foreground">{talentInDemandCount} Candidates</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary/30" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground font-medium">Competition Level</p>
                  <p className={`text-lg font-bold ${competitionColor}`}>{competitionTier}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Applicants</p>
                  <p className="text-sm font-semibold text-foreground">{applicantCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Similar Jobs Section */}
      {similarJobs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 text-muted-foreground" /> Similar Jobs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {similarJobs.map(sj => {
              const sjLogo = sj.anonymous
                ? `https://api.dicebear.com/7.x/identicon/svg?seed=${sj.brand_id || 'anonymous'}`
                : (sj.brand_profiles?.logo_url || '');
              return (
                <Card
                  key={sj.id}
                  onClick={() => navigate(`/talent/jobs/${sj.id}`)}
                  className="border-border/50 bg-card hover:border-primary/30 cursor-pointer transition-all hover:shadow-sm flex flex-col justify-between"
                >
                  <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="h-7 w-7 rounded-md bg-secondary/50 border border-border/30 overflow-hidden flex items-center justify-center shrink-0">
                          {sjLogo ? (
                            <img src={sjLogo} alt={sj.company_name} className="h-full w-full object-cover" />
                          ) : (
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <Badge variant="outline" className={`text-[10px] py-0 ${JOB_TYPE_COLORS[sj.job_type] || ''}`}>
                          {JOB_TYPE_LABELS[sj.job_type] || sj.job_type}
                        </Badge>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-semibold text-sm text-foreground line-clamp-1">{sj.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {sj.anonymous ? 'Anonymous Employer' : sj.company_name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span className="flex items-center gap-0.5 truncate max-w-[120px]">
                        <MapPin className="h-3 w-3 shrink-0" /> {sj.location || 'Nigeria'}
                      </span>
                      <span>{timeAgo(sj.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Related Searches Section */}
      <div className="space-y-3 pt-4 border-t border-border/30">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Related Searches</h3>
        <div className="flex flex-wrap gap-2">
          {['IT Support', 'Tech Sales', 'SDR Jobs', 'Remote Sales', 'Account Executive', 'Fintech Roles'].map(term => (
            <button
              key={term}
              onClick={() => navigate(`/talent/jobs?q=${encodeURIComponent(term)}`)}
              className="text-xs bg-secondary/30 hover:bg-secondary/60 border border-border/40 text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* 5. APPLY FORM DIALOG */}
      <Dialog open={applyOpen} onOpenChange={open => { if (!open) setApplyOpen(false); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Apply for {job.title}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{companyName}</p>
          </DialogHeader>

          {submitSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-24 h-24 mx-auto flex items-center justify-center">
                <Lottie animationData={successLottie} loop={false} style={{ width: 96, height: 96 }} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Application Submitted!</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Your application for <strong>{job.title}</strong> was sent successfully. You can track its status in applications.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" size="sm" onClick={() => setApplyOpen(false)}>
                  Close
                </Button>
                <Button size="sm" onClick={() => navigate('/talent/applications')}>
                  My Applications
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 py-2 text-left">
              
              {/* Profile info preview */}
              <div className="rounded-xl bg-secondary/40 border border-border/30 p-4 space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Applicant Details</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-semibold text-foreground">
                      {profile?.full_name || (user?.user_metadata?.full_name as string) || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-semibold text-foreground truncate">{user?.email || '—'}</p>
                  </div>
                  {profile?.phone && (
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-semibold text-foreground">{profile.phone}</p>
                    </div>
                  )}
                  {profile?.experience_years !== undefined && (
                    <div>
                      <p className="text-muted-foreground">Experience</p>
                      <p className="font-semibold text-foreground">{profile.experience_years} years</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CV Selector */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Resume / CV</p>
                {profile?.cv_url ? (
                  <div className="space-y-2">
                    <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${useStoredCv ? 'border-primary bg-primary/5' : 'border-border/30 bg-secondary/10 hover:border-border'}`}>
                      <input
                        type="radio"
                        className="accent-primary"
                        checked={useStoredCv}
                        onChange={() => setUseStoredCv(true)}
                      />
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">Use my profile resume</p>
                        <p className="text-[10px] text-muted-foreground truncate">Already saved to your profile</p>
                      </div>
                      <a
                        href={profile.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-primary hover:underline shrink-0"
                      >
                        Preview
                      </a>
                    </label>
                    <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${!useStoredCv ? 'border-primary bg-primary/5' : 'border-border/30 bg-secondary/10 hover:border-border'}`}>
                      <input
                        type="radio"
                        className="accent-primary"
                        checked={!useStoredCv}
                        onChange={() => setUseStoredCv(false)}
                      />
                      <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">Upload a new CV</p>
                        {newCvFile && <p className="text-[10px] text-primary truncate font-medium">{newCvFile.name}</p>}
                      </div>
                      {!useStoredCv && (
                        <button
                          type="button"
                          onClick={() => cvInputRef.current?.click()}
                          className="text-[10px] bg-primary text-primary-foreground px-2 py-1 rounded font-semibold hover:bg-primary/90 transition-colors shrink-0"
                        >
                          Choose File
                        </button>
                      )}
                    </label>
                  </div>
                ) : (
                  <div
                    onClick={() => cvInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/50 p-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-xs font-semibold text-foreground">
                        {newCvFile ? newCvFile.name : 'Upload your CV'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">PDF or Word files up to 5MB</p>
                    </div>
                  </div>
                )}
                <input
                  ref={cvInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={e => setNewCvFile(e.target.files?.[0] || null)}
                />
              </div>

              {/* Cover Note */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Cover Note</label>
                  {!coverNote && (
                    <button
                      onClick={triggerTailorCV}
                      type="button"
                      className="text-xs text-primary hover:text-primary-dim flex items-center gap-1 font-semibold"
                    >
                      <Sparkles className="h-3 w-3" /> Auto-generate cover note
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={coverNote}
                  onChange={e => setCoverNote(e.target.value)}
                  placeholder="Briefly share why you are the perfect fit for this job..."
                  className="w-full rounded-xl border border-border/50 bg-secondary/15 px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              {submitError && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-xs text-destructive">{submitError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setApplyOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2 rounded-xl bg-primary text-primary-foreground font-semibold"
                  onClick={handleApply}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. AI CV TAILORING DIALOG */}
      <Dialog open={tailorOpen} onOpenChange={open => { if (!open) setTailorOpen(false); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-1.5 text-primary-dim dark:text-cyan">
              <Sparkles className="h-5 w-5 animate-pulse" /> AI Resume Adaptation
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Tailor your application details for {job.title}</p>
          </DialogHeader>

          {tailoring ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <Sparkles className="h-4 w-4 text-cyan absolute -top-1 -right-1 animate-bounce" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">AI is adapting your CV...</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Comparing your profile summary, history, and skills against the job requirements to generate cover note.
                </p>
              </div>
            </div>
          ) : tailorError ? (
            <div className="py-6 text-center space-y-4">
              <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="text-sm text-foreground">{tailorError}</p>
              <Button onClick={triggerTailorCV} size="sm">Retry Tailoring</Button>
            </div>
          ) : (
            <div className="space-y-5 py-2 text-left">

              {/* Match Overview */}
              {tailorMatchScore !== null && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Job Match</h4>
                    <span className={`text-sm font-bold ${tailorMatchScore >= 70 ? 'text-green-600' : tailorMatchScore >= 40 ? 'text-amber-600' : 'text-destructive'}`}>
                      {tailorMatchScore}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary/60 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${tailorMatchScore >= 70 ? 'bg-green-500' : tailorMatchScore >= 40 ? 'bg-amber-500' : 'bg-destructive'}`}
                      style={{ width: `${tailorMatchScore}%` }}
                    />
                  </div>
                  {tailorMatchingSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tailorMatchingSkills.map(skill => (
                        <span key={skill} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  {tailorMissingSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tailorMissingSkills.map(skill => (
                        <span key={skill} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Tailoring Recommendations</h4>
                <div className="space-y-2">
                  {tailorSuggestions.map((suggestion, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs bg-secondary/40 border border-border/20 p-2.5 rounded-xl">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-[10px]">
                        {idx + 1}
                      </div>
                      <p className="text-muted-foreground leading-relaxed pt-0.5">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated Cover Letter */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">AI-Generated Cover Note</h4>
                <div className="bg-secondary/20 border border-border/30 p-4 rounded-xl max-h-[200px] overflow-y-auto">
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{tailorCoverNote}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setTailorOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2 rounded-xl bg-primary text-primary-foreground font-semibold"
                  onClick={applyTailoredCoverNote}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Use Tailored Application
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
