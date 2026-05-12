import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@digihire/shared';
import { motion } from 'motion/react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@digihire/shared';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/talent');
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: err } = await signIn(email, password);
      if (err) { setError(err.message || 'Failed to login'); return; }
      navigate('/talent');
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
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription className="mt-1">Sign in to your talent account</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">{error}</div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <Input type="email" required placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="bg-secondary border-border" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground border-t border-border/50 pt-4">
              Need an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">Join the Talent Pool</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
