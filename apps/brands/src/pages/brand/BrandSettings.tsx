import { useState, useEffect } from 'react';
import { supabase as _supabase, useAuth } from '@digihire/shared';
import { toast } from 'sonner';
import { User, Bell } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'notifs',  label: 'Notifications', icon: Bell },
];

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

const NOTIF_DEFAULTS = {
  campaign_updates: true,
  recruitment_status: true,
  activation_status: true,
};

type NotifPrefs = typeof NOTIF_DEFAULTS;

function AccountTab() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const handleSaveName = async () => {
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { name } });
    setSavingName(false);
    if (error) toast.error(error.message);
    else toast.success('Name updated');
  };

  const handleSavePassword = async () => {
    setPwError('');
    if (!newPw) return;
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters'); return; }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSavingPw(false);
    if (error) { setPwError(error.message); } else {
      toast.success('Password updated');
      setNewPw('');
      setConfirmPw('');
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Profile" description="Your contact details for this brand account.">
        <FieldRow label="Contact Name">
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </FieldRow>
        <FieldRow label="Email">
          <input
            className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
            value={user?.email ?? ''}
            readOnly
          />
        </FieldRow>
        <button
          onClick={handleSaveName}
          disabled={savingName}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {savingName ? 'Saving…' : 'Save Changes'}
        </button>
      </SectionCard>

      <SectionCard title="Change Password" description="Update your account password.">
        <FieldRow label="New Password">
          <input
            type="password"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            placeholder="Minimum 8 characters"
          />
        </FieldRow>
        <FieldRow label="Confirm Password">
          <input
            type="password"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
          />
        </FieldRow>
        {pwError && <p className="text-sm text-destructive">{pwError}</p>}
        <button
          onClick={handleSavePassword}
          disabled={savingPw || !newPw}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {savingPw ? 'Updating…' : 'Update Password'}
        </button>
      </SectionCard>
    </div>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotifPrefs>(NOTIF_DEFAULTS);

  useEffect(() => {
    const stored = localStorage.getItem('brand_notification_prefs');
    if (stored) {
      try { setPrefs({ ...NOTIF_DEFAULTS, ...JSON.parse(stored) }); } catch { /* ignore */ }
    }
  }, []);

  const toggle = (key: keyof NotifPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem('brand_notification_prefs', JSON.stringify(updated));
  };

  const items: { key: keyof NotifPrefs; label: string; description: string }[] = [
    { key: 'campaign_updates', label: 'Campaign Update Emails', description: 'Status changes and activity on your campaigns' },
    { key: 'recruitment_status', label: 'Recruitment Status Emails', description: 'Updates when recruitment requests change status' },
    { key: 'activation_status', label: 'Activation Status Emails', description: 'Updates on your activation requests' },
  ];

  return (
    <SectionCard title="Email Notifications" description="Choose which emails you receive. Changes save instantly.">
      <div className="divide-y divide-border">
        {items.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <button
              onClick={() => toggle(key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${prefs[key] ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${prefs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export default function BrandSettings() {
  const [activeTab, setActiveTab] = useState('account');

  const renderTab = () => {
    switch (activeTab) {
      case 'account': return <AccountTab />;
      case 'notifs':  return <NotificationsTab />;
      default:        return null;
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and notification preferences</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {renderTab()}
    </div>
  );
}
