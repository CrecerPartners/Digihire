import { useState } from 'react';
import { TalentCourse } from '../../types';
import { useTalentCourses } from '../../hooks/useTalentCourses';
import { useTalentWebinars } from '../../hooks/useTalentWebinars';
import { motion } from 'motion/react';
import { GraduationCap, Play, Clock, Star, BookOpen, Search, ArrowRight, Calendar, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AcademyPage() {
  const { courses, loading } = useTalentCourses();
  const { webinars: upcomingWebinars } = useTalentWebinars();
  const [filter, setFilter] = useState('all');

  const categories = ['all', 'sales process', 'saas sales', 'b2b strategy', 'soft skills'];

  const filteredCourses = filter === 'all'
    ? courses
    : courses.filter(c => c.category?.toLowerCase() === filter.toLowerCase());

  return (
    <div className="bg-[#fafafa] min-h-screen">
      {/* Academy Hero */}
      <div className="bg-slate-900 py-20 text-white relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-600 text-xs font-bold uppercase tracking-widest mb-6">
              <GraduationCap size={14} /> Digihire Academy
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">Master the art of <span className="text-sky-400">Sales Excellence</span>.</h1>
            <p className="text-lg text-slate-300 mb-8 max-w-lg">Premium learning tracks designed to turn you into a top-performing sales professional at elite brands.</p>
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={18} />
              </div>
              <input type="text" placeholder="Search for courses, tracks, or skills..." className="w-full rounded-xl bg-white/10 border border-white/20 py-4 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm" />
            </div>
          </motion.div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-12">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                filter === cat ? 'bg-sky-600 text-white shadow-lg shadow-sky-200' : 'bg-white text-slate-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.length > 0 ? filteredCourses.map(course => (
              <CourseCard key={course.id || course.title} course={course} />
            )) : (
              <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-3xl border border-dashed border-gray-200">
                <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No courses found matching your filter.</p>
              </div>
            )}
          </div>
        )}

        {/* Upcoming Sessions Banner */}
        {upcomingWebinars.length > 0 && (
          <div className="mt-20 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-2">
                    <Wifi size={12} /> Live Sessions
                  </div>
                  <h2 className="text-2xl font-bold">Upcoming Webinars & Training</h2>
                </div>
                <Link
                  to="/academy/timetable"
                  className="flex items-center gap-2 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors"
                >
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingWebinars.slice(0, 3).map(w => (
                  <Link key={w.id} to="/academy/timetable" className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <div
                      className="h-1 w-12 rounded-full mb-4"
                      style={{ background: w.cover_color }}
                    />
                    <h3 className="font-bold text-white mb-3 line-clamp-2 group-hover:text-violet-300 transition-colors">{w.title}</h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Calendar size={12} />
                        {new Date(w.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock size={12} />
                        {new Date(w.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })} · {w.duration_minutes} min
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sales Tracks */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">Sales Role Tracks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <TrackCard title="SDR / BDR" count={8} color="bg-orange-50 text-orange-600" />
            <TrackCard title="Account Executive" count={12} color="bg-blue-50 text-blue-600" />
            <TrackCard title="SaaS Sales Pro" count={15} color="bg-purple-50 text-purple-600" />
            <TrackCard title="Sales Management" count={6} color="bg-green-50 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: TalentCourse }) {
  return (
    <motion.div whileHover={{ y: -5 }} className="group rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
      <Link to={`/academy/course/${course.id}`} className="block">
        <div className="aspect-video w-full bg-gray-100 relative overflow-hidden">
          <img src={course.thumbnail_url || 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop'} alt={course.title} className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-500" />
          <div className="absolute top-4 left-4">
             <span className="px-2 py-1 rounded bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest text-slate-900 shadow-sm">
               {course.category}
             </span>
          </div>
          <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="h-12 w-12 rounded-full bg-white text-sky-600 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-all">
              <Play fill="currentColor" size={20} />
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Play size={12} /> {(course.modules ?? []).length} Modules</span>
            <span className="h-1 w-1 rounded-full bg-gray-300"></span>
            <span className="flex items-center gap-1.5"><Clock size={12} /> 4.5 hrs</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-sky-600 transition-colors">{course.title}</h3>
          <p className="text-xs text-slate-500 line-clamp-2 mb-6 leading-relaxed">{course.description}</p>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={14} fill="currentColor" />
              <span className="text-xs font-bold text-slate-800">4.9</span>
            </div>
            <div className="text-[10px] font-bold text-sky-600 flex items-center gap-1 uppercase tracking-widest">
              enroll now <ArrowRight size={12} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function TrackCard({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <div className={`p-6 rounded-2xl ${color} flex flex-col justify-between h-40 border border-white shadow-sm`}>
      <h3 className="text-xl font-bold leading-tight">{title}</h3>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase">{count} Courses</span>
        <div className="h-8 w-8 rounded-full bg-white/50 flex items-center justify-center">
          <ArrowRight size={16} />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 p-6 space-y-4">
      <div className="aspect-video bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-6 w-3/4 bg-gray-100 rounded animate-pulse" />
      <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}
