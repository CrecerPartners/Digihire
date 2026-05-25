import { Link } from 'react-router-dom';
import { useRecruitmentRequests } from '../../hooks/useRecruitmentRequests';
import { Plus, Users, CheckCircle2, Clock } from 'lucide-react';

const STAGES: { key: string; label: string }[] = [
  { key: 'open',        label: 'Received' },
  { key: 'sourcing',    label: 'Sourcing' },
  { key: 'in_review',   label: 'Screening' },
  { key: 'shortlisting',label: 'Shortlisting' },
  { key: 'interview',   label: 'Interview' },
  { key: 'offer',       label: 'Offer' },
  { key: 'closed',      label: 'Hired' },
];

function getStageIndex(status: string) {
  const idx = STAGES.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
}

function RecruitmentStepper({ status }: { status: string }) {
  const current = getStageIndex(status);
  const isClosed = status === 'closed';

  return (
    <div className="mt-4 pt-4 border-t border-gray-50">
      <div className="flex items-center gap-0">
        {STAGES.map((stage, i) => {
          const done = i < current || (isClosed && i === current);
          const active = i === current && !isClosed;
          return (
            <div key={stage.key} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div className={`h-2 w-2 rounded-full shrink-0 ${
                  done ? 'bg-violet-600' : active ? 'bg-violet-400 ring-2 ring-violet-200' : 'bg-gray-200'
                }`} />
                <span className={`text-[9px] font-normal mt-1 truncate max-w-full text-center ${
                  done ? 'text-violet-600' : active ? 'text-violet-500 font-medium' : 'text-gray-300'
                }`}>
                  {stage.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`h-px flex-1 mb-3 mx-0.5 ${i < current ? 'bg-violet-600' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RecruitmentDashboard() {
  const { requests, loading } = useRecruitmentRequests();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-normal text-[#1a1a1a]">Recruitment Requests</h2>
          <p className="text-sm text-gray-400">Track your open and active hiring requests.</p>
        </div>
        <Link to="/brand/recruitment/new" className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-normal text-white hover:bg-violet-700 transition-all shadow-sm">
          <Plus size={16} /> New Request
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-12 text-center shadow-sm">
          <div className="h-12 w-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-4">
            <Users size={24} />
          </div>
          <h3 className="font-normal text-[#1a1a1a] mb-1">No recruitment requests yet</h3>
          <p className="text-sm text-gray-400 mb-6">Submit your first request to start hiring vetted sales talent.</p>
          <Link to="/brand/recruitment/new" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-normal text-white hover:bg-violet-700 transition-all">
            <Plus size={16} /> Submit Request
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-normal text-[#1a1a1a]">{r.job_title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400 flex-wrap">
                    {r.role_type && <span>{r.role_type}</span>}
                    {r.work_type && <span>· {r.work_type}</span>}
                    {r.num_hires && <span>· {r.num_hires} hire{r.num_hires > 1 ? 's' : ''}</span>}
                    <span className="flex items-center gap-1"><Clock size={11} /> {new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <p className="text-lg font-extrabold text-[#1a1a1a]">{r.applicant_count}</p>
                    <p className="text-[10px] text-gray-400 font-normal uppercase">Applicants</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-extrabold text-violet-600">{r.shortlist_count}</p>
                    <p className="text-[10px] text-gray-400 font-normal uppercase">Shortlisted</p>
                  </div>
                </div>
              </div>

              <RecruitmentStepper status={r.status} />

              {r.assigned_support && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle2 size={13} className="text-green-500" />
                  <span>Assigned to: <strong>{r.assigned_support}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
