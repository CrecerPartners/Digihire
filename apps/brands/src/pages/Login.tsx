import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@digihire/shared';
import { motion } from 'motion/react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@digihire/shared';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/brand');
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: err } = await signIn(email, password);
      if (err) { setError(err.message || 'Failed to login'); return; }
      navigate('/brand');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <Card className="border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <img src="/assets/logo-color.png" alt="DigiHire" className="h-12 w-auto object-contain" />
            </div>
            <div>
              <CardTitle className="text-2xl">Brand Login</CardTitle>
              <CardDescription className="mt-1">Sign in to your brand account</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">{error}</div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Work Email</label>
                <Input type="email" required placeholder="hr@company.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="bg-secondary border-border pr-10" />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground border-t border-border/50 pt-4">
              Need an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">Register your Brand</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
