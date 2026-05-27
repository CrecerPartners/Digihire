import { useState, useEffect } from 'react';
import { supabase as _supabase } from '@digihire/shared';
import { Card, CardContent } from '@digihire/shared';
import { Badge } from '@digihire/shared';
import { Input } from '@digihire/shared';
import { Button } from '@digihire/shared';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@digihire/shared';
import {
  Briefcase, MapPin, Clock, Users, Search, SlidersHorizontal,
  Loader2, Building2, ChevronRight, Banknote, Star,
} from 'lucide-react';

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
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

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

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchSearch = !q || j.title.toLowerCase().includes(q) || j.company_name.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q) || j.skills?.some(s => s.toLowerCase().includes(q));
    const matchType = filterType === 'all' || j.job_type === filterType;
    const matchMode = filterMode === 'all' || j.work_mode === filterMode;
    return matchSearch && matchType && matchMode;
  });

  const featured = filtered.filter(j => j.featured);
  const regular = filtered.filter(j => !j.featured);

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
          {/* Featured */}
          {featured.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-foreground">Featured Opportunities</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {featured.map(job => <JobCard key={job.id} job={job} onOpen={setSelectedJob} featured />)}
              </div>
            </div>
          )}

          {/* All Jobs */}
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
                {regular.map(job => <JobCard key={job.id} job={job} onOpen={setSelectedJob} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        {selectedJob && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg">{selectedJob.title}</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{selectedJob.company_name}</p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Tags row */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`text-xs ${JOB_TYPE_COLORS[selectedJob.job_type] || ''}`}>
                  {JOB_TYPE_LABELS[selectedJob.job_type] || selectedJob.job_type}
                </Badge>
                {selectedJob.work_mode && (
                  <Badge variant="outline" className={`text-xs ${WORK_MODE_COLORS[selectedJob.work_mode] || ''}`}>
                    {selectedJob.work_mode}
                  </Badge>
                )}
                {selectedJob.experience_level && selectedJob.experience_level !== 'any' && (
                  <Badge variant="outline" className="text-xs">
                    {selectedJob.experience_level.charAt(0).toUpperCase() + selectedJob.experience_level.slice(1)} level
                  </Badge>
                )}
                {selectedJob.category && (
                  <Badge variant="outline" className="text-xs">{selectedJob.category}</Badge>
                )}
              </div>

              {/* Key details */}
              <div className="grid grid-cols-2 gap-3">
                {selectedJob.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{selectedJob.location}</span>
                  </div>
                )}
                {(selectedJob.salary_min || selectedJob.salary_max) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Banknote className="h-4 w-4 shrink-0" />
                    <span>{formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.pay_type)}</span>
                  </div>
                )}
                {selectedJob.slots && selectedJob.slots > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>{selectedJob.slots} position{selectedJob.slots !== 1 ? 's' : ''} available</span>
                  </div>
                )}
                {selectedJob.deadline && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>Apply by {new Date(selectedJob.deadline).toLocaleDateString('en-NG', { dateStyle: 'long' })}</span>
                  </div>
                )}
                {selectedJob.duration && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>{selectedJob.duration}</span>
                  </div>
                )}
              </div>

              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.skills.map(s => (
                      <span key={s} className="text-xs bg-secondary border border-border/50 px-2.5 py-1 rounded-full text-foreground">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.description && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">About the Role</p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{selectedJob.description}</p>
                </div>
              )}

              {selectedJob.requirements && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Requirements</p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{selectedJob.requirements}</p>
                </div>
              )}

              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <p className="text-sm font-semibold text-foreground mb-1">Interested in this role?</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Make sure your Digihire profile is complete with your CV, skills, and availability so brands can match you to this and similar roles.
                </p>
                <Button size="sm" onClick={() => setSelectedJob(null)} asChild>
                  <a href="/talent/profile/setup">Update My Profile</a>
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function JobCard({ job, onOpen, featured }: { job: JobListing; onOpen: (j: JobListing) => void; featured?: boolean }) {
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
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{job.company_name}</p>
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
