import { useState, useEffect } from "react";
import { supabase as _supabase } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { Label } from "@digihire/shared";
import { Textarea } from "@digihire/shared";
import { Card, CardContent } from "@digihire/shared";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@digihire/shared";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@digihire/shared";
import { Plus, Pencil, Trash2, Loader2, Briefcase, Search } from "lucide-react";
import { toast } from "sonner";

const supabase = _supabase as any;

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
  status: string;
  featured?: boolean;
  created_at: string;
  brand_profiles?: { company_name: string };
}

const emptyForm = {
  company_name: "",
  title: "",
  job_type: "full_time",
  category: "Sales",
  location: "",
  work_mode: "onsite",
  salary_min: "" as number | "",
  salary_max: "" as number | "",
  pay_type: "salary",
  description: "",
  requirements: "",
  skills: "",
  experience_level: "any",
  duration: "",
  slots: 1,
  deadline: "",
  status: "draft",
  featured: false,
};

const JOB_TYPES = ["full_time", "part_time", "contract", "gig", "internship"];
const CATEGORIES = ["Sales", "Marketing", "Field", "Tech", "Customer Service", "Finance", "Operations", "Other"];
const WORK_MODES = ["onsite", "remote", "hybrid"];
const PAY_TYPES = ["salary", "commission", "hourly", "per_gig"];
const EXP_LEVELS = ["any", "entry", "mid", "senior"];

const STATUS_COLORS: Record<string, string> = {
  published: "text-green-600 border-green-500/20 bg-green-500/10",
  draft: "text-muted-foreground border-border/50",
  closed: "text-orange-500 border-orange-500/20 bg-orange-500/10",
};

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-Time", part_time: "Part-Time", contract: "Contract",
  gig: "Gig", internship: "Internship",
};

function formatSalary(min?: number, salary_max?: number, pay_type?: string) {
  if (!min && !salary_max) return "—";
  const fmt = (n: number) => n >= 1000 ? `₦${(n / 1000).toFixed(0)}k` : `₦${n}`;
  const range = min && salary_max ? `${fmt(min)} – ${fmt(salary_max)}` : min ? `From ${fmt(min)}` : `Up to ${fmt(salary_max!)}`;
  const suffix = pay_type === "hourly" ? "/hr" : pay_type === "per_gig" ? "/gig" : pay_type === "commission" ? " (commission)" : "/mo";
  return range + suffix;
}

