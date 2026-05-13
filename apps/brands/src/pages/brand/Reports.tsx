import React from 'react';
import { Link } from 'react-router-dom';
import { useBrandCampaigns } from '../../hooks/useBrandCampaigns';
import { useRecruitmentRequests } from '../../hooks/useRecruitmentRequests';
import { useActivationRequests } from '../../hooks/useActivationRequests';
import { Megaphone, Users, Zap, TrendingUp, RefreshCw } from 'lucide-react';

export default function Reports() {
  const { campaigns, loading: cLoading, refetch } = useBrandCampaigns();
  const { requests: recruitReqs, loading: rLoading } = useRecruitmentRequests();
  const { requests: activationReqs, loading: aLoading } = useActivationRequests();

  const loading = cLoading || rLoading || aLoading;

  const totalSellers = campaigns.reduce((s, c) => s + c.total_sellers, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.total_conversions, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">Reports & Tracking</h2>
          <p className="text-sm text-gray-400">Consolidated view of all your activity with Digihire.</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-400 transition-all text-xs font-normal">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading reports...</div>
      ) : (
        <>
          {/* Campaign Summary */}
          <Section title="VoltSquad Campaigns" icon={<Megaphone size={16} />} color="text-[#2563eb]" to="/brand/campaigns">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <MetricCard label="Total Campaigns" value={campaigns.length} />
              <MetricCard label="Active" value={campaigns.filter(c => c.status === 'active').length} />
              <MetricCard label="Total Sellers" value={totalSellers} />
              <MetricCard label="Conversions" value={totalConversions} />
            </div>
            {campaigns.slice(0, 3).map(c => (
              <Link key={c.id} to={`/brand/campaigns/${c.id}`} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:text-[#2563eb] transition-colors group">
                <span className="text-sm font-semibold text-[#1a1a1a] group-hover:text-[#2563eb]">{c.campaign_name}</span>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Users size={12} /> {c.total_sellers}</span>
                  <span className="flex items-center gap-1"><TrendingUp size={12} /> {c.total_conversions}</span>
                  <StatusBadge status={c.status} />
                </div>
              </Link>
            ))}
          </Section>

          {/* Recruitment Summary */}
          <Section title="Recruitment" icon={<Users size={16} />} color="text-violet-600" to="/brand/recruitment">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <MetricCard label="Total Requests" value={recruitReqs.length} />
              <MetricCard label="Open" value={recruitReqs.filter(r => r.status === 'open').length} />
              <MetricCard label="In Review" value={recruitReqs.filter(r => r.status === 'in_review').length} />
              <MetricCard label="Shortlisting" value={recruitReqs.filter(r => r.status === 'shortlisting').length} />
            </div>
            {recruitReqs.slice(0, 3).map(r => (
              <div key={r.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <span className="text-sm font-semibold text-[#1a1a1a]">{r.job_title}</span>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{r.num_hires ?? 1} hire{(r.num_hires ?? 1) > 1 ? 's' : ''}</span>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </Section>

          {/* Activations Summary */}
          <Section title="Activations" icon={<Zap size={16} />} color="text-amber-500" to="/brand/activations">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <MetricCard label="Total Requests" value={activationReqs.length} />
              <MetricCard label="Pending" value={activationReqs.filter(a => a.status === 'pending').length} />
              <MetricCard label="Confirmed" value={activationReqs.filter(a => a.status === 'confirmed').length} />
            </div>
            {activationReqs.slice(0, 3).map(a => (
              <div key={a.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <span className="text-sm font-semibold text-[#1a1a1a]">{a.activation_type || (a.booking_type === 'meeting' ? `Meeting: ${a.meeting_slot}` : 'Activation')}</span>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, icon, color, to, children }: { title: string; icon: React.ReactNode; color: string; to: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className={`flex items-center gap-2 font-bold text-[#1a1a1a] ${color}`}>
          {icon}
          <span className="text-[#1a1a1a]">{title}</span>
        </div>
        <Link to={to} className="text-xs font-normal text-[#2563eb] hover:underline">View all →</Link>
      </div>
      {children}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
      <p className="text-xl font-extrabold text-[#1a1a1a]">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  active: 'bg-green-50 text-green-700 border-green-100',
  open: 'bg-blue-50 text-blue-700 border-blue-100',
  in_review: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  shortlisting: 'bg-violet-50 text-violet-700 border-violet-100',
  confirmed: 'bg-green-50 text-green-700 border-green-100',
  closed: 'bg-gray-50 text-gray-500 border-gray-100',
  completed: 'bg-blue-50 text-blue-700 border-blue-100',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[status] ?? STATUS_COLORS.pending}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
