import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@digihire/shared";
import { Shield } from "lucide-react";

import { useAuth } from "@digihire/shared";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@digihire/shared";
import { toast } from "sonner";

const SUPER_ADMINS = ["admin@digihire.ng", "crecerpartnersllc@gmail.com"];
const SUPER_ADMIN_PASS = "volt_admin_2026";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading } = useAuth();

  // If already logged in as admin, redirect immediately
  const { isAdmin, isLoading: roleLoading } = useAdminRole();

  useEffect(() => {
    if (!authLoading && !roleLoading && user && isAdmin) {
      navigate("/", { replace: true });
    }
  }, [authLoading, roleLoading, user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
        return;
      }

      // Verify admin role after login
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;
      if (!userId) {
        toast.error("Login failed");
        return;
      }

      // SUPER ADMIN BYPASS: if it's a hardcoded super admin, skip role check
      const isAdminBypass = SUPER_ADMINS.includes(email) || userId === "8a2e2dbe-cecb-4868-8641-f48e073e5d43";

      const { data: hasAdminRole, error: rpcError } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });

      if (rpcError) {
        console.error("Admin check error:", rpcError);
      }

      const isAuthorized = hasAdminRole === true || isAdminBypass;

      if (!isAuthorized) {
        await supabase.auth.signOut();
        toast.error("Access denied. Your account does not have administrator privileges.");
        return;
      }

      toast.success("Welcome, Admin!");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={`${import.meta.env.BASE_URL}assets/logo-color.png`} alt="DigiHire" className="h-12 w-auto object-contain" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display">Admin Portal</CardTitle>
            <CardDescription className="mt-2">
              Sign in with your admin credentials
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="admin@digihire.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary border-border"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90 font-semibold" disabled={loading}>
              {loading ? "Verifying..." : "Sign In as Admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


