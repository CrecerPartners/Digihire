import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase as _supabase, useAuth } from '@digihire/shared';
import { useTalentProfile } from '../../hooks/useTalentProfile';
import {
  Briefcase, FileText, Loader2, ExternalLink, Clock,
  CheckCircle2, XCircle, Eye, Star, Search,
} from 'lucide-react';

const supabase = _supabase as any;

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-Time', part_time: 'Part-Time', contract: 'Contract',
  gig: 'Gig', internship: 'Internship',
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending Review',
    className: 'text-muted-foreground bg-secondary border-border/50',
    icon: <Clock className="h-3 w-3" />,
  },
  reviewed: {
    label: 'Reviewed',
    className: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
    icon: <Eye className="h-3 w-3" />,
  },
  shortlisted: {
    label: 'Shortlisted',
    className: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
    icon: <Star className="h-3 w-3" />,
  },
  rejected: {
    label: 'Not Selected',
    className: 'text-destructive bg-destructive/10 border-destructive/20',
    icon: <XCircle className="h-3 w-3" />,
  },
  hired: {
    label: 'Hired!',
    className: 'text-green-600 bg-green-500/10 border-green-500/20',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
};

interface Application {
  id: string;
  job_id: string;
  cover_note?: string;
  cv_url?: string;
  status: string;
  created_at: string;
  job_listings?: {
    title: string;
    company_name: string;
    job_type: string;
    location?: string;
  };
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

export default function MyApplications() {
  const { user } = useAuth();
  const { profile } = useTalentProfile();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    supabase
      .from('job_applications')
      .select('*, job_listings!job_id(title, company_name, job_type, location)')
      .eq('talent_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }: { data: Application[] | null; error: { message: string } | null }) => {
        if (!error && data) setApplications(data);
        setLoading(false);
      });
  }, [user?.id]);

  const pending = applications.filter(a => a.status === 'pending').length;
  const shortlisted = applications.filter(a => a.status === 'shortlisted').length;
  const hired = applications.filter(a => a.status === 'hired').length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Applications</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track the status of your job applications</p>
        </div>
        <button
          onClick={() => navigate('/talent/jobs')}
          className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
        >
          <Search className="h-4 w-4" /> Browse Jobs
        </button>
      </div>

      {/* Stats row */}
      {applications.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Applied" value={applications.length} />
          <StatCard label="Shortlisted" value={shortlisted} accent="amber" />
          <StatCard label="Hired" value={hired} accent="green" />
        </div>
      )}

      {/* CV on file */}
      {profile?.cv_url && (
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/30 px-4 py-3">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Your CV is on file</p>
            <p className="text-xs text-muted-foreground">Used for applications unless you upload a different one</p>
          </div>
          <a
            href={profile.cv_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
          >
            View CV <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Applications list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Briefcase className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No applications yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Browse open roles and apply with your Digihire profile</p>
          <button
            onClick={() => navigate('/talent/jobs')}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Search className="h-4 w-4" /> Browse Jobs & Gigs
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => {
            const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
            const job = app.job_listings;
            return (
              <div
                key={app.id}
                className="rounded-xl border border-border/50 bg-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">
                      {job?.title || 'Role no longer available'}
                    </p>
                    {job?.company_name && (
                      <p className="text-xs text-muted-foreground mt-0.5">{job.company_name}</p>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      {job?.job_type && (
                        <span className="text-[11px] text-muted-foreground">
                          {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                        </span>
                      )}
                      {job?.location && (
                        <span className="text-[11px] text-muted-foreground">{job.location}</span>
                      )}
                      <span className="text-[11px] text-muted-foreground">{timeAgo(app.created_at)}</span>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-[11px] font-bold border rounded-full px-2 py-0.5 shrink-0 ${statusCfg.className}`}>
                    {statusCfg.icon}
                    {statusCfg.label}
                  </span>
                </div>

                {/* Cover note preview */}
                {app.cover_note && (
                  <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2 line-clamp-2">
                    "{app.cover_note}"
                  </p>
                )}

                {/* CV used for this application */}
                {app.cv_url && (
                  <a
                    href={app.cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <FileText className="h-3 w-3" /> View CV submitted
                  </a>
                )}

                {/* Status-specific messages */}
                {app.status === 'shortlisted' && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                    <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Congratulations! You've been shortlisted. Expect to hear from the employer soon.
                    </p>
                  </div>
                )}
                {app.status === 'hired' && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <p className="text-xs text-green-700 dark:text-green-400">
                      You got the job! Check your email for next steps from {job?.company_name || 'the employer'}.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Incomplete profile nudge */}
      {!loading && (profile?.profile_completion ?? 0) < 80 && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Boost your chances</p>
            <p className="text-xs text-muted-foreground">A complete profile with CV and skills gets 3× more views from brands.</p>
          </div>
          <button
            onClick={() => navigate('/talent/profile/setup')}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
          >
            Complete Profile →
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: 'amber' | 'green' }) {
  const colorMap = {
    amber: 'text-amber-600',
    green: 'text-green-600',
  };
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
      <p className={`text-2xl font-bold ${accent ? colorMap[accent] : 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
