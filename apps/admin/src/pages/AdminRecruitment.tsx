import { useState, useEffect } from 'react';
import { supabase as _supabase } from '@digihire/shared';
import { Users, ChevronDown, ChevronUp, Save, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

interface RecruitmentRequest {
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
  required_skills?: string[];
  salary_min?: number;
  salary_max?: number;
  work_type?: string;
  job_location?: string;
  deadline?: string;
  responsibilities?: string;
  additional_notes?: string;
  status: string;
  applicant_count: number;
  shortlist_count: number;
  assigned_support?: string;
  created_at: string;
  brand_profiles?: { company_name?: string };
}

const STATUS_OPTIONS = [
  { value: 'open',         label: 'Request Received' },
  { value: 'sourcing',     label: 'Sourcing in Progress' },
  { value: 'in_review',    label: 'Screening' },
  { value: 'shortlisting', label: 'Shortlisting' },
  { value: 'interview',    label: 'Interview Stage' },
  { value: 'offer',        label: 'Offer Stage' },
  { value: 'closed',       label: 'Completed / Hired' },
];
const STATUS_COLOR: Record<string, string> = {
  open:         'bg-blue-50 text-blue-700 border-blue-100',
  sourcing:     'bg-cyan-50 text-cyan-700 border-cyan-100',
  in_review:    'bg-yellow-50 text-yellow-700 border-yellow-100',
  shortlisting: 'bg-violet-50 text-violet-700 border-violet-100',
  interview:    'bg-orange-50 text-orange-700 border-orange-100',
  offer:        'bg-green-50 text-green-700 border-green-100',
  closed:       'bg-gray-50 text-gray-500 border-gray-100',
};

export default function AdminRecruitment() {
  const [requests, setRequests] = useState<RecruitmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { status: string; assigned_support: string; applicant_count: number; shortlist_count: number; admin_notes: string }>>({});
  const [notesOpen, setNotesOpen] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('recruitment_requests')
      .select('*, brand_profiles(company_name)')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }: { data: RecruitmentRequest[] | null; error: { message: string } | null }) => {
        if (err) { setFetchError(err.message); setLoading(false); return; }
        const rows = data ?? [];
        setRequests(rows);
        const initialEdits: typeof edits = {};
        rows.forEach(r => {
          initialEdits[r.id] = {
            status: r.status,
            assigned_support: r.assigned_support ?? '',
            applicant_count: r.applicant_count,
            shortlist_count: r.shortlist_count,
            admin_notes: (r as any).admin_notes ?? '',
          };
        });
        setEdits(initialEdits);
        setLoading(false);
      });
  }, []);

  const handleSave = async (id: string) => {
    setSaving(id);
    const edit = edits[id];
    const { error } = await supabase
      .from('recruitment_requests')
      .update({
        status: edit.status,
        assigned_support: edit.assigned_support || null,
        applicant_count: Number(edit.applicant_count),
        shortlist_count: Number(edit.shortlist_count),
        admin_notes: edit.admin_notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (!error) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, ...edit } : r));
      toast.success('Saved');
    } else {
      toast.error('Failed to save');
    }
    setSaving(null);
  };

  const setEdit = (id: string, field: string, value: string | number) =>
    setEdits(p => ({ ...p, [id]: { ...p[id], [field]: value } }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recruitment Requests</h1>
          <p className="text-muted-foreground text-sm">Review and manage brand recruitment submissions.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <Users className="h-4 w-4" /> {requests.length} Requests
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading...</div>
      ) : fetchError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600 text-sm">{fetchError}</div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">No recruitment requests yet.</div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => {
            const edit = edits[r.id] ?? { status: r.status, assigned_support: r.assigned_support ?? '', applicant_count: r.applicant_count, shortlist_count: r.shortlist_count };
            const isExpanded = expanded === r.id;
            return (
              <div key={r.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-5 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : r.id)}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground">{r.job_title}</p>
                      <p className="text-xs text-muted-foreground">{r.brand_profiles?.company_name ?? r.brand_id} · {r.num_hires ?? 1} hire{(r.num_hires ?? 1) > 1 ? 's' : ''} · {r.work_type ?? 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase ${STATUS_COLOR[r.status] ?? STATUS_COLOR.open}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border p-5 space-y-5 bg-muted/20">
                    {/* Request details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <Detail label="Contact" value={r.contact_person} />
                      <Detail label="Location" value={r.location} />
                      <Detail label="Industry" value={r.industry} />
                      <Detail label="Timeline" value={r.hiring_timeline} />
                      <Detail label="Experience" value={r.experience_level} />
                      <Detail label="Deadline" value={r.deadline ? new Date(r.deadline).toLocaleDateString() : undefined} />
                      <Detail label="Salary" value={r.salary_min && r.salary_max ? `₦${r.salary_min.toLocaleString()} – ₦${r.salary_max.toLocaleString()}` : undefined} />
                      <Detail label="Submitted" value={new Date(r.created_at).toLocaleDateString()} />
                    </div>
                    {r.required_skills && r.required_skills.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Required Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {r.required_skills.map(s => <span key={s} className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">{s}</span>)}
                        </div>
                      </div>
                    )}
                    {r.responsibilities && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Responsibilities</p>
                        <p className="text-sm text-foreground/80">{r.responsibilities}</p>
                      </div>
                    )}

                    {/* Admin controls */}
                    <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
                        <select value={edit.status} onChange={e => setEdit(r.id, 'status', e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary">
                          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned Support</label>
                        <input value={edit.assigned_support} onChange={e => setEdit(r.id, 'assigned_support', e.target.value)} placeholder="Team member name" className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Applicants</label>
                        <input type="number" min={0} value={edit.applicant_count} onChange={e => setEdit(r.id, 'applicant_count', e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shortlisted</label>
                        <input type="number" min={0} value={edit.shortlist_count} onChange={e => setEdit(r.id, 'shortlist_count', e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                      </div>
                    </div>
                    {/* Internal Admin Notes */}
                    <div className="border-t border-border pt-4">
                      <button
                        onClick={() => setNotesOpen(notesOpen === r.id ? null : r.id)}
                        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
                      >
                        <MessageSquare size={13} />
                        Internal Notes {notesOpen === r.id ? '▲' : '▼'}
                      </button>
                      {notesOpen === r.id && (
                        <textarea
                          rows={3}
                          placeholder="Add internal notes (WhatsApp/call/email summaries, follow-ups)..."
                          value={edit.admin_notes}
                          onChange={e => setEdit(r.id, 'admin_notes', e.target.value)}
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                        />
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button onClick={() => handleSave(r.id)} disabled={saving === r.id} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
                        {saving === r.id ? 'Saving...' : <><Save className="h-4 w-4" /> Save Changes</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value || '—'}</p>
    </div>
  );
}
