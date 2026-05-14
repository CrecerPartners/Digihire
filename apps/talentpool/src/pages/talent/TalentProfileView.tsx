import { TalentProfile } from '../../types';
import { MapPin, Briefcase, Linkedin, Globe, CheckCircle, TrendingUp } from 'lucide-react';

interface Props {
  profile: TalentProfile;
}

export default function TalentProfileView({ profile }: Props) {
  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="h-32 w-32 rounded-full bg-sky-50 flex items-center justify-center text-4xl font-bold text-sky-500 shadow-sm border-4 border-white shrink-0">
          {profile.full_name.charAt(0)}
        </div>
        <div className="flex-1 text-center md:text-left">
           <h1 className="text-3xl font-bold text-slate-900 mb-2">{profile.full_name}</h1>
           <p className="text-lg text-sky-600 font-medium mb-4">{profile.role_interests?.join(' • ') || 'Sales Professional'}</p>
           <div className="flex flex-wrap justify-center md:justify-start gap-5 text-xs text-slate-400 font-medium uppercase tracking-wider">
              <span className="flex items-center gap-2"><MapPin size={14} className="text-sky-500" /> {profile.city}, {profile.country}</span>
              <span className="flex items-center gap-2"><Briefcase size={14} className="text-sky-500" /> {profile.experience_years || 0} years exp</span>
              <span className="flex items-center gap-2 text-green-600 font-bold"><CheckCircle size={14} /> {profile.availability || 'Available'}</span>
           </div>
        </div>
        <div className="flex gap-2">
           {profile.linkedin_url && <SocialLink href={profile.linkedin_url} icon={<Linkedin size={18} />} />}
           {profile.portfolio_url && <SocialLink href={profile.portfolio_url} icon={<Globe size={18} />} />}
        </div>
      </div>

      {/* Bio & Skills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
           <section className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
              <h2 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-6 flex items-center gap-2">Professional Summary</h2>
              <p className="text-slate-600 leading-relaxed text-sm">{profile.bio || 'No bio provided.'}</p>
           </section>

           <section className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
              <h2 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-6 flex items-center gap-2">Work Experience</h2>
              <div className="space-y-6">
                <p className="text-xs text-slate-400 italic">Work history details will appear here as you add them.</p>
              </div>
           </section>
        </div>

        <div className="space-y-8">
           {/* Profile completion */}
           {(() => {
             const pct = profile.profile_completion ?? 0;
             const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400';
             const tip = pct < 80
               ? pct < 50
                 ? 'Add your bio, skills, and work history to boost your profile.'
                 : 'Add your CV and LinkedIn to reach 80% and get noticed by brands.'
               : 'Great profile! Brands can now discover you.';
             return (
               <section className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                 <div className="flex items-center justify-between mb-3">
                   <h2 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2"><TrendingUp size={13} className="text-sky-500" /> Profile Completion</h2>
                   <span className="text-lg font-bold text-slate-800">{pct}%</span>
                 </div>
                 <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
                   <div className={`h-full rounded-full transition-all ${color} w-[${pct}%]`} />
                 </div>
                 <p className="text-xs text-slate-500">{tip}</p>
               </section>
             );
           })()}

           <section className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
              <h2 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-6">Preferences</h2>
              <div className="space-y-5">
                 <DetailItem label="Job Preference" value={profile.job_type_preference?.join(', ') || 'Any'} />
                 <DetailItem label="Work Mode" value={profile.work_preference} />
                 <DetailItem label="Salary Expectations" value={profile.salary_min ? String(profile.salary_min) : 'Negotiable'} />
              </div>
           </section>

           <section className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
              <h2 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-6">Top Skills</h2>
              <div className="flex flex-wrap gap-2">
                 {profile.skills?.map(skill => (
                   <span key={skill} className="px-2 py-1 rounded bg-sky-50 text-sky-600 text-[10px] font-bold border border-sky-100">{skill}</span>
                 ))}
                 {!profile.skills?.length && <p className="text-[10px] text-slate-400">No skills listed.</p>}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}

function SocialLink({ href, icon }: any) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-white hover:shadow-md transition-all border border-gray-100">
      {icon}
    </a>
  );
}

function DetailItem({ label, value }: any) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{label}</span>
      <p className="text-sm font-bold text-slate-800 capitalize">{value || 'Not set'}</p>
    </div>
  );
}
