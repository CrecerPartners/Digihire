import { useState, useEffect } from 'react';
import { supabase as _supabase, useAuth } from '@digihire/shared';
import { Button } from '@digihire/shared';
import { Badge } from '@digihire/shared';
import { Input } from '@digihire/shared';
import { Label } from '@digihire/shared';
import { RichTextEditor } from '@digihire/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@digihire/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@digihire/shared';
import {
  Plus, Pencil, Trash2, Loader2, Briefcase, MapPin, Clock, Users,
  Download, FileText, ChevronRight, Inbox,
} from 'lucide-react';
import { toast } from 'sonner';

const supabase = _supabase as any;

interface JobListing {
  id: string;
  brand_id: string;
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
  status: string;
  featured?: boolean;
  anonymous?: boolean;
  logo_url?: string;
  created_at: string;
}

interface Application {
  id: string;
  job_id: string;
  talent_id: string;
  full_name: string;
  email: string;
  phone?: string;
  cover_note?: string;
  cv_url?: string;
  status: string;
  created_at: string;
}

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'gig', 'internship'];
const CATEGORIES = ['Sales', 'Marketing', 'Field', 'Tech', 'Customer Service', 'Finance', 'Operations', 'Other'];
const WORK_MODES = ['onsite', 'remote', 'hybrid'];
const PAY_TYPES = ['salary', 'commission', 'hourly', 'per_gig'];
const EXP_LEVELS = ['any', 'entry', 'mid', 'senior'];

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-Time', part_time: 'Part-Time', contract: 'Contract',
  gig: 'Gig', internship: 'Internship',
};

const STATUS_COLORS: Record<string, string> = {
  published: 'text-green-600 border-green-500/30 bg-green-500/10',
  draft: 'text-muted-foreground border-border/50',
  closed: 'text-orange-500 border-orange-500/30 bg-orange-500/10',
};

const APP_STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  reviewed: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
  shortlisted: 'text-green-600 bg-green-500/10 border-green-500/20',
  rejected: 'text-red-600 bg-red-500/10 border-red-500/20',
  hired: 'text-purple-600 bg-purple-500/10 border-purple-500/20',
};

const emptyForm = {
  title: '',
  company_name: '',
  job_type: 'full_time',
  category: 'Sales',
  location: '',
  work_mode: 'onsite',
  salary_min: '' as number | '',
  salary_max: '' as number | '',
  pay_type: 'salary',
  description: '',
  requirements: '',
  skills: '',
  experience_level: 'any',
  duration: '',
  slots: 1,
  deadline: '',
  status: 'draft',
  anonymous: false,
};

function formatSalary(min?: number, max?: number, pay_type?: string) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1000 ? `₦${(n / 1000).toFixed(0)}k` : `₦${n}`;
  const range = min && max ? `${fmt(min)} – ${fmt(max)}` : min ? `From ${fmt(min)}` : `Up to ${fmt(max!)}`;
  const suffix = pay_type === 'hourly' ? '/hr' : pay_type === 'per_gig' ? '/gig' : pay_type === 'commission' ? ' (comm.)' : '/mo';
  return range + suffix;
}

