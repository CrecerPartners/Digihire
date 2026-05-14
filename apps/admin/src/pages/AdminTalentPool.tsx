import { useState, useEffect } from 'react';
import { supabase as _supabase } from '@digihire/shared';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Filter, MapPin, ChevronRight } from 'lucide-react';
import TalentDetailsModal from '@/components/TalentDetailsModal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

interface TalentProfile {
  id: string;
  full_name: string;
  bio?: string;
  skills?: string[];
  role_interest?: string[];
  city?: string;
  country?: string;
  years_of_experience?: number;
  salary_min?: number;
  salary_max?: number;
  availability_status?: string;
  work_preference?: string;
  education?: { degree?: string; institution?: string; summary?: string }[];
  status: string;
  updated_at: string;
  industry_experience?: string[];
  talent_profile_scores?: { overall_score: number }[];
}

const statusColors: Record<string, string> = {
  'Under Review': 'bg-orange-50 text-orange-700 border-orange-100',
  'Shortlisted': 'bg-sky-50 text-sky-700 border-sky-100',
  'Matched': 'bg-green-50 text-green-700 border-green-100',
  'complete': 'bg-blue-50 text-blue-700 border-blue-100',
  'incomplete': 'bg-gray-50 text-gray-500 border-gray-100',
  'Archived': 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function AdminTalentPool() {
  const [talents, setTalents] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTalent, setSelectedTalent] = useState<TalentProfile | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [expFilter, setExpFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [workTypeFilter, setWorkTypeFilter] = useState('all');

  useEffect(() => {
    supabase
      .from('talent_profiles')
      .select('*, talent_profile_scores(overall_score)')
      .order('updated_at', { ascending: false })
      .then(({ data }: { data: TalentProfile[] | null }) => {
        setTalents(data ?? []);
        setLoading(false);
      });
  }, []);

  const handleStatusChange = (id: string, newStatus: string) => {
    setTalents(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const filtered = talents.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      t.full_name.toLowerCase().includes(q) ||
      t.skills?.some(s => s.toLowerCase().includes(q)) ||
      t.role_interest?.some(r => r.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesRole = roleFilter === 'all' || t.role_interest?.includes(roleFilter);
    const matchesCity = cityFilter === 'all' || t.city === cityFilter;
    const matchesExp = expFilter === 'all' || (
      expFilter === '0-2' ? (t.years_of_experience ?? 0) <= 2 :
      expFilter === '3-5' ? (t.years_of_experience ?? 0) >= 3 && (t.years_of_experience ?? 0) <= 5 :
      expFilter === '5+' ? (t.years_of_experience ?? 0) > 5 : true
    );
    const matchesAvailability = availabilityFilter === 'all' || t.availability_status === availabilityFilter;
    const matchesIndustry = industryFilter === 'all' || t.industry_experience?.includes(industryFilter);
    const matchesWorkType = workTypeFilter === 'all' || t.work_preference === workTypeFilter;

    return matchesSearch && matchesStatus && matchesRole && matchesCity && matchesExp && matchesAvailability && matchesIndustry && matchesWorkType;
  });

  const uniqueCities = Array.from(new Set(talents.map(t => t.city).filter(Boolean)));
  const uniqueIndustries = Array.from(new Set(talents.flatMap(t => t.industry_experience || []).filter(Boolean)));

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Talent Pool</h1>
            <p className="text-slate-500">Curate and match elite sales talent to brand opportunities.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex items-center px-4 py-2 text-sm font-bold text-sky-600">
            <Users size={18} className="mr-2" /> {talents.length} Profiles
          </div>
        </header>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-8 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="md:col-span-2 lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, skills, roles..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-xs font-medium focus:bg-white focus:outline-none focus:border-sky-500"
          >
            <option value="all">Status</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Matched">Matched</option>
            <option value="complete">Complete</option>
            <option value="incomplete">Incomplete</option>
            <option value="Archived">Archived</option>
          </select>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-xs font-medium focus:bg-white focus:outline-none focus:border-sky-500"
          >
            <option value="all">Roles</option>
            {['B2B Sales', 'Tech Sales', 'SaaS Sales', 'SDR', 'BDR', 'AE'].map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-xs font-medium focus:bg-white focus:outline-none focus:border-sky-500"
          >
            <option value="all">City</option>
            {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={expFilter}
            onChange={e => setExpFilter(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-xs font-medium focus:bg-white focus:outline-none focus:border-sky-500"
          >
            <option value="all">Experience</option>
            <option value="0-2">0-2 years</option>
            <option value="3-5">3-5 years</option>
            <option value="5+">5+ years</option>
          </select>
          <select
            value={availabilityFilter}
            onChange={e => setAvailabilityFilter(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-xs font-medium focus:bg-white focus:outline-none focus:border-sky-500"
          >
            <option value="all">Availability</option>
            <option value="available">Available</option>
            <option value="looking">Looking</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <select
            value={workTypeFilter}
            onChange={e => setWorkTypeFilter(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-xs font-medium focus:bg-white focus:outline-none focus:border-sky-500"
          >
            <option value="all">Work Type</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-slate-500">
            <Filter size={16} /> {filtered.length} results
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading Talent Pool...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(talent => (
              <motion.div
                key={talent.id}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedTalent(talent)}
                className="group bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 font-bold text-lg border border-white">
                        {talent.full_name.charAt(0)}
                      </div>
                      {(() => {
                        const s = talent.talent_profile_scores?.[0]?.overall_score;
                        if (s == null) return null;
                        const cls = s >= 75 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-400' : 'bg-red-400';
                        return (
                          <span className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full ${cls} text-white text-[9px] font-bold flex items-center justify-center border border-white`}>
                            {s}
                          </span>
                        );
                      })()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-sky-600 transition-colors">{talent.full_name}</h3>
                      <p className="text-xs text-slate-500">{talent.role_interest?.slice(0, 1).join(' • ') || 'Sales'} • {talent.years_of_experience ?? 0} yrs</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${statusColors[talent.status] ?? statusColors['incomplete']}`}>
                    {talent.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {talent.skills?.slice(0, 3).map(skill => (
                    <span key={skill} className="px-2 py-1 bg-gray-50 text-slate-500 text-[10px] rounded border border-gray-100">{skill}</span>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider">
                    <MapPin size={12} /> {talent.city || 'Remote'}
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-all">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-20 text-slate-400">No talent profiles match your filters.</div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedTalent && (
          <TalentDetailsModal
            talent={selectedTalent}
            onClose={() => setSelectedTalent(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
