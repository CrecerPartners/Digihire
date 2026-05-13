import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TalentCourse } from '../../types';
import { useTalentCourse } from '../../hooks/useTalentCourses';
import { useTalentEnrollments } from '../../hooks/useTalentEnrollments';
import { motion } from 'motion/react';
import { Play, CheckCircle, Lock, GraduationCap, ArrowLeft, Download, FileText, Check } from 'lucide-react';

function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { course, loading } = useTalentCourse(id);
  const { enrollments, enroll, updateProgress } = useTalentEnrollments();
  const [activeModule, setActiveModule] = useState(0);

  const isEnrolled = enrollments.some(e => e.course_id === id);
  const enrollment = enrollments.find(e => e.course_id === id) ?? null;

  const handleEnroll = async () => {
    try {
      await enroll(id!);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to enroll';
      alert(message);
    }
  };

  const handleMarkComplete = async () => {
    if (!enrollment || !course) return;
    const completed = new Set(enrollment.completed_modules || []);
    completed.add(activeModule);
    const newCompleted = Array.from(completed);
    const total = course.modules?.length || 1;
    const progress = Math.round((newCompleted.length / total) * 100);
    
    await updateProgress(course.id, newCompleted, progress);
    
    if (activeModule < total - 1) {
      setActiveModule(activeModule + 1);
    }
  };

  const currentModule = course?.modules?.[activeModule];
  const videoId = currentModule?.youtube_url ? extractYouTubeId(currentModule.youtube_url) : null;

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading course...</div>;
  if (!course) return <div className="p-20 text-center">Course not found</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-slate-900 text-white py-12 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <button onClick={() => navigate('/academy')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft size={14} /> Back to Academy
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
             <div className="lg:col-span-2">
                <h1 className="text-3xl md:text-5xl font-bold mb-6 text-white">{course.title}</h1>
                <p className="text-lg text-slate-300 mb-8 max-w-2xl leading-relaxed">{course.description}</p>
                <div className="flex flex-wrap gap-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-sky-400 font-bold mb-1">Category</span>
                    <span className="text-sm font-bold text-white">{course.category}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-sky-400 font-bold mb-1">Total Duration</span>
                    <span className="text-sm font-bold text-white">4.5 Hours</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-sky-400 font-bold mb-1">Certificate</span>
                    <span className="text-sm font-bold text-white">{course.has_certificate ? 'Industry Recognized' : 'Professional Skills'}</span>
                  </div>
                </div>
             </div>
             <div className="lg:col-span-1">
                <div className="rounded-2xl bg-white p-2 shadow-2xl shadow-sky-900/40 text-slate-900">
                  <div className="aspect-video w-full rounded-xl bg-gray-200 overflow-hidden mb-4">
                     <img src={course.thumbnail_url} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="p-4">
                    {isEnrolled ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                           <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Progress</span>
                           <span className="text-2xl font-black text-sky-600">{enrollment?.progress ?? 0}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                           <div className="h-full bg-sky-600 transition-all duration-700 ease-out" style={{ width: `${enrollment?.progress ?? 0}%` }} />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleEnroll}
                        className="w-full rounded-xl bg-sky-600 py-4 text-sm font-bold text-white shadow-lg shadow-sky-200 hover:bg-sky-700 hover:-translate-y-0.5 transition-all"
                      >
                        Start Learning Now
                      </button>
                    )}
                  </div>
                </div>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
               <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
                    <h2 className="text-xl font-bold text-slate-900">Module Content</h2>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{(course.modules ?? []).length} Modules Total</span>
                  </div>
                  <div className="space-y-2">
                    {(course.modules ?? []).map((mod, idx) => (
                      <ModuleItem
                        key={idx}
                        title={mod.title}
                        isLocked={!isEnrolled}
                        isCompleted={enrollment?.completed_modules?.includes(idx) ?? false}
                        isActive={activeModule === idx}
                        onClick={() => {
                          if (!isEnrolled) return;
                          setActiveModule(idx);
                        }}
                      />
                    ))}
                  </div>
               </div>

               {isEnrolled && currentModule && (
                 <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden mt-8">
                   {videoId ? (
                     <div className="aspect-video w-full bg-black">
                       <iframe
                         src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                         className="w-full h-full"
                         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                         allowFullScreen
                       />
                     </div>
                   ) : (
                     <div className="aspect-video w-full bg-gray-100 flex items-center justify-center text-gray-400">
                       No video available for this module
                     </div>
                   )}
                   <div className="p-8">
                     <h2 className="text-2xl font-bold text-slate-900 mb-4">{currentModule.title}</h2>
                     {currentModule.content && (
                       <p className="text-slate-600 leading-relaxed mb-8">{currentModule.content}</p>
                     )}
                     
                     <div className="flex justify-end pt-6 border-t border-gray-100">
                       <button
                         onClick={handleMarkComplete}
                         disabled={enrollment?.completed_modules?.includes(activeModule)}
                         className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                           enrollment?.completed_modules?.includes(activeModule)
                             ? 'bg-green-50 text-green-600 cursor-default'
                             : 'bg-sky-600 text-white hover:bg-sky-700 shadow-lg shadow-sky-200'
                         }`}
                       >
                         {enrollment?.completed_modules?.includes(activeModule) ? (
                           <>
                             <Check size={16} /> Completed
                           </>
                         ) : (
                           'Mark as Complete'
                         )}
                       </button>
                     </div>
                   </div>
                 </div>
               )}
            </div>

            <div className="lg:col-span-1 space-y-6">
               <div className="rounded-3xl bg-white border border-gray-100 p-8 shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Resources</h3>
                  <div className="space-y-4">
                    <ResourceLink title="Sales Playbook PDF" size="2.4 MB" />
                    <ResourceLink title="Outreach Templates" size="1.1 MB" />
                    <ResourceLink title="Cold Call Scripts" size="800 KB" />
                  </div>
               </div>

               <div className="rounded-3xl bg-blue-600 p-8 text-white shadow-xl">
                  <GraduationCap size={32} className="mb-4" />
                  <h3 className="text-xl font-bold mb-2">Get Your Certificate</h3>
                  <p className="text-sm text-blue-100 mb-6">Complete all modules to earn your Digihire Sales Specialist certification.</p>
                  <button className="w-full py-3 rounded-full bg-white text-blue-600 text-sm font-bold opacity-50 cursor-not-allowed">
                    {enrollment?.progress === 100 ? 'Claim Certificate' : 'Locked'}
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function ModuleItem({ title, isLocked, isCompleted, isActive, onClick }: {
  title: string;
  isLocked: boolean;
  isCompleted: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border ${
        isActive ? 'bg-sky-50 border-sky-200' : 'bg-white border-transparent hover:bg-gray-50'
      } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-center gap-4">
        {isCompleted ? (
           <div className="h-7 w-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
             <CheckCircle size={14} />
           </div>
        ) : isLocked ? (
           <div className="h-7 w-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
             <Lock size={14} />
           </div>
        ) : (
           <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[10px] ${isActive ? 'bg-sky-600 text-white' : 'bg-gray-100 text-slate-500'}`}>
             <Play size={12} fill={isActive ? 'white' : 'none'} />
           </div>
        )}
        <span className={`text-sm font-bold text-left transition-colors ${isActive ? 'text-sky-700' : 'text-slate-700'}`}>{title}</span>
      </div>
    </button>
  );
}

function ResourceLink({ title, size }: { title: string; size: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-transparent hover:border-gray-200 transition-all cursor-pointer">
      <div className="flex items-center gap-3">
        <FileText size={18} className="text-[#2563eb]" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#1a1a1a]">{title}</span>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">{size}</span>
        </div>
      </div>
      <Download size={16} className="text-gray-400" />
    </div>
  );
}
