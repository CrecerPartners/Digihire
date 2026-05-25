import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBrandCampaigns } from '../../hooks/useBrandCampaigns';
import { ArrowLeft, Copy, Users, TrendingUp, FileText, CheckCircle2, ExternalLink } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-100',
  active:    'bg-green-50 text-green-700 border-green-100',
  paused:    'bg-gray-50 text-gray-500 border-gray-100',
  completed: 'bg-blue-50 text-blue-700 border-blue-100',
};

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { campaigns, loading, refetch } = useBrandCampaigns();
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const campaign = campaigns.find(c => c.id === id);

  // Auto-refresh every 30s when campaign is active
  useEffect(() => {
    if (campaign?.status !== 'active') return;
    const interval = setInterval(() => {
      refetch();
      setLastUpdated(new Date());
    }, 30_000);
    return () => clearInterval(interval);
  }, [campaign?.status, refetch]);

  const copyTrackingCode = () => {
    if (campaign?.tracking_code) {
      navigator.clipboard.writeText(`https://digihire.io/c/${campaign.tracking_code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || (!campaign && campaigns.length === 0)) return <div className="text-center py-16 text-gray-400">Loading...</div>;
  if (!campaign) return (
    <div className="rounded-2xl bg-white border border-gray-100 p-12 text-center shadow-sm">
      <p className="text-gray-400">Campaign not found.</p>
      <button onClick={() => navigate('/brand/campaigns')} className="mt-4 text-sm text-[#2563eb] font-normal hover:underline">
        Back to Campaigns
      </button>
    </div>
  );

  const isActive = campaign.status === 'active';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/brand/campaigns')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-normal text-[#1a1a1a] truncate">{campaign.campaign_name}</h2>
            {isActive && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 border border-green-200 text-[10px] font-bold text-green-700 uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">{campaign.campaign_goal} · {campaign.product_name}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-3 py-1 rounded-lg border text-[10px] font-normal uppercase tracking-wider ${STATUS_COLOR[campaign.status] ?? STATUS_COLOR.pending}`}>
            {campaign.status}
          </span>
        </div>
      </div>

      {isActive && lastUpdated && (
        <p className="text-[10px] text-gray-400">Stats last updated: {lastUpdated.toLocaleTimeString()} · Auto-refreshes every 30s</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Users size={18} />} label="Sellers Joined" value={campaign.total_sellers} isLive={isActive} />
        <StatCard icon={<TrendingUp size={18} />} label="Conversions" value={campaign.total_conversions} isLive={isActive} />
        <StatCard icon={<FileText size={18} />} label="Total Leads" value={campaign.total_leads} isLive={isActive} />
      </div>

      {/* Tracking Code */}
      {campaign.tracking_code && (
        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-normal uppercase tracking-wider text-gray-400 mb-3">Tracking Code</p>
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <code className="flex-1 text-sm font-mono text-[#1a1a1a] truncate">
              https://digihire.io/c/{campaign.tracking_code}
            </code>
            <button onClick={copyTrackingCode} className="flex items-center gap-1.5 text-xs font-normal text-[#2563eb] hover:text-[#1d4ed8] transition-colors shrink-0">
              {copied ? <><CheckCircle2 size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
        </div>
      )}

      {/* Campaign Details */}
      <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
        <h3 className="font-normal text-[#1a1a1a] mb-4">Campaign Details</h3>
        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
          <Detail label="Brand" value={campaign.brand_name} />
          <Detail label="Product" value={campaign.product_name} />
          <Detail label="Category" value={campaign.product_category} />
          <Detail label="Payout Model" value={campaign.payout_model} />
          <Detail label="Target Volume" value={campaign.target_volume?.toString()} />
          <Detail label="Location" value={[campaign.city, campaign.region].filter(Boolean).join(', ')} />
          <Detail label="Start Date" value={campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : undefined} />
          <Detail label="End Date" value={campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : undefined} />
        </div>
        {campaign.notes && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs font-normal uppercase tracking-wider text-gray-400 mb-2">Notes</p>
            <p className="text-sm text-gray-600 leading-relaxed">{campaign.notes}</p>
          </div>
        )}
      </div>

      {/* Campaign Assets */}
      {campaign.asset_urls && campaign.asset_urls.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-normal uppercase tracking-wider text-gray-400 mb-3">Campaign Assets</p>
          <div className="space-y-2">
            {campaign.asset_urls.map((url, i) => {
              const filename = url.split('/').pop() ?? `Asset ${i + 1}`;
              return (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-[#2563eb] hover:bg-blue-50 transition-all"
                >
                  <FileText size={13} className="shrink-0" />
                  <span className="flex-1 truncate">{filename}</span>
                  <ExternalLink size={12} className="shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, isLive }: { icon: React.ReactNode; label: string; value: number; isLive: boolean }) {
  return (
    <div className={`rounded-2xl bg-white border p-5 shadow-sm text-center transition-all ${isLive ? 'border-green-100' : 'border-gray-100'}`}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${isLive ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-[#2563eb]'}`}>{icon}</div>
      <p className="text-2xl font-extrabold text-[#1a1a1a]">{value}</p>
      <p className="text-[10px] font-normal uppercase tracking-wider text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-normal uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-sm font-normal text-[#1a1a1a] mt-0.5">{value || '—'}</p>
    </div>
  );
}
