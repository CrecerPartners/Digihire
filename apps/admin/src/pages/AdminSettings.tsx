import { useState, useEffect } from 'react';
import { supabase as _supabase, useAuth } from '@digihire/shared';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  User, Lock, Shield, Bell, Palette, AlertTriangle,
  Save, Trash2, UserPlus, LogOut, Sun, Moon, Monitor,
  ToggleLeft, ToggleRight,
} from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

const TABS = [
  { id: 'account',   label: 'My Account',        icon: User },
  { id: 'team',      label: 'Admin Team',         icon: Shield },
  { id: 'platform',  label: 'Platform Controls',  icon: ToggleRight },
  { id: 'notifs',    label: 'Notifications',      icon: Bell },
  { id: 'appearance',label: 'Appearance',         icon: Palette },
  { id: 'danger',    label: 'Danger Zone',        icon: AlertTriangle },
] as const;
type TabId = typeof TABS[number]['id'];

const NOTIF_KEY = 'admin_notification_prefs';
const DEFAULT_NOTIFS = {
  new_brand_signup: true,
  new_talent_signup: true,
  recruitment_request: true,
  activation_request: true,
  campaign_launched: true,
  gig_application: false,
};

interface AdminRow {
  user_id: string;
  email: string;
}

interface PlatformConfig {
  talent_signups_open: boolean;
  brand_signups_open: boolean;
  voltsquad_open: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
}

