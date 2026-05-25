import { Outlet, Link } from "react-router-dom";
import { Button } from "@digihire/shared";
import { Zap } from "lucide-react";
import { useAuth } from "@digihire/shared";

export function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded volt-gradient">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">DigiHire</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild size="sm" className="volt-gradient">
                <Link to="/talent">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="volt-gradient">
                  <Link to="/signup?module=voltsquad">Join VoltSquad</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
      <footer className="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} DigiHire. All rights reserved.</p>
      </footer>
    </div>
  );
}
