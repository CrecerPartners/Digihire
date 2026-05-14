import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, supabase } from '@digihire/shared';
import { motion } from 'motion/react';
import { Mail, CheckCircle, RefreshCw, LogOut } from 'lucide-react';
import { Button, Card, CardContent } from '@digihire/shared';

export default function VerifyEmail() {
  const { user, signOut } = useAuth();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Auto-redirect when Supabase fires SIGNED_IN after the user clicks the email link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user?.email_confirmed_at) {
        navigate('/brand');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleResend = async () => {
    if (!user?.email) return;
    setSending(true);
    setError('');
    setSuccess('');
    const { error: err } = await supabase.auth.resend({ type: 'signup', email: user.email });
    if (err) setError(err.message);
    else setSuccess('Verification email sent! Check your inbox.');
    setSending(false);
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setError('');
    setSuccess('');
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (freshUser?.email_confirmed_at) {
      setSuccess('Email verified! Redirecting...');
      setTimeout(() => navigate('/brand'), 1500);
    } else {
      setError('Email not yet verified. Click the link in your email and try again.');
    }
    setChecking(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <Card className="border-border/50 text-center">
          <CardContent className="pt-8 pb-6 space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-normal text-foreground">Verify your email</h1>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                We've sent a verification link to{' '}
                <span className="font-normal text-foreground">{user?.email}</span>.
                <span className="block mt-1 text-xs italic">Check your Spam folder if you don't see it.</span>
              </p>
            </div>

            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">{error}</div>}
            {success && <div className="rounded-lg bg-success/10 p-3 text-sm text-success border border-success/20">{success}</div>}

            <div className="space-y-3">
              <Button onClick={handleCheckStatus} disabled={checking} className="w-full gap-2">
                {checking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                I've Verified My Email
              </Button>
              <Button variant="outline" onClick={handleResend} disabled={sending} className="w-full gap-2">
                {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Resend Email
              </Button>
            </div>

            <div className="pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => signOut()}
                className="flex items-center gap-2 mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="h-3 w-3" /> Sign Out
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
