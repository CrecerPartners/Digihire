import { useState, useEffect } from 'react';
import { supabase as _supabase, useAuth } from '@digihire/shared';
import { Button } from '@digihire/shared';
import { Badge } from '@digihire/shared';
import { Input } from '@digihire/shared';
import { Label } from '@digihire/shared';
import { Textarea } from '@digihire/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@digihire/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@digihire/shared';
import { Plus, Pencil, Trash2, Loader2, Briefcase, MapPin, Clock, Users } from 'lucide-react';
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
};

function formatSalary(min?: number, max?: number, pay_type?: string) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1000 ? `₦${(n / 1000).toFixed(0)}k` : `₦${n}`;
  const range = min && max ? `${fmt(min)} – ${fmt(max)}` : min ? `From ${fmt(min)}` : `Up to ${fmt(max!)}`;
  const suffix = pay_type === 'hourly' ? '/hr' : pay_type === 'per_gig' ? '/gig' : pay_type === 'commission' ? ' (comm.)' : '/mo';
  return range + suffix;
}

export default function JobListings() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editJob, setEditJob] = useState<JobListing | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_listings')
      .select('*')
      .eq('brand_id', user?.id)
      .order('created_at', { ascending: false });
    if (!error) setJobs(data || []);
    setLoading(false);
  };

  useEffect(() => { if (user?.id) fetchJobs(); }, [user?.id]);

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
    });
    setFormOpen(true);
  };

  const set = (field: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Job title is required'); return; }
    if (!form.company_name.trim()) { toast.error('Company name is required'); return; }
    setSaving(true);

    const payload = {
      brand_id: user?.id,
      company_name: form.company_name,
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
      updated_at: new Date().toISOString(),
    };

    try {
      if (editJob) {
        const { error } = await supabase.from('job_listings').update(payload).eq('id', editJob.id);
        if (error) throw error;
        toast.success('Job updated');
      } else {
        const { error } = await supabase.from('job_listings').insert(payload);
        if (error) throw error;
        toast.success('Job posted');
      }
      setFormOpen(false);
      fetchJobs();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
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
    const { error } = await supabase.from('job_listings').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', job.id);
    if (error) { toast.error('Update failed'); return; }
    toast.success(newStatus === 'published' ? 'Job published' : 'Job closed');
    fetchJobs();
  };

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
          {jobs.map(job => (
            <Card key={job.id} className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{job.title}</h3>
                        <Badge variant="outline" className="text-xs">{JOB_TYPE_LABELS[job.job_type] || job.job_type}</Badge>
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[job.status]}`}>{job.status}</Badge>
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
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editJob ? 'Edit Job' : 'Post a New Job'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Job Title *</Label>
                <Input value={form.title} onChange={set('title')} placeholder="e.g. Sales Executive" />
              </div>
              <div className="space-y-1.5">
                <Label>Company Name *</Label>
                <Input value={form.company_name} onChange={set('company_name')} placeholder="Your company name" />
              </div>
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
              <Textarea value={form.description} onChange={set('description')} rows={4} placeholder="Describe the role and responsibilities..." />
            </div>

            <div className="space-y-1.5">
              <Label>Requirements</Label>
              <Textarea value={form.requirements} onChange={set('requirements')} rows={3} placeholder="Minimum qualifications and experience..." />
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
