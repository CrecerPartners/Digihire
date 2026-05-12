import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@digihire/shared";
import { Zap, CheckCircle, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@digihire/shared";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // Synchronous init — check hash before Supabase can clear it
  const [isRecovery, setIsRecovery] = useState(() => {
    const params = new URLSearchParams(window.location.hash.substring(1));
    return params.get("type") === "recovery";
  });
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Secondary detection: catch PASSWORD_RECOVERY event if hash was already cleared
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSuccess(true);
        toast.success("Password updated successfully!");
        timerRef.current = setTimeout(() => {
          navigate(currentSession ? "/dashboard" : "/login");
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Invalid or expired reset link.</p>
            <Button
              variant="link"
              className="mt-2 text-primary"
              onClick={() => navigate("/forgot-password")}
            >
              Request a new one
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl volt-gradient volt-glow">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-display">
              {success ? "Password Updated!" : "Set New Password"}
            </CardTitle>
            <CardDescription className="mt-2">
              {success
                ? "Redirecting you to the dashboard..."
                : "Enter your new password below"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-primary" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">New Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary border-border pr-10"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-secondary border-border pr-10"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full volt-gradient font-semibold" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;