export default function AdminJobListings() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editJob, setEditJob] = useState<JobListing | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("job_listings")
      .select("*, brand_profiles(company_name)")
      .order("created_at", { ascending: false });
    if (!error) setJobs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const openCreate = () => {
    setEditJob(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (job: JobListing) => {
    setEditJob(job);
    setForm({
      company_name: job.company_name,
      title: job.title,
      job_type: job.job_type,
      category: job.category,
      location: job.location || "",
      work_mode: job.work_mode || "onsite",
      salary_min: job.salary_min ?? "",
      salary_max: job.salary_max ?? "",
      pay_type: job.pay_type || "salary",
      description: job.description || "",
      requirements: job.requirements || "",
      skills: (job.skills || []).join(", "),
      experience_level: job.experience_level || "any",
      duration: job.duration || "",
      slots: job.slots ?? 1,
      deadline: job.deadline ? job.deadline.slice(0, 10) : "",
      status: job.status,
      featured: job.featured || false,
    });
    setFormOpen(true);
  };

  const set = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.company_name.trim()) { toast.error("Company name is required"); return; }
    setSaving(true);

    const payload = {
      company_name: form.company_name,
      title: form.title,
      job_type: form.job_type,
      category: form.category,
      location: form.location || null,
      work_mode: form.work_mode,
      salary_min: form.salary_min === "" ? null : Number(form.salary_min),
      salary_max: form.salary_max === "" ? null : Number(form.salary_max),
      pay_type: form.pay_type,
      description: form.description || null,
      requirements: form.requirements || null,
      skills: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      experience_level: form.experience_level,
      duration: form.duration || null,
      slots: Number(form.slots) || 1,
      deadline: form.deadline || null,
      status: form.status,
      featured: form.featured,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editJob) {
        const { error } = await supabase.from("job_listings").update(payload).eq("id", editJob.id);
        if (error) throw error;
        toast.success("Job updated");
      } else {
        const { error } = await supabase.from("job_listings").insert(payload);
        if (error) throw error;
        toast.success("Job created");
      }
      setFormOpen(false);
      fetchJobs();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("job_listings").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("Job deleted");
    fetchJobs();
  };

  const filtered = jobs.filter(j => {
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company_name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || j.job_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Job Listings</h1>
          <p className="text-muted-foreground mt-1">Manage public jobs and gigs shown on the website and talent portal</p>
        </div>
        <Button className="volt-gradient" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Job
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 w-56"
            placeholder="Search jobs..."
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
          {JOB_TYPES.map(t => <option key={t} value={t}>{JOB_TYPE_LABELS[t]}</option>)}
        </select>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Job</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Slots</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">
                    No jobs found.
                  </TableCell>
                </TableRow>
              ) : filtered.map(job => (
                <TableRow key={job.id} className="border-border/50">
                  <TableCell className="max-w-[260px]">
                    <div className="flex items-start gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm truncate">{job.title}</div>
                        <div className="text-xs text-muted-foreground">{job.company_name}</div>
                        {job.featured && <span className="text-[10px] text-amber-500 font-semibold">★ Featured</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{JOB_TYPE_LABELS[job.job_type] || job.job_type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {job.location || "—"}
                    {job.work_mode && job.work_mode !== "onsite" && (
                      <span className="ml-1 text-xs text-primary">({job.work_mode})</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatSalary(job.salary_min, job.salary_max, job.pay_type)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{job.slots ?? 1}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[job.status] || ""}`}>{job.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(job)} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(job.id)} title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editJob ? "Edit Job" : "New Job Listing"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Job Title *</Label>
                <Input value={form.title} onChange={set("title")} placeholder="e.g. Sales Executive" />
              </div>
              <div className="space-y-1.5">
                <Label>Company Name *</Label>
                <Input value={form.company_name} onChange={set("company_name")} placeholder="e.g. Acme Corp" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Job Type</Label>
                <select value={form.job_type} onChange={set("job_type")} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {JOB_TYPES.map(t => <option key={t} value={t}>{JOB_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select value={form.category} onChange={set("category")} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Work Mode</Label>
                <select value={form.work_mode} onChange={set("work_mode")} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {WORK_MODES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={set("location")} placeholder="e.g. Lagos, Nigeria" />
              </div>
              <div className="space-y-1.5">
                <Label>Experience Level</Label>
                <select value={form.experience_level} onChange={set("experience_level")} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {EXP_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Min Salary (₦)</Label>
                <Input type="number" value={form.salary_min} onChange={set("salary_min")} placeholder="e.g. 150000" />
              </div>
              <div className="space-y-1.5">
                <Label>Max Salary (₦)</Label>
                <Input type="number" value={form.salary_max} onChange={set("salary_max")} placeholder="e.g. 300000" />
              </div>
              <div className="space-y-1.5">
                <Label>Pay Type</Label>
                <select value={form.pay_type} onChange={set("pay_type")} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {PAY_TYPES.map(p => <option key={p} value={p}>{p.replace("_", " ")}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Slots Available</Label>
                <Input type="number" min={1} value={form.slots} onChange={set("slots")} />
              </div>
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <Input value={form.duration} onChange={set("duration")} placeholder="e.g. 3 months, ongoing" />
              </div>
              <div className="space-y-1.5">
                <Label>Application Deadline</Label>
                <Input type="date" value={form.deadline} onChange={set("deadline")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Skills (comma-separated)</Label>
              <Input value={form.skills} onChange={set("skills")} placeholder="e.g. Cold calling, CRM, B2B sales" />
            </div>

            <div className="space-y-1.5">
              <Label>Job Description</Label>
              <Textarea value={form.description} onChange={set("description")} rows={4} placeholder="What will this person do?" />
            </div>

            <div className="space-y-1.5">
              <Label>Requirements</Label>
              <Textarea value={form.requirements} onChange={set("requirements")} rows={3} placeholder="Minimum qualifications, experience, etc." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select value={form.status} onChange={set("status")} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex items-end pb-2 gap-2">
                <input type="checkbox" id="featured" checked={form.featured} onChange={set("featured")} className="h-4 w-4" />
                <label htmlFor="featured" className="text-sm text-muted-foreground cursor-pointer">Feature this listing on the homepage</label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button className="volt-gradient" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editJob ? "Save Changes" : "Create Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
