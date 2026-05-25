import { useState, useEffect } from 'react';
import { supabase as _supabase } from '@digihire/shared';
import { Zap, ChevronDown, ChevronUp, Save, MessageSquare, UserPlus, FileText } from 'lucide-react';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

interface ActivationRequest {
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
  assigned_talent?: string;
  admin_notes?: string;
  report_url?: string;
  created_at: string;
  brand_profiles?: { company_name?: string };
}

const STAGE_OPTIONS = [
  { value: 'request_received', label: 'Request Received' },
  { value: 'planning',         label: 'Planning' },
  { value: 'sourcing',         label: 'Talent Sourcing' },
  { value: 'deployment',       label: 'Deployment' },
  { value: 'live',             label: 'Campaign Live' },
  { value: 'completed',        label: 'Completed' },
];

const STAGE_COLOR: Record<string, string> = {
  pending:          'bg-yellow-50 text-yellow-700 border-yellow-100',
  request_received: 'bg-blue-50 text-blue-700 border-blue-100',
  planning:         'bg-indigo-50 text-indigo-700 border-indigo-100',
  sourcing:         'bg-cyan-50 text-cyan-700 border-cyan-100',
  deployment:       'bg-orange-50 text-orange-700 border-orange-100',
  live:             'bg-green-50 text-green-700 border-green-100',
  completed:        'bg-gray-50 text-gray-500 border-gray-100',
};

type EditRecord = { status: string; assigned_talent: string; admin_notes: string; report_url: string };

export default function AdminActivations() {
  const [requests, setRequests] = useState<ActivationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, EditRecord>>({});
  const [notesOpen, setNotesOpen] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('activation_requests')
      .select('*, brand_profiles(company_name)')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }: { data: ActivationRequest[] | null; error: { message: string } | null }) => {
        if (err) { setFetchError(err.message); setLoading(false); return; }
        const rows = data ?? [];
        setRequests(rows);
        const initialEdits: Record<string, EditRecord> = {};
        rows.forEach(r => {
          initialEdits[r.id] = {
            status: r.status === 'pending' ? 'request_received' : r.status,
            assigned_talent: r.assigned_talent ?? '',
            admin_notes: r.admin_notes ?? '',
            report_url: r.report_url ?? '',
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
      .from('activation_requests')
      .update({
        status: edit.status,
        assigned_talent: edit.assigned_talent || null,
        admin_notes: edit.admin_notes || null,
        report_url: edit.report_url || null,
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

  const setEdit = (id: string, field: keyof EditRecord, value: string) =>
    setEdits(p => ({ ...p, [id]: { ...p[id], [field]: value } }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activations</h1>
          <p className="text-muted-foreground text-sm">Manage brand field activation requests and advance their stage.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <Zap className="h-4 w-4" /> {requests.length} Requests
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading...</div>
      ) : fetchError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600 text-sm">{fetchError}</div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">No activation requests yet.</div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => {
            const edit = edits[r.id] ?? { status: r.status, assigned_talent: '', admin_notes: '', report_url: '' };
            const isExpanded = expanded === r.id;
            const displayStatus = r.status === 'pending' ? 'request_received' : r.status;
            return (
              <div key={r.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-5 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : r.id)}>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">
                      {r.activation_type || (r.booking_type === 'meeting' ? `Meeting: ${r.meeting_slot}` : 'Activation Request')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.brand_profiles?.company_name ?? r.company_name ?? r.brand_id}
                      {r.location && ` · ${r.location}`}
                      {r.num_talents && ` · ${r.num_talents} talents`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase ${STAGE_COLOR[displayStatus] ?? STAGE_COLOR.request_received}`}>
                      {displayStatus.replace(/_/g, ' ')}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border p-5 space-y-5 bg-muted/20">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <Detail label="Contact Person" value={r.contact_person} />
                      <Detail label="Email" value={r.email} />
                      <Detail label="Phone" value={r.phone} />
                      <Detail label="Start Date" value={r.preferred_start_date ? new Date(r.preferred_start_date).toLocaleDateString() : undefined} />
                      <Detail label="End Date" value={r.preferred_end_date ? new Date(r.preferred_end_date).toLocaleDateString() : undefined} />
                      <Detail label="Scale" value={r.approximate_scale} />
                      <Detail label="Num Talents" value={r.num_talents?.toString()} />
                    </div>

                    {r.talent_types && r.talent_types.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Talent Types</p>
                        <div className="flex flex-wrap gap-2">
                          {r.talent_types.map(t => (
                            <span key={t} className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {r.talent_duties && <Detail label="Talent Duties" value={r.talent_duties} />}
                    {r.budget_details && <Detail label="Budget Details" value={r.budget_details} />}
                    {r.goals && <Detail label="Goals" value={r.goals} />}
                    {r.notes && <Detail label="Client Notes" value={r.notes} />}

                    {/* Admin Controls */}
                    <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stage</label>
                        <select value={edit.status} onChange={e => setEdit(r.id, 'status', e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary">
                          {STAGE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <UserPlus size={11} /> Assigned Talent
                        </label>
                        <input
                          value={edit.assigned_talent}
                          onChange={e => setEdit(r.id, 'assigned_talent', e.target.value)}
                          placeholder="Talent name(s) or IDs..."
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <FileText size={11} /> Report URL
                        </label>
                        <input
                          value={edit.report_url}
                          onChange={e => setEdit(r.id, 'report_url', e.target.value)}
                          placeholder="https://... (Google Drive, etc.)"
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Internal Notes */}
                    <div>
                      <button
                        onClick={() => setNotesOpen(notesOpen === r.id ? null : r.id)}
                        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
                      >
                        <MessageSquare size={13} />
                        Operational Notes {notesOpen === r.id ? '▲' : '▼'}
                      </button>
                      {notesOpen === r.id && (
                        <textarea
                          rows={3}
                          placeholder="Deployment notes, WhatsApp/call summaries, follow-up actions..."
                          value={edit.admin_notes}
                          onChange={e => setEdit(r.id, 'admin_notes', e.target.value)}
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                        />
                      )}
                      {edit.admin_notes && notesOpen !== r.id && (
                        <p className="text-xs text-muted-foreground italic line-clamp-1">Note: {edit.admin_notes}</p>
                      )}
                    </div>

                    {/* Report link preview */}
                    {edit.report_url && (
                      <div className="flex items-center gap-2 text-xs">
                        <FileText size={12} className="text-primary" />
                        <a href={edit.report_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                          View Report
                        </a>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button onClick={() => handleSave(r.id)} disabled={saving === r.id} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
                        {saving === r.id ? 'Saving...' : <><Save className="h-4 w-4" /> Save</>}
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
      <p className="text-sm font-medium mt-0.5 whitespace-pre-line">{value || '—'}</p>
    </div>
  );
}
