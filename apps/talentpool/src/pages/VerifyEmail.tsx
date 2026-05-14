import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, supabase } from '@digihire/shared';
import { motion } from 'motion/react';
import { Mail, RefreshCw, LogOut, ArrowRight } from 'lucide-react';
import { Button, Card, CardContent } from '@digihire/shared';

export default function VerifyEmail() {
  const { signOut } = useAuth();
  const [email] = useState(() => sessionStorage.getItem('pending_verify_email') ?? '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const token = otp.join('');
    if (token.length < 6) return setError('Enter the full 6-digit code.');
    if (!email) return setError('Session expired. Please sign up again.');
    setVerifying(true);
    setError('');
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });
    if (err) {
      setError('Invalid or expired code. Try resending.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } else {
      sessionStorage.removeItem('pending_verify_email');
      setSuccess('Email verified! Redirecting...');
      setTimeout(() => navigate('/talent'), 1000);
    }
    setVerifying(false);
  };

  const handleResend = async () => {
    if (!email) return;
    setSending(true);
    setError('');
    setSuccess('');
    const { error: err } = await supabase.auth.resend({ type: 'signup', email });
    if (err) setError(err.message);
    else setSuccess('New code sent! Check your inbox.');
    setSending(false);
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
              <h1 className="text-2xl text-foreground">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                We sent a 6-digit code to{' '}
                <span className="text-foreground">{email}</span>.
                <span className="block mt-1 text-xs italic">Check your Spam folder if you don't see it.</span>
              </p>
            </div>

            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">{error}</div>}
            {success && <div className="rounded-lg bg-success/10 p-3 text-sm text-success border border-success/20">{success}</div>}

            {/* OTP boxes */}
            <div className="flex items-center justify-center gap-2" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="h-12 w-10 rounded-lg border-2 border-border bg-background text-center text-lg text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                />
              ))}
            </div>

            <div className="space-y-3">
              <Button onClick={handleVerify} disabled={verifying || otp.join('').length < 6} className="w-full gap-2">
                {verifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {verifying ? 'Verifying...' : 'Confirm Email'}
              </Button>
              <Button variant="outline" onClick={handleResend} disabled={sending} className="w-full gap-2">
                {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {sending ? 'Sending...' : 'Resend Code'}
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
