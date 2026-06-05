import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase as _supabase, useAuth, uploadFileToR2 } from '@digihire/shared';
import { Card, CardContent } from '@digihire/shared';
import { Badge } from '@digihire/shared';
import { Input } from '@digihire/shared';
import { Button } from '@digihire/shared';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@digihire/shared';
import {
  Briefcase, MapPin, Clock, Users, Search,
  Loader2, Building2, ChevronRight, Banknote, Star,
  CheckCircle2, ArrowLeft, Upload, FileText, Send,
  AlertCircle,
} from 'lucide-react';
import { useTalentProfile } from '../../hooks/useTalentProfile';

const supabase = _supabase as any;

interface JobListing {
  id: string;
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
  created_at: string;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-Time', part_time: 'Part-Time', contract: 'Contract',
  gig: 'Gig', internship: 'Internship',
};

const JOB_TYPE_COLORS: Record<string, string> = {
  full_time: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
  part_time: 'text-purple-600 bg-purple-500/10 border-purple-500/20',
  contract: 'text-orange-600 bg-orange-500/10 border-orange-500/20',
  gig: 'text-green-600 bg-green-500/10 border-green-500/20',
  internship: 'text-pink-600 bg-pink-500/10 border-pink-500/20',
};

const WORK_MODE_COLORS: Record<string, string> = {
  remote: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  hybrid: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
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

export default function JobsPage() {
  const { user } = useAuth();
  const { profile } = useTalentProfile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterMode, setFilterMode] = useState('all');

  // Application tracking
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_listings')
        .select('*')
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });
      if (!error) setJobs(data || []);
      setLoading(false);
    };
    fetchJobs();
  }, []);

  // Auto-open a job linked from an external source (e.g. landing page job card)
  useEffect(() => {
    const jobId = searchParams.get('job');
    if (!jobId || loading || jobs.length === 0) return;
    const match = jobs.find(j => j.id === jobId);
    if (match) {
      openJob(match);
      // Remove the param so back/reload doesn't re-open
      setSearchParams(prev => { prev.delete('job'); return prev; }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, loading]);

  // Fetch user's existing applications
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('job_applications')
      .select('job_id')
      .eq('talent_id', user.id)
      .then(({ data }: { data: { job_id: string }[] | null }) => {
        if (data) setAppliedJobIds(new Set(data.map(a => a.job_id)));
      });
  }, [user?.id]);

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchSearch = !q || j.title.toLowerCase().includes(q) || j.company_name.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q) || j.skills?.some(s => s.toLowerCase().includes(q));
    const matchType = filterType === 'all' || j.job_type === filterType;
    const matchMode = filterMode === 'all' || j.work_mode === filterMode;
    return matchSearch && matchType && matchMode;
  });

  const featured = filtered.filter(j => j.featured);
  const regular = filtered.filter(j => !j.featured);

  const openJob = (job: JobListing) => {
    navigate(`/talent/jobs/${job.id}`);
  };

  const profileComplete = (profile?.profile_completion ?? 0) >= 40;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Jobs & Gigs</h1>
        <p className="text-muted-foreground mt-1 text-sm">Browse open roles from brands hiring on Digihire</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by title, company, skill..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          {Object.entries(JOB_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={filterMode}
          onChange={e => setFilterMode(e.target.value)}
        >
          <option value="all">All Modes</option>
          <option value="onsite">Onsite</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No jobs found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-6">
          {featured.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-foreground">Featured Opportunities</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {featured.map(job => (
                  <JobCard key={job.id} job={job} onOpen={openJob} applied={appliedJobIds.has(job.id)} featured />
                ))}
              </div>
            </div>
          )}

          {regular.length > 0 && (
            <div>
              {featured.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">All Open Roles</span>
                  <span className="text-xs text-muted-foreground">({regular.length})</span>
                </div>
              )}
              <div className="grid gap-3">
                {regular.map(job => (
                  <JobCard key={job.id} job={job} onOpen={openJob} applied={appliedJobIds.has(job.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}


    </div>
  );
}

function JobCard({ job, onOpen, applied, featured }: { job: JobListing; onOpen: (j: JobListing) => void; applied?: boolean; featured?: boolean }) {
  const salary = formatSalary(job.salary_min, job.salary_max, job.pay_type);

  return (
    <Card
      className={`border-border/50 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all ${featured ? 'border-amber-500/20 bg-amber-500/5' : ''}`}
      onClick={() => onOpen(job)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground truncate">{job.title}</span>
                {featured && <Star className="h-3 w-3 text-amber-500 shrink-0" />}
                {applied && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                    Applied
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {job.anonymous ? 'Anonymous Employer' : job.company_name}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="outline" className={`text-[11px] py-0 ${JOB_TYPE_COLORS[job.job_type] || ''}`}>
                  {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                </Badge>
                {job.work_mode && job.work_mode !== 'onsite' && (
                  <Badge variant="outline" className={`text-[11px] py-0 ${WORK_MODE_COLORS[job.work_mode] || ''}`}>
                    {job.work_mode}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
                {job.location && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {job.location}
                  </span>
                )}
                {salary && (
                  <span className="text-[11px] text-muted-foreground">{salary}</span>
                )}
                <span className="text-[11px] text-muted-foreground">{timeAgo(job.created_at)}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}