function downloadCSV(apps: Application[], jobTitle: string) {
  const headers = ['Name', 'Email', 'Phone', 'Status', 'CV Link', 'Cover Note', 'Applied'];
  const rows = apps.map(a => [
    a.full_name,
    a.email,
    a.phone || '',
    a.status,
    a.cv_url || '',
    (a.cover_note || '').replace(/"/g, '""'),
    new Date(a.created_at).toLocaleDateString('en-NG'),
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${v}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${jobTitle.replace(/\s+/g, '-').toLowerCase()}-applicants.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function JobListings() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editJob, setEditJob] = useState<JobListing | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);

  // Applications state
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const [appsDialogOpen, setAppsDialogOpen] = useState(false);
  const [appsJob, setAppsJob] = useState<JobListing | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_listings')
      .select('*')
      .eq('brand_id', user?.id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setJobs(data);
      await fetchApplicationCounts(data.map((j: JobListing) => j.id));
    }
    setLoading(false);
  };

  const fetchBrandLogo = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('brand_profiles')
        .select('logo_url')
        .eq('id', user.id)
        .maybeSingle();
      if (data && data.logo_url) {
        setBrandLogo(data.logo_url);
      }
    } catch (err) {
      console.error('Error fetching brand logo:', err);
    }
  };

  const fetchApplicationCounts = async (jobIds: string[]) => {
    if (!jobIds.length) return;
    const { data } = await supabase
      .from('job_applications')
      .select('job_id')
      .in('job_id', jobIds);
    if (data) {
      const counts: Record<string, number> = {};
      (data as { job_id: string }[]).forEach(app => {
        counts[app.job_id] = (counts[app.job_id] || 0) + 1;
      });
      setApplicationCounts(counts);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchJobs();
      fetchBrandLogo();
    }
  }, [user?.id]);

  const openApplications = async (job: JobListing) => {
    setAppsJob(job);
    setAppsDialogOpen(true);
    setAppsLoading(true);
    const { data } = await supabase
      .from('job_applications')
      .select('*')
      .eq('job_id', job.id)
      .order('created_at', { ascending: false });
    setApplications(data || []);
    setAppsLoading(false);
  };

  const openCreate = () => {
    setEditJob(null);
    setForm({ ...emptyForm, company_name: user?.user_metadata?.company_name || '' });
    setFormOpen(true);
  };

  const openEdit = (job: JobListing) => {
    setEditJob(job);
    setForm({
      title: job.title,
      company_name: job.company_name,
      job_type: job.job_type,
      category: job.category,
      location: job.location || '',
      work_mode: job.work_mode || 'onsite',
      salary_min: job.salary_min ?? '',
      salary_max: job.salary_max ?? '',
      pay_type: job.pay_type || 'salary',
      description: job.description || '',
      requirements: job.requirements || '',
      skills: (job.skills || []).join(', '),
      experience_level: job.experience_level || 'any',
      duration: job.duration || '',
      slots: job.slots ?? 1,
      deadline: job.deadline ? job.deadline.slice(0, 10) : '',
      status: job.status,
      anonymous: job.anonymous ?? false,
    });
    setFormOpen(true);
  };

  const set = (field: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Job title is required'); return; }
    if (!form.anonymous && !form.company_name.trim()) { toast.error('Company name is required'); return; }
    setSaving(true);

    const seed = encodeURIComponent(`${form.title}-${form.category}-${editJob?.id || 'new'}`);
    const generatedAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;
    const logoUrl = form.anonymous 
      ? generatedAvatar 
      : (brandLogo || generatedAvatar);

    const basePayload = {
      brand_id: user?.id,
      company_name: form.anonymous ? 'Anonymous Employer' : form.company_name,
      title: form.title,
      job_type: form.job_type,
      category: form.category,
      location: form.location || null,
      work_mode: form.work_mode,
      salary_min: form.salary_min === '' ? null : Number(form.salary_min),
      salary_max: form.salary_max === '' ? null : Number(form.salary_max),
      pay_type: form.pay_type,
      description: form.description || null,
      requirements: form.requirements || null,
      skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      experience_level: form.experience_level,
      duration: form.duration || null,
      slots: Number(form.slots) || 1,
      deadline: form.deadline || null,
      status: form.status,
      anonymous: form.anonymous,
      logo_url: logoUrl,
    };

    try {
      if (editJob) {
        const { error } = await supabase.from('job_listings').update(basePayload).eq('id', editJob.id);
        if (error) throw error;
        toast.success('Job updated');
      } else {
        const { error } = await supabase.from('job_listings').insert(basePayload);
        if (error) throw error;
        toast.success('Job posted');
      }
      setFormOpen(false);
      fetchJobs();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Save failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('job_listings').delete().eq('id', id);
    if (error) { toast.error('Delete failed'); return; }
    toast.success('Job removed');
    fetchJobs();
  };

  const handleToggleStatus = async (job: JobListing) => {
    const newStatus = job.status === 'published' ? 'closed' : 'published';
    const { error } = await supabase
      .from('job_listings')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', job.id);
    if (error) { toast.error('Update failed'); return; }
    toast.success(newStatus === 'published' ? 'Job published' : 'Job closed');
    fetchJobs();
  };

  // Summary stats
  const totalJobs = jobs.length;
  const publishedJobs = jobs.filter(j => j.status === 'published').length;
  const draftJobs = jobs.filter(j => j.status === 'draft').length;
  const totalApplications = Object.values(applicationCounts).reduce((sum, n) => sum + n, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Job Listings</h1>
          <p className="text-muted-foreground mt-1 text-sm">Post jobs and gigs — published listings appear on the Digihire website and talent portal</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Post a Job
        </Button>
      </div>

      {/* Stats bar */}
      {!loading && totalJobs > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Jobs Posted', value: totalJobs, color: 'text-foreground' },
            { label: 'Published', value: publishedJobs, color: 'text-green-600' },
            { label: 'Drafts', value: draftJobs, color: 'text-muted-foreground' },
            { label: 'Total Applications', value: totalApplications, color: 'text-primary' },
          ].map(stat => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : jobs.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No jobs posted yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-5">
              Post your first job listing. Published listings appear on the Digihire website and talent portal.
            </p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Post a Job
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map(job => {
            const appCount = applicationCounts[job.id] || 0;
            return (
              <Card key={job.id} className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-border/30 overflow-hidden flex items-center justify-center shrink-0">
                        {job.logo_url ? (
                          <img src={job.logo_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Briefcase className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{job.title}</h3>
                          <Badge variant="outline" className="text-xs">{JOB_TYPE_LABELS[job.job_type] || job.job_type}</Badge>
                          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[job.status]}`}>{job.status}</Badge>
                          {job.anonymous && (
                            <Badge variant="outline" className="text-xs text-muted-foreground border-border/50">Anonymous</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                          {job.location && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {job.location}
                              {job.work_mode !== 'onsite' && ` · ${job.work_mode}`}
                            </span>
                          )}
                          {(job.salary_min || job.salary_max) && (
                            <span className="text-xs text-muted-foreground">
                              {formatSalary(job.salary_min, job.salary_max, job.pay_type)}
                            </span>
                          )}
                          {job.slots && job.slots > 1 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" /> {job.slots} slots
                            </span>
                          )}
                          {job.deadline && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Closes {new Date(job.deadline).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                            </span>
                          )}
                        </div>
                        {job.skills && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {job.skills.slice(0, 4).map(s => (
                              <span key={s} className="text-[11px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{s}</span>
                            ))}
                            {job.skills.length > 4 && <span className="text-[11px] text-muted-foreground">+{job.skills.length - 4} more</span>}
                          </div>
                        )}

                        {/* Application count row */}
                        <button
                          onClick={() => openApplications(job)}
                          className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:underline"
                        >
                          <Inbox className="h-3.5 w-3.5" />
                          {appCount === 0 ? 'No applications yet' : `${appCount} application${appCount !== 1 ? 's' : ''}`}
                          {appCount > 0 && <ChevronRight className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline" size="sm"
                        className={job.status === 'published' ? 'text-orange-500 border-orange-500/30 hover:bg-orange-500/10' : 'text-green-600 border-green-500/30 hover:bg-green-500/10'}
                        onClick={() => handleToggleStatus(job)}
                      >
                        {job.status === 'published' ? 'Close' : 'Publish'}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(job)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(job.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Applications Dialog */}
      <Dialog open={appsDialogOpen} onOpenChange={setAppsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-6">
              <div>
                <DialogTitle>Applicants — {appsJob?.title}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{appsJob?.company_name}</p>
              </div>
              {applications.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-2"
                  onClick={() => appsJob && downloadCSV(applications, appsJob.title)}
                >
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </Button>
              )}
            </div>
          </DialogHeader>

          {appsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No applications yet</p>
              <p className="text-xs text-muted-foreground mt-1">Applications will appear here once candidates apply.</p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <p className="text-xs text-muted-foreground">{applications.length} applicant{applications.length !== 1 ? 's' : ''}</p>
              {applications.map(app => (
                <div key={app.id} className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-foreground">{app.full_name || '—'}</p>
                        <Badge variant="outline" className={`text-[11px] py-0 ${APP_STATUS_COLORS[app.status] || ''}`}>
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{app.email}</p>
                      {app.phone && <p className="text-xs text-muted-foreground">{app.phone}</p>}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Applied {new Date(app.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                      </p>
                    </div>
                    {app.cv_url ? (
                      <a
                        href={app.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" /> Download CV
                      </a>
                    ) : (
                      <span className="shrink-0 text-xs text-muted-foreground border border-border/50 px-3 py-1.5 rounded-lg">No CV</span>
                    )}
                  </div>
                  {app.cover_note && (
                    <div className="rounded-lg bg-background border border-border/50 px-3 py-2">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cover Note</p>
                      <p className="text-xs text-foreground leading-relaxed line-clamp-3">{app.cover_note}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editJob ? 'Edit Job' : 'Post a New Job'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <label className="flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/30 p-4 cursor-pointer hover:bg-secondary/50 transition-colors">
              <input
                type="checkbox"
                className="mt-0.5 accent-primary h-4 w-4 shrink-0"
                checked={form.anonymous}
                onChange={e => setForm(f => ({ ...f, anonymous: e.target.checked }))}
              />
              <div>
                <p className="text-sm font-medium text-foreground">Post as anonymous employer</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your company name will be hidden from applicants. They'll see "Anonymous Employer" on the listing.
                </p>
              </div>
            </label>

            <div className={`grid gap-3 ${form.anonymous ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div className="space-y-1.5">
                <Label>Job Title *</Label>
                <Input value={form.title} onChange={set('title')} placeholder="e.g. Sales Executive" />
              </div>
              {!form.anonymous && (
                <div className="space-y-1.5">
                  <Label>Company Name *</Label>
                  <Input value={form.company_name} onChange={set('company_name')} placeholder="Your company name" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Job Type</Label>
                <select value={form.job_type} onChange={set('job_type')} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {JOB_TYPES.map(t => <option key={t} value={t}>{JOB_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select value={form.category} onChange={set('category')} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Work Mode</Label>
                <select value={form.work_mode} onChange={set('work_mode')} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {WORK_MODES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={set('location')} placeholder="e.g. Lagos, Nigeria" />
              </div>
              <div className="space-y-1.5">
                <Label>Experience Level</Label>
                <select value={form.experience_level} onChange={set('experience_level')} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {EXP_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Min Salary (₦)</Label>
                <Input type="number" value={form.salary_min} onChange={set('salary_min')} placeholder="150000" />
              </div>
              <div className="space-y-1.5">
                <Label>Max Salary (₦)</Label>
                <Input type="number" value={form.salary_max} onChange={set('salary_max')} placeholder="300000" />
              </div>
              <div className="space-y-1.5">
                <Label>Pay Type</Label>
                <select value={form.pay_type} onChange={set('pay_type')} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {PAY_TYPES.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Slots Available</Label>
                <Input type="number" min={1} value={form.slots} onChange={set('slots')} />
              </div>
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <Input value={form.duration} onChange={set('duration')} placeholder="e.g. 3 months, ongoing" />
              </div>
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input type="date" value={form.deadline} onChange={set('deadline')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Skills Required (comma-separated)</Label>
              <Input value={form.skills} onChange={set('skills')} placeholder="e.g. Cold calling, CRM, B2B sales" />
            </div>

            <div className="space-y-1.5">
              <Label>Job Description</Label>
              <RichTextEditor value={form.description || ''} onChange={html => setForm(f => ({ ...f, description: html }))} placeholder="Describe the role and responsibilities..." minHeight="140px" />
            </div>

            <div className="space-y-1.5">
              <Label>Requirements</Label>
              <RichTextEditor value={form.requirements || ''} onChange={html => setForm(f => ({ ...f, requirements: html }))} placeholder="Minimum qualifications and experience..." minHeight="110px" />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <select value={form.status} onChange={set('status')} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="draft">Draft (not visible publicly)</option>
                <option value="published">Published (visible on website & talent portal)</option>
                <option value="closed">Closed</option>
              </select>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editJob ? 'Save Changes' : 'Post Job'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
