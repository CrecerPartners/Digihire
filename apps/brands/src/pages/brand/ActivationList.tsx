import { Link } from 'react-router-dom';
import { useActivationRequests } from '../../hooks/useActivationRequests';
import { Plus, Zap, Calendar, MapPin, ChevronRight } from 'lucide-react';

const STAGES: { key: string; label: string }[] = [
  { key: 'request_received', label: 'Received' },
  { key: 'planning',         label: 'Planning' },
  { key: 'sourcing',         label: 'Sourcing' },
  { key: 'deployment',       label: 'Deployment' },
  { key: 'live',             label: 'Live' },
  { key: 'completed',        label: 'Completed' },
];

function getStageIndex(status: string) {
  // Legacy 'pending' maps to stage 0 (received)
  if (status === 'pending') return 0;
  const idx = STAGES.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
}

function ActivationStepper({ status }: { status: string }) {
  const current = getStageIndex(status);
  const isCompleted = status === 'completed';

  return (
    <div className="mt-4 pt-4 border-t border-gray-50">
      <div className="flex items-center gap-0">
        {STAGES.map((stage, i) => {
          const done = i < current || (isCompleted && i === current);
          const active = i === current && !isCompleted;
          return (
            <div key={stage.key} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div className={`h-2 w-2 rounded-full shrink-0 ${
                  done ? 'bg-amber-500' : active ? 'bg-amber-400 ring-2 ring-amber-200' : 'bg-gray-200'
                }`} />
                <span className={`text-[9px] font-normal mt-1 truncate max-w-full text-center ${
                  done ? 'text-amber-600' : active ? 'text-amber-500 font-medium' : 'text-gray-300'
                }`}>
                  {stage.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`h-px flex-1 mb-3 mx-0.5 ${i < current ? 'bg-amber-500' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ActivationList() {
  const { requests, loading } = useActivationRequests();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-normal text-[#1a1a1a]">Activations & Field Marketing</h2>
          <p className="text-sm text-gray-400">Track your activation requests and field marketing bookings.</p>
        </div>
        <Link
          to="/brand/activations/new"
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-normal text-white hover:bg-amber-600 transition-all shadow-sm"
        >
          <Plus size={16} /> New Request
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-12 text-center shadow-sm">
          <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <Zap size={24} />
          </div>
          <h3 className="font-normal text-[#1a1a1a] mb-1">No activation requests yet</h3>
          <p className="text-sm text-gray-400 mb-6">Submit your first request to book field marketing support.</p>
          <Link
            to="/brand/activations/new"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-normal text-white hover:bg-amber-600 transition-all"
          >
            <Plus size={16} /> Submit Request
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <Link key={r.id} to={`/brand/activations/${r.id}`} className="block rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:border-amber-200 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-normal text-[#1a1a1a]">
                    {r.activation_type || (r.booking_type === 'meeting' ? `Meeting: ${r.meeting_slot}` : 'Activation Request')}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                    {r.location && (
                      <span className="flex items-center gap-1"><MapPin size={11} /> {r.location}</span>
                    )}
                    {r.preferred_start_date && (
                      <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(r.preferred_start_date).toLocaleDateString()}</span>
                    )}
                    {r.num_talents && <span>· {r.num_talents} talents</span>}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0 mt-1" />
              </div>
              <ActivationStepper status={r.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
