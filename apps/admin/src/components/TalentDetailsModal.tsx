import React, { useState, useEffect } from 'react';
import { supabase as _supabase, useAuth } from '@digihire/shared';
import { motion } from 'motion/react';
import { X, MapPin, Briefcase, GraduationCap, DollarSign, Calendar, User, Send } from 'lucide-react';

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
  work_history?: { summary?: string }[];
  languages?: string[];
  cv_url?: string;
  status: string;
}

interface InternalNote {
  id: string;
  talent_id: string;
  admin_id: string;
  note: string;
  created_at: string;
}

interface Props {
  talent: TalentProfile;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

export default function TalentDetailsModal({ talent, onClose, onStatusChange }: Props) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [status, setStatus] = useState(talent.status);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    supabase
      .from('talent_admin_notes')
      .select('*')
      .eq('talent_id', talent.id)
      .order('created_at', { ascending: false })
      .then(({ data }: { data: InternalNote[] | null }) => {
        if (data) setNotes(data);
      });
  }, [talent.id]);

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('talent_profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', talent.id);
      if (error) throw error;
      setStatus(newStatus);
      onStatusChange?.(talent.id, newStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !user) return;
    try {
      const { data, error } = await supabase
        .from('talent_admin_notes')
        .insert({ talent_id: talent.id, admin_id: user.id, note: newNote.trim() })
        .select()
        .single();
      if (error) throw error;
      if (data) setNotes(prev => [data, ...prev]);
      setNewNote('');
    } catch (err) {
      console.error(err);
    }
  };

  const salaryDisplay = talent.salary_min && talent.salary_max
    ? `$${talent.salary_min.toLocaleString()} – $${talent.salary_max.toLocaleString()}`
    : talent.salary_min
    ? `From $${talent.salary_min.toLocaleString()}`
    : 'Not specified';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white rounded-[2rem] shadow-2xl flex flex-col md:flex-row"
      >
        {/* Left Panel */}
        <div className="w-full md:w-80 bg-gray-50 p-8 border-r border-gray-200 overflow-y-auto">
          <button onClick={onClose} className="md:hidden absolute top-4 right-4 p-2 text-gray-500"><X /></button>
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-20 w-20 rounded-full bg-sky-500 text-white flex items-center justify-center text-2xl font-bold mb-4 shadow-sm">
              {talent.full_name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{talent.full_name}</h2>
            <div className="mt-2 px-3 py-1 rounded bg-sky-100 text-sky-700 text-[10px] font-bold uppercase tracking-wider">{status}</div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Application Status</h3>
              <div className="grid grid-cols-1 gap-2">
                {['Under Review', 'Shortlisted', 'Matched'].map(s => (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(s)}
                    disabled={isUpdating || status === s}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                      status === s ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-sm' : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-white overflow-y-auto">
          <div className="border-b border-gray-100 flex items-center justify-between px-8 bg-white sticky top-0 z-10">
            <div className="flex gap-8">
              <button onClick={() => setActiveTab('profile')} className={`py-6 text-sm font-bold border-b-2 transition-all ${activeTab === 'profile' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Profile Details</button>
              <button onClick={() => setActiveTab('notes')} className={`py-6 text-sm font-bold border-b-2 transition-all ${activeTab === 'notes' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Internal Notes ({notes.length})</button>
            </div>
            <button onClick={onClose} className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-slate-400 hover:bg-gray-100 transition-all"><X size={16} /></button>
          </div>

          <div className="p-8">
            {activeTab === 'profile' ? (
              <div className="space-y-10">
                <section>
                  <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4 flex items-center gap-2"><User size={14} className="text-sky-500" /> Experience Summary</h3>
                  <p className="text-slate-600 text-sm leading-relaxed bg-gray-50/50 p-6 rounded-xl border border-gray-100">{talent.bio || 'No bio provided.'}</p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Core Skills & Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {talent.skills?.map(skill => (
                        <span key={skill} className="px-2 py-1 rounded bg-sky-50 text-sky-600 text-[10px] font-bold border border-sky-100">{skill}</span>
                      ))}
                      {talent.languages?.map(lang => (
                        <span key={lang} className="px-2 py-1 rounded bg-purple-50 text-purple-600 text-[10px] font-bold border border-purple-100">{lang}</span>
                      ))}
                    </div>
                  </section>
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Role Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {talent.role_interest?.map(role => (
                        <span key={role} className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold">{role}</span>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <InfoItem icon={<MapPin size={18} />} label="Location" value={[talent.city, talent.country].filter(Boolean).join(', ') || 'Not specified'} />
                  <InfoItem icon={<Briefcase size={18} />} label="Experience" value={`${talent.years_of_experience ?? 0} Years`} />
                  <InfoItem icon={<DollarSign size={18} />} label="Expectation" value={salaryDisplay} />
                  <InfoItem icon={<Calendar size={18} />} label="Availability" value={talent.availability_status || 'Unknown'} />
                  <InfoItem icon={<Briefcase size={18} />} label="Work Pref" value={talent.work_preference || 'Any'} />
                  <InfoItem icon={<GraduationCap size={18} />} label="Education" value={talent.education?.[0]?.summary || talent.education?.[0]?.degree || 'No info'} />
                </div>

                {talent.cv_url && (
                  <div className="pt-4 border-t border-gray-100">
                    <a href={talent.cv_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all">
                      View / Download CV
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <form onSubmit={handleAddNote} className="relative">
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add an internal note about this talent..."
                    className="w-full rounded-2xl bg-gray-50 border border-gray-100 p-6 pr-16 text-sm focus:bg-white focus:border-sky-500 focus:outline-none transition-all h-32 resize-none"
                  />
                  <button type="submit" className="absolute bottom-6 right-6 p-3 bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-100 hover:scale-105 active:scale-95 transition-all">
                    <Send size={18} />
                  </button>
                </form>

                <div className="space-y-4">
                  {notes.map(note => (
                    <div key={note.id} className="p-6 bg-white border border-gray-50 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-gray-100 text-[10px] flex items-center justify-center font-bold">A</div>
                          <span className="text-xs font-bold text-gray-600">Admin</span>
                        </div>
                        <span className="text-[10px] font-medium text-gray-400">{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{note.note}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <div className="text-center py-10 text-gray-400 italic">No notes yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
      <div className="h-8 w-8 rounded-lg bg-white text-sky-600 flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className="text-xs font-bold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}
