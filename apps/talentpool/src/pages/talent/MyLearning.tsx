import { useNavigate } from 'react-router-dom';
import { useTalentEnrollments } from '../../hooks/useTalentEnrollments';
import { useTalentCourses } from '../../hooks/useTalentCourses';
import { BookOpen, PlayCircle, Trophy, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

export default function MyLearning() {
  const navigate = useNavigate();
  const { enrollments, loading: enrollLoading } = useTalentEnrollments();
  const { courses, loading: coursesLoading } = useTalentCourses();

  if (enrollLoading || coursesLoading) {
    return <div className="p-8 text-slate-500">Loading your learning dashboard...</div>;
  }

  const enrolledCourses = enrollments.map(e => ({
    enrollment: e,
    course: courses.find(c => c.id === e.course_id)
  })).filter(e => e.course);

  const completedCount = enrolledCourses.filter(e => e.enrollment.progress === 100).length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Learning</h1>
          <p className="text-slate-500 mt-2">Track your progress and continue where you left off.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-sky-50 px-4 py-2 rounded-lg border border-sky-100 flex items-center gap-3 text-sky-700">
            <BookOpen size={20} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Enrolled</p>
              <p className="text-lg font-black leading-none">{enrolledCourses.length}</p>
            </div>
          </div>
          <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100 flex items-center gap-3 text-green-700">
            <Trophy size={20} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Completed</p>
              <p className="text-lg font-black leading-none">{completedCount}</p>
            </div>
          </div>
        </div>
      </header>

      {enrolledCourses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <GraduationCap size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">You haven't enrolled in any courses yet</h2>
          <p className="text-slate-500 mb-6">Browse the academy and start building your sales skills.</p>
          <button 
            onClick={() => navigate('/academy')}
            className="px-6 py-3 bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-200 hover:bg-sky-700 transition-all"
          >
            Explore Course Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map(({ course, enrollment }) => {
            if (!course) return null;
            return (
              <motion.div
                key={course.id}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer"
                onClick={() => navigate(`/academy/course/${course.id}`)}
              >
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <GraduationCap size={32} className="text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle size={48} className="text-white" />
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">{course.category}</span>
                    <span className="text-xs font-bold text-slate-400">
                      {(enrollment.completed_modules || []).length} / {(course.modules || []).length} Modules
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-4 line-clamp-2">{course.title}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">Progress</span>
                      <span className={enrollment.progress === 100 ? 'text-green-600' : 'text-sky-600'}>
                        {enrollment.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${enrollment.progress === 100 ? 'bg-green-500' : 'bg-sky-500'}`}
                        style={{ width: `${enrollment.progress}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