const DEFAULT_PLATFORM: PlatformConfig = {
  talent_signups_open: true,
  brand_signups_open: true,
  voltsquad_open: true,
  maintenance_mode: false,
  maintenance_message: '',
};

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-primary' : 'bg-muted'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function FieldRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/50 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ── My Account ── */
function AccountTab() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ newPw: '', confirmPw: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  const saveName = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { name } });
    if (error) toast.error(error.message); else toast.success('Name updated');
    setSaving(false);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPw.length < 8) return setPwError('Password must be at least 8 characters');
    if (pwForm.newPw !== pwForm.confirmPw) return setPwError('Passwords do not match');
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    if (error) { setPwError(error.message); } else { toast.success('Password updated'); setPwForm({ newPw: '', confirmPw: '' }); }
    setPwSaving(false);
  };

  const initials = (name || user?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="space-y-5">
      <SectionCard title="Profile" description="Your admin account display name.">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xl font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Display Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <input
            value={user?.email ?? ''}
            readOnly
            className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
          />
        </div>
        <button
          onClick={saveName}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
        >
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Name'}
        </button>
      </SectionCard>

      <SectionCard title="Change Password" description="Choose a strong password of at least 8 characters.">
        <form onSubmit={changePassword} className="space-y-3">
          {pwError && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{pwError}</p>}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input type="password" required minLength={8} value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                placeholder="••••••••" className="w-full rounded-lg border border-border bg-secondary pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input type="password" required minLength={8} value={pwForm.confirmPw} onChange={e => setPwForm(p => ({ ...p, confirmPw: e.target.value }))}
                placeholder="••••••••" className="w-full rounded-lg border border-border bg-secondary pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
          <button type="submit" disabled={pwSaving}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
            <Lock className="h-4 w-4" /> {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}

/* ── Admin Team ── */
function TeamTab() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [granting, setGranting] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (error) { toast.error('Failed to load admin team'); setLoading(false); return; }

    const userIds: string[] = (roles ?? []).map((r: { user_id: string }) => r.user_id);
    let emailMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);
      (profiles ?? []).forEach((p: { id: string; email: string }) => { emailMap[p.id] = p.email; });
    }

    setAdmins((roles ?? []).map((r: { user_id: string }) => ({
      user_id: r.user_id,
      email: emailMap[r.user_id] ?? r.user_id,
    })));
    setLoading(false);
  };

  const grantAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGranting(true);
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single();
    if (pErr || !profile) { toast.error('No user found with that email'); setGranting(false); return; }
    if (admins.some(a => a.user_id === profile.id)) { toast.error('User is already an admin'); setGranting(false); return; }
    const { error } = await supabase.from('user_roles').insert({ user_id: profile.id, role: 'admin' });
    if (error) { toast.error(error.message); } else { toast.success('Admin access granted'); setEmail(''); fetchAdmins(); }
    setGranting(false);
  };

  const revokeAdmin = async (userId: string) => {
    setRevoking(userId);
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
    if (error) { toast.error(error.message); } else { toast.success('Admin access revoked'); fetchAdmins(); }
    setRevoking(null);
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Current Admins" description="All users with admin access to this portal.">
        {loading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
        ) : admins.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No admins found.</p>
        ) : (
          <div className="space-y-2">
            {admins.map(a => (
              <div key={a.user_id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.email}</p>
                </div>
                <button
                  onClick={() => revokeAdmin(a.user_id)}
                  disabled={revoking === a.user_id}
                  className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-3 py-1.5 text-xs font-semibold hover:bg-destructive/20 disabled:opacity-50 transition-all shrink-0"
                >
                  <Trash2 className="h-3 w-3" /> {revoking === a.user_id ? 'Revoking…' : 'Revoke'}
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Grant Admin Access" description="Enter the email of an existing Digihire user to make them an admin.">
        <form onSubmit={grantAdmin} className="flex gap-3">
          <div className="relative flex-1">
            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full rounded-lg border border-border bg-secondary pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button type="submit" disabled={granting}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shrink-0">
            <UserPlus className="h-4 w-4" /> {granting ? 'Granting…' : 'Grant Access'}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}

/* ── Platform Controls ── */
function PlatformTab() {
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_PLATFORM);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('platform_config').select('key, value');
      if (error) { setTableError(true); setLoading(false); return; }
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: { key: string; value: string }) => { map[r.key] = r.value; });
      setConfig({
        talent_signups_open: map.talent_signups_open !== 'false',
        brand_signups_open: map.brand_signups_open !== 'false',
        voltsquad_open: map.voltsquad_open !== 'false',
        maintenance_mode: map.maintenance_mode === 'true',
        maintenance_message: map.maintenance_message ?? '',
      });
      setLoading(false);
    })();
  }, []);

  const upsert = async (key: keyof PlatformConfig, value: boolean | string) => {
    setSavingKey(key);
    const { error } = await supabase.from('platform_config').upsert({ key, value: String(value) }, { onConflict: 'key' });
    if (error) toast.error(error.message);
    setSavingKey(null);
  };

  const toggleBool = (key: keyof PlatformConfig, value: boolean) => {
    setConfig(p => ({ ...p, [key]: value }));
    upsert(key, value);
  };

  const saveMessage = async () => {
    await upsert('maintenance_message', config.maintenance_message);
    toast.success('Message saved');
  };

  if (tableError) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-6 text-sm text-yellow-800 dark:text-yellow-300 space-y-2">
        <p className="font-semibold">platform_config table not found</p>
        <p className="text-xs">Create this table in Supabase: <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">platform_config (key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMPTZ DEFAULT now())</code></p>
      </div>
    );
  }

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>;

  const boolControls: { key: keyof PlatformConfig; label: string; desc: string }[] = [
    { key: 'talent_signups_open', label: 'Talent Signups', desc: 'Allow new talent to create accounts' },
    { key: 'brand_signups_open', label: 'Brand Signups', desc: 'Allow new brands to create accounts' },
    { key: 'voltsquad_open', label: 'VoltSquad Open', desc: 'Allow new sellers to join VoltSquad' },
    { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Show a maintenance banner across all apps' },
  ];

  return (
    <div className="space-y-5">
      <SectionCard title="Feature Flags" description="Instantly toggle platform-wide features. Changes take effect immediately.">
        {boolControls.map(({ key, label, desc }) => (
          <FieldRow key={key} label={label} description={desc}>
            <div className="flex items-center gap-2">
              {savingKey === key && <span className="text-xs text-muted-foreground">Saving…</span>}
              <Toggle enabled={config[key] as boolean} onChange={v => toggleBool(key, v)} />
            </div>
          </FieldRow>
        ))}
      </SectionCard>

      <SectionCard title="Maintenance Message" description="Text shown in the maintenance banner when maintenance mode is on.">
        <textarea
          value={config.maintenance_message}
          onChange={e => setConfig(p => ({ ...p, maintenance_message: e.target.value }))}
          rows={3}
          placeholder="We're currently performing scheduled maintenance. Check back soon."
          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
        />
        <button onClick={saveMessage}
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all">
          <Save className="h-4 w-4" /> Save Message
        </button>
      </SectionCard>
    </div>
  );
}

