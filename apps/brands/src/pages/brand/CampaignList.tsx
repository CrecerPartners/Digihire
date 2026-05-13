import { Link } from 'react-router-dom';
import { useBrandCampaigns } from '../../hooks/useBrandCampaigns';
import { Plus, Megaphone, Users, TrendingUp, RefreshCw } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-100',
  active:    'bg-green-50 text-green-700 border-green-100',
  paused:    'bg-gray-50 text-gray-500 border-gray-100',
  completed: 'bg-blue-50 text-blue-700 border-blue-100',
};

export default function CampaignList() {
  const { campaigns, loading, refetch } = useBrandCampaigns();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">VoltSquad Campaigns</h2>
          <p className="text-sm text-gray-400">Track all your active and past campaigns.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refetch} className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-400 transition-all">
            <RefreshCw size={16} />
          </button>
          <Link to="/brand/campaigns/new" className="flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-normal text-white hover:bg-[#1d4ed8] transition-all shadow-sm shadow-blue-100">
            <Plus size={16} /> New Campaign
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-12 text-center shadow-sm">
          <div className="h-12 w-12 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center mx-auto mb-4">
            <Megaphone size={24} />
          </div>
          <h3 className="font-bold text-[#1a1a1a] mb-1">No campaigns yet</h3>
          <p className="text-sm text-gray-400 mb-6">Launch your first campaign to start reaching VoltSquad sellers.</p>
          <Link to="/brand/campaigns/new" className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-6 py-2.5 text-sm font-normal text-white hover:bg-[#1d4ed8] transition-all">
            <Plus size={16} /> Launch Campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <Link key={c.id} to={`/brand/campaigns/${c.id}`} className="flex items-center justify-between rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:border-[#2563eb]/30 hover:shadow-md transition-all group">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0">
                  <Megaphone size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#1a1a1a] truncate group-hover:text-[#2563eb] transition-colors">{c.campaign_name}</p>
                  <p className="text-xs text-gray-400">{c.campaign_goal ?? 'No goal set'} · Created {new Date(c.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0 ml-4">
                <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Users size={13} /> {c.total_sellers}</span>
                  <span className="flex items-center gap-1"><TrendingUp size={13} /> {c.total_conversions}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[c.status] ?? STATUS_COLOR.pending}`}>
                  {c.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
