import { Link } from 'react-router-dom';
import { useAuth } from '@digihire/shared';
import { Settings } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.name ?? user?.email ?? '';

  const handleLogout = async () => {
    try { await signOut(); } catch (err) { console.error('Sign-out failed:', err); }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/logo-color.png" alt="DigiHire Logo" className="h-8 w-auto object-contain" />
          </Link>
          {user && (
            <div className="hidden md:flex items-center gap-6">
              <Link to="/brand" className="text-[13px] font-normal text-slate-500 hover:text-sky-600 transition-colors">Dashboard</Link>
              <Link to="/brand/campaigns" className="text-[13px] font-normal text-slate-500 hover:text-sky-600 transition-colors">Campaigns</Link>
              <Link to="/brand/recruitment" className="text-[13px] font-normal text-slate-500 hover:text-sky-600 transition-colors">Recruitment</Link>
              <Link to="/brand/setup" className="text-[13px] font-normal text-slate-500 hover:text-sky-600 transition-colors">Profile</Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-800">{displayName}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">brand</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                {displayName.charAt(0) || '?'}
              </div>
              <Link to="/brand/setup" aria-label="Company settings" className="p-2 text-slate-400 hover:text-sky-600 transition-all border border-transparent hover:border-sky-100 hover:bg-sky-50 rounded-lg">
                <Settings size={18} />
              </Link>
              <button onClick={handleLogout} className="text-[10px] font-normal uppercase tracking-widest text-slate-400 hover:text-red-500 ml-2">Logout</button>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <Link to="/login" className="text-xs font-normal text-slate-500 hover:text-slate-800 uppercase tracking-widest">Login</Link>
              <Link to="/signup" className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-normal text-white shadow-sm shadow-sky-200 hover:bg-sky-700 transition-all uppercase tracking-widest">Register Brand</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