/* ── Notifications ── */
function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    try { return { ...DEFAULT_NOTIFS, ...JSON.parse(localStorage.getItem(NOTIF_KEY) ?? '{}') }; }
    catch { return DEFAULT_NOTIFS; }
  });

  const toggle = (key: string, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
  };

  const NOTIF_LABELS: { key: string; label: string; desc: string }[] = [
    { key: 'new_brand_signup', label: 'New Brand Sign-Up', desc: 'Alert when a brand creates an account' },
    { key: 'new_talent_signup', label: 'New Talent Sign-Up', desc: 'Alert when a talent joins the platform' },
    { key: 'recruitment_request', label: 'Recruitment Requests', desc: 'Alert when a brand submits a hiring request' },
    { key: 'activation_request', label: 'Activation Requests', desc: 'Alert when a brand requests a field activation' },
    { key: 'campaign_launched', label: 'Campaign Launched', desc: 'Alert when a VoltSquad campaign goes live' },
    { key: 'gig_application', label: 'Gig Applications', desc: 'Alert when talent applies for a gig' },
  ];

  return (
    <SectionCard title="Notification Preferences" description="Choose which events trigger browser alerts. Stored locally on this device.">
      {NOTIF_LABELS.map(({ key, label, desc }) => (
        <FieldRow key={key} label={label} description={desc}>
          <Toggle enabled={!!prefs[key]} onChange={v => toggle(key, v)} />
        </FieldRow>
      ))}
    </SectionCard>
  );
}

/* ── Appearance ── */
function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-5">
      <SectionCard title="Theme" description="Choose your preferred colour scheme for the admin portal.">
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={`flex flex-col items-center gap-2.5 rounded-xl border p-4 text-sm font-medium transition-all ${theme === id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/40'}`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Environment">
        <FieldRow label="Mode">
          <span className="text-xs font-mono bg-secondary border border-border px-2 py-1 rounded-md text-muted-foreground">
            {import.meta.env.MODE}
          </span>
        </FieldRow>
        <FieldRow label="Version">
          <span className="text-xs font-mono bg-secondary border border-border px-2 py-1 rounded-md text-muted-foreground">
            v1.0.0
          </span>
        </FieldRow>
      </SectionCard>
    </div>
  );
}

/* ── Danger Zone ── */
function DangerTab() {
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const signOutAll = async () => {
    setSigningOut(true);
    await supabase.auth.signOut({ scope: 'global' });
    await signOut();
  };

  const clearCache = () => {
    const authKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    const authVal = authKey ? localStorage.getItem(authKey) : null;
    localStorage.clear();
    if (authKey && authVal) localStorage.setItem(authKey, authVal);
    toast.success('Cache cleared');
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
        <p className="text-xs text-muted-foreground">These actions are irreversible. Proceed with care.</p>

        <div className="space-y-3 pt-1">
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Sign out of all sessions</p>
              <p className="text-xs text-muted-foreground mt-0.5">Immediately invalidates all active admin sessions across all devices.</p>
            </div>
            <button
              onClick={signOutAll}
              disabled={signingOut}
              className="flex items-center gap-2 rounded-lg bg-destructive text-destructive-foreground px-4 py-2 text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" /> {signingOut ? 'Signing out…' : 'Sign Out All'}
            </button>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Clear cached data</p>
              <p className="text-xs text-muted-foreground mt-0.5">Clears all locally cached data (filters, preferences, etc.) and reloads the portal.</p>
            </div>
            <button
              onClick={clearCache}
              className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive px-4 py-2 text-xs font-bold hover:bg-destructive/20 transition-all shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<TabId>('account');
  const ActiveIcon = TABS.find(t => t.id === activeTab)?.icon ?? User;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ActiveIcon className="h-6 w-6 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, team, platform controls, and preferences.</p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'account'    && <AccountTab />}
        {activeTab === 'team'       && <TeamTab />}
        {activeTab === 'platform'   && <PlatformTab />}
        {activeTab === 'notifs'     && <NotificationsTab />}
        {activeTab === 'appearance' && <AppearanceTab />}
        {activeTab === 'danger'     && <DangerTab />}
      </div>
    </div>
  );
}
