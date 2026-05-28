import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase as _supabase, useAuth } from '@digihire/shared';
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

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterMode, setFilterMode] = useState('all');

  // Dialog state
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [applyView, setApplyView] = useState(false);

  // Application tracking
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  // Apply form state
  const [coverNote, setCoverNote] = useState('');
  const [useStoredCv, setUseStoredCv] = useState(true);
  const [newCvFile, setNewCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

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
    setSelectedJob(job);
    setApplyView(false);
    setSubmitSuccess(false);
    setSubmitError(null);
    setCoverNote('');
    setNewCvFile(null);
    setUseStoredCv(!!profile?.cv_url);
  };

  const handleApply = async () => {
    if (!selectedJob || !user?.id) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      let cvUrl = useStoredCv ? (profile?.cv_url || '') : '';

      // Upload new CV if provided
      if (!useStoredCv && newCvFile) {
        const fileExt = newCvFile.name.split('.').pop();
        const fileName = `${user.id}-apply-${selectedJob.id}-${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('talent-assets')
          .upload(fileName, newCvFile);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage
          .from('talent-assets')
          .getPublicUrl(fileName);
        cvUrl = publicUrl;
      }

      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: selectedJob.id,
          talent_id: user.id,
          full_name: profile?.full_name || (user.user_metadata?.full_name as string) || '',
          email: user.email,
          phone: profile?.phone || '',
          cover_note: coverNote,
          cv_url: cvUrl,
          status: 'pending',
        });

      if (error) throw error;

      setAppliedJobIds(prev => new Set([...prev, selectedJob.id]));
      setSubmitSuccess(true);
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

      {/* Job Detail / Apply Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={open => { if (!open) setSelectedJob(null); }}>
        {selectedJob && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-lg leading-tight">{selectedJob.title}</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{selectedJob.company_name}</p>
                </div>
              </div>
            </DialogHeader>

            {/* SUCCESS STATE */}
            {submitSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Application Submitted!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your application for <strong>{selectedJob.title}</strong> has been sent. We'll notify you of any updates.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" size="sm" onClick={() => setSelectedJob(null)}>
                    Browse More Jobs
                  </Button>
                  <Button size="sm" onClick={() => navigate('/talent/applications')}>
                    My Applications
                  </Button>
                </div>
              </div>
            ) : applyView ? (
              /* APPLY FORM VIEW */
              <div className="space-y-5 py-2">
                <button
                  onClick={() => setApplyView(false)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to job details
                </button>

                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Apply for {selectedJob.title}</h3>
                  <p className="text-xs text-muted-foreground">{selectedJob.company_name}</p>
                </div>

                {/* Auto-filled applicant info */}
                <div className="rounded-xl bg-secondary/50 border border-border/50 p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Details (from profile)</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-medium text-foreground">
                        {profile?.full_name || (user?.user_metadata?.full_name as string) || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground truncate">{user?.email || '—'}</p>
                    </div>
                    {profile?.phone && (
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium text-foreground">{profile.phone}</p>
                      </div>
                    )}
                    {profile?.experience_years && (
                      <div>
                        <p className="text-xs text-muted-foreground">Experience</p>
                        <p className="font-medium text-foreground">{profile.experience_years} years</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/talent/profile/setup')}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit profile →
                  </button>
                </div>

                {/* CV Selection */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">CV / Resume</p>
                  {profile?.cv_url ? (
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${useStoredCv ? 'border-primary bg-primary/5' : 'border-border/50 bg-secondary/30 hover:border-border'}`}>
                        <input
                          type="radio"
                          className="accent-primary"
                          checked={useStoredCv}
                          onChange={() => setUseStoredCv(true)}
                        />
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">Use my saved CV</p>
                          <p className="text-xs text-muted-foreground truncate">Already on your profile</p>
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
                      <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${!useStoredCv ? 'border-primary bg-primary/5' : 'border-border/50 bg-secondary/30 hover:border-border'}`}>
                        <input
                          type="radio"
                          className="accent-primary"
                          checked={!useStoredCv}
                          onChange={() => setUseStoredCv(false)}
                        />
                        <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">Upload a different CV</p>
                          {newCvFile && <p className="text-xs text-primary truncate">{newCvFile.name}</p>}
                        </div>
                        {!useStoredCv && (
                          <button
                            type="button"
                            onClick={() => cvInputRef.current?.click()}
                            className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded font-medium hover:bg-primary/90 transition-colors shrink-0"
                          >
                            Choose File
                          </button>
                        )}
                      </label>
                    </div>
                  ) : (
                    <div
                      onClick={() => cvInputRef.current?.click()}
                      className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {newCvFile ? newCvFile.name : 'Upload your CV (optional)'}
                        </p>
                        <p className="text-xs text-muted-foreground">PDF, DOC up to 5MB</p>
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
                  <label className="text-sm font-semibold text-foreground">
                    Cover Note <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={coverNote}
                    onChange={e => setCoverNote(e.target.value)}
                    placeholder="Briefly tell the employer why you're a great fit for this role…"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-sm text-destructive">{submitError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setApplyView(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleApply}
                    disabled={submitting || (!useStoredCv && !newCvFile && !profile?.cv_url)}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {submitting ? 'Submitting…' : 'Submit Application'}
                  </Button>
                </div>
              </div>
            ) : (
              /* JOB DETAILS VIEW */
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

                {/* Apply CTA */}
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                  {appliedJobIds.has(selectedJob.id) ? (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">You've applied to this role</p>
                        <button
                          onClick={() => navigate('/talent/applications')}
                          className="text-xs text-primary hover:underline"
                        >
                          View your applications →
                        </button>
                      </div>
                    </div>
                  ) : !profileComplete ? (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Complete your profile to apply</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Add at least your name, phone, and a few skills to apply for this role.
                      </p>
                      <Button size="sm" onClick={() => navigate('/talent/profile/setup')}>
                        Complete Profile
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Interested in this role?</p>
                        <p className="text-xs text-muted-foreground">Your profile details will be used to auto-fill your application.</p>
                      </div>
                      <Button size="sm" onClick={() => setApplyView(true)} className="shrink-0 gap-2">
                        <Send className="h-4 w-4" /> Apply Now
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
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
