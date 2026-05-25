import { useParams, Link } from 'react-router-dom';
import { useActivationRequests } from '../../hooks/useActivationRequests';
import { ArrowLeft, MapPin, Calendar, Users, FileText, DollarSign } from 'lucide-react';

const STAGES: { key: string; label: string; description: string }[] = [
  { key: 'request_received', label: 'Request Received', description: 'Your request has been received and is under review.' },
  { key: 'planning',         label: 'Planning',          description: 'Our team is planning the activation details.' },
  { key: 'sourcing',         label: 'Talent Sourcing',   description: 'We\'re sourcing and vetting the right talent for you.' },
  { key: 'deployment',       label: 'Deployment',        description: 'Talent is being deployed and briefed.' },
  { key: 'live',             label: 'Campaign Live',      description: 'Your activation is running.' },
  { key: 'completed',        label: 'Completed',          description: 'The activation has been completed successfully.' },
];

function getStageIndex(status: string) {
  if (status === 'pending') return 0;
  const idx = STAGES.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
}

export default function ActivationDetail() {
  const { id } = useParams<{ id: string }>();
  const { requests, loading } = useActivationRequests();
  const request = requests.find(r => r.id === id);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>;

  if (!request) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">Activation not found.</p>
        <Link to="/brand/activations" className="mt-4 inline-block text-sm text-amber-500 hover:underline">Back to list</Link>
      </div>
    );
  }

  const current = getStageIndex(request.status);
  const isCompleted = request.status === 'completed';
  const currentStage = STAGES[current];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/brand/activations" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={15} /> Back
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-normal text-[#1a1a1a]">
          {request.activation_type || (request.booking_type === 'meeting' ? `Meeting: ${request.meeting_slot}` : 'Activation Request')}
        </h2>
        <p className="text-sm text-gray-400 mt-1">Submitted {new Date(request.created_at).toLocaleDateString()}</p>
      </div>

      {/* Stage pipeline */}
      <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-medium text-[#1a1a1a] mb-4">Progress</h3>
          <div className="space-y-3">
            {STAGES.map((stage, i) => {
              const done = i < current || (isCompleted && i === current);
              const active = i === current && !isCompleted;
              return (
                <div key={stage.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                      done ? 'bg-amber-500 border-amber-500 text-white'
                        : active ? 'bg-white border-amber-400 text-amber-500'
                        : 'bg-white border-gray-200 text-gray-300'
                    }`}>
                      {done ? '✓' : i + 1}
                    </div>
                    {i < STAGES.length - 1 && (
                      <div className={`w-px h-6 mt-1 ${i < current ? 'bg-amber-400' : 'bg-gray-100'}`} />
                    )}
                  </div>
                  <div className="pb-2 min-w-0">
                    <p className={`text-sm font-normal ${done || active ? 'text-[#1a1a1a]' : 'text-gray-300'}`}>
                      {stage.label}
                      {active && <span className="ml-2 text-[10px] font-normal bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Current</span>}
                    </p>
                    {(done || active) && (
                      <p className="text-xs text-gray-400 mt-0.5">{stage.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {currentStage && (
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">Current Status</p>
            <p className="text-sm text-amber-800">{currentStage.description}</p>
          </div>
        )}
      </div>

      {/* Request details */}
      <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
        <h3 className="text-sm font-medium text-[#1a1a1a] mb-4">Request Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {request.location && (
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Location</p>
                <p className="text-[#1a1a1a]">{request.location}</p>
              </div>
            </div>
          )}
          {(request.preferred_start_date || request.preferred_end_date) && (
            <div className="flex items-start gap-2">
              <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Dates</p>
                <p className="text-[#1a1a1a]">
                  {request.preferred_start_date && new Date(request.preferred_start_date).toLocaleDateString()}
                  {request.preferred_start_date && request.preferred_end_date && ' → '}
                  {request.preferred_end_date && new Date(request.preferred_end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          {request.num_talents && (
            <div className="flex items-start gap-2">
              <Users size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Talents Needed</p>
                <p className="text-[#1a1a1a]">{request.num_talents}</p>
              </div>
            </div>
          )}
          {request.approximate_scale && (
            <div className="flex items-start gap-2">
              <FileText size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Scale</p>
                <p className="text-[#1a1a1a]">{request.approximate_scale}</p>
              </div>
            </div>
          )}
        </div>

        {request.talent_types && request.talent_types.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Talent Types</p>
            <div className="flex flex-wrap gap-2">
              {request.talent_types.map(t => (
                <span key={t} className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">{t}</span>
              ))}
            </div>
          </div>
        )}

        {request.talent_duties && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Talent Duties</p>
            <p className="text-sm text-[#1a1a1a] whitespace-pre-line">{request.talent_duties}</p>
          </div>
        )}

        {request.budget_details && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-start gap-2">
              <DollarSign size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Budget Details</p>
                <p className="text-sm text-[#1a1a1a] whitespace-pre-line">{request.budget_details}</p>
              </div>
            </div>
          </div>
        )}

        {request.goals && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Goals</p>
            <p className="text-sm text-[#1a1a1a] whitespace-pre-line">{request.goals}</p>
          </div>
        )}

        {request.notes && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Additional Notes</p>
            <p className="text-sm text-[#1a1a1a] whitespace-pre-line">{request.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
