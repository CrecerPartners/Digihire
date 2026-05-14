import React, { useState } from 'react';
import { useTalentWebinars, useWebinarRegistrations, TalentWebinar } from '../../hooks/useTalentWebinars';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Users, Video, X, CheckCircle, ChevronRight, Wifi, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function isUpcoming(iso: string) {
  return new Date(iso) > new Date();
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h away`;
  if (hours > 0) return `${hours}h away`;
  return 'Starting soon';
}

export default function TalentTimetable() {
  const navigate = useNavigate();
  const { webinars, loading } = useTalentWebinars();
  const { registrations, register, unregister } = useWebinarRegistrations();
  const [selected, setSelected] = useState<TalentWebinar | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'registered'>('all');

  const registeredIds = new Set(registrations.map(r => r.webinar_id));

  const filtered = filter === 'registered'
    ? webinars.filter(w => registeredIds.has(w.id))
    : webinars;

  const handleRegister = async (w: TalentWebinar) => {
    setBusy(w.id);
    if (registeredIds.has(w.id)) {
      await unregister(w.id);
    } else {
      await register(w.id);
    }
    setBusy(null);
  };

  return (
    <div className="bg-[#fafafa] min-h-screen">
      {/* Hero */}
      <div className="bg-slate-900 py-16 text-white relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft size={16} /> Back
          </button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600 text-xs font-bold uppercase tracking-widest mb-6">
              <Wifi size={14} /> Live Sessions
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Upcoming <span className="text-violet-400">Webinars</span> & Training
            </h1>
            <p className="text-slate-300 text-lg max-w-lg">
              Join live sessions hosted by industry experts. Learn, ask questions, and grow in real time.
            </p>
          </motion.div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-violet-500/10 to-transparent pointer-events-none" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter Toggle */}
        <div className="flex items-center gap-3 mb-10">
          {(['all', 'registered'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                filter === f
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                  : 'bg-white text-slate-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {f === 'all' ? 'All Sessions' : `My Registrations (${registeredIds.size})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-6 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">
              {filter === 'registered' ? "You haven't registered for any sessions yet." : "No upcoming sessions scheduled."}
            </h2>
            <p className="text-slate-500">Check back soon — sessions are added regularly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(webinar => {
              const isRegistered = registeredIds.has(webinar.id);
              return (
                <motion.div
                  key={webinar.id}
                  whileHover={{ y: -4 }}
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                  {/* Colour header */}
                  <div
                    className="h-2 w-full"
                    style={{ background: webinar.cover_color }}
                  />

                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded">
                        {webinar.category}
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                        {daysUntil(webinar.scheduled_at)}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors">
                      {webinar.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-5 leading-relaxed flex-1">
                      {webinar.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar size={14} className="text-violet-400 flex-shrink-0" />
                        <span>{formatDate(webinar.scheduled_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock size={14} className="text-violet-400 flex-shrink-0" />
                        <span>{formatTime(webinar.scheduled_at)} · {webinar.duration_minutes} min</span>
                      </div>
                      {webinar.host_name && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Users size={14} className="text-violet-400 flex-shrink-0" />
                          <span>{webinar.host_name}{webinar.host_title ? ` · ${webinar.host_title}` : ''}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleRegister(webinar)}
                        disabled={busy === webinar.id}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isRegistered
                            ? 'bg-green-50 border border-green-200 text-green-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                            : 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700'
                        }`}
                      >
                        {busy === webinar.id ? 'Saving...' : isRegistered ? (
                          <><CheckCircle size={14} /> Registered</>
                        ) : (
                          'Register'
                        )}
                      </button>
                      <button
                        onClick={() => setSelected(webinar)}
                        className="p-2.5 rounded-xl border border-gray-200 text-slate-400 hover:bg-gray-50 hover:text-slate-700 transition-all"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <WebinarModal
            webinar={selected}
            isRegistered={registeredIds.has(selected.id)}
            busy={busy === selected.id}
            onRegister={() => handleRegister(selected)}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function WebinarModal({ webinar, isRegistered, busy, onRegister, onClose }: {
  webinar: TalentWebinar;
  isRegistered: boolean;
  busy: boolean;
  onRegister: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Colour strip */}
        <div className="h-2 w-full" style={{ background: webinar.cover_color }} />
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 bg-violet-50 border border-violet-100 px-3 py-1 rounded-full">
              {webinar.category}
            </span>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-gray-100 transition-all">
              <X size={18} />
            </button>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">{webinar.title}</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">{webinar.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <InfoRow icon={<Calendar size={16} />} label="Date" value={formatDate(webinar.scheduled_at)} />
            <InfoRow icon={<Clock size={16} />} label="Time" value={formatTime(webinar.scheduled_at)} />
            <InfoRow icon={<Clock size={16} />} label="Duration" value={`${webinar.duration_minutes} minutes`} />
            {webinar.host_name && (
              <InfoRow icon={<Users size={16} />} label="Host" value={`${webinar.host_name}${webinar.host_title ? ` — ${webinar.host_title}` : ''}`} />
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onRegister}
              disabled={busy}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${
                isRegistered
                  ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
                  : 'bg-violet-600 text-white shadow-lg shadow-violet-200 hover:bg-violet-700'
              }`}
            >
              {busy ? 'Saving...' : isRegistered ? 'Cancel Registration' : 'Reserve Your Spot'}
            </button>

            {isRegistered && webinar.meeting_url && (
              <a
                href={webinar.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all"
              >
                <Video size={16} /> Join
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div className="text-violet-500 mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className="text-xs font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
