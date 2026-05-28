import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@digihire/supabase";
import { Capacitor } from "@capacitor/core";

// ── Session hint cookie ────────────────────────────────────
// A lightweight non-sensitive cookie (just the user's first name) set on
// .digihire.io so the marketing landing page can detect login state and
// show the user's name instead of "Get Started".
const HINT_COOKIE = 'dh_hint';

function setSessionHint(name: string) {
  if (Capacitor.isNativePlatform()) return;
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  const domain = window.location.hostname.endsWith('digihire.io') ? '; domain=.digihire.io' : '';
  document.cookie = `${HINT_COOKIE}=${encodeURIComponent(name)}; expires=${expires}; path=/${domain}; SameSite=Lax`;
}

function clearSessionHint() {
  if (Capacitor.isNativePlatform()) return;
  if (typeof document === 'undefined') return;
  const domain = window.location.hostname.endsWith('digihire.io') ? '; domain=.digihire.io' : '';
  document.cookie = `${HINT_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}; SameSite=Lax`;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string, university?: string, accountType?: string) => Promise<{ data: any, error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ data: any, error: Error | null }>;
  signOut: (options?: { skipRedirect?: boolean }) => Promise<void>;
  verifyOtp: (email: string, token: string, type: "signup" | "email") => Promise<{ error: Error | null }>;
  resendSignupOtp: (email: string) => Promise<{ error: Error | null }>;
  sendLoginOtp: (email: string) => Promise<{ error: Error | null }>;
  resendLoginOtp: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, signOutRedirect }: { children: ReactNode; signOutRedirect?: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const intentionalSignOut = useRef(false);

  // signOutRedirect prop overrides the default landing-page redirect for apps that
  // should stay within their own domain on sign-out (e.g. brands, talentpool).
  const resolvedSignOutUrl = signOutRedirect ?? (import.meta.env.VITE_LANDING_URL ?? "https://digihire.io");

  useEffect(() => {
    // Initialise session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === "SIGNED_IN" && session?.user) {
        const name =
          (session.user.user_metadata?.full_name as string | undefined) ||
          (session.user.user_metadata?.name as string | undefined) ||
          session.user.email?.split('@')[0] || '';
        setSessionHint(name);
      }

      // When the token expires / refresh fails, Supabase fires SIGNED_OUT.
      // Redirect to /login so the user isn't left on a broken/404 screen.
      // Skip if the signout was intentional (e.g. during the login OTP flow).
      if (event === "SIGNED_OUT") {
        clearSessionHint();
        const wasIntentional = intentionalSignOut.current;
        intentionalSignOut.current = false;
        if (!wasIntentional) {
          if (Capacitor.isNativePlatform()) {
            window.location.replace("/login");
          } else {
            window.location.replace(resolvedSignOutUrl);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name?: string, university?: string, accountType?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name: name || "", university: university || "", account_type: accountType || "" },
      },
    });
    return { data, error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error: error as Error | null };
  };

  const signOut = async (options?: { skipRedirect?: boolean }) => {
    intentionalSignOut.current = true;
    clearSessionHint();
    await supabase.auth.signOut();
    if (!options?.skipRedirect) {
      if (Capacitor.isNativePlatform()) {
        window.location.href = "/";
      } else {
        window.location.href = resolvedSignOutUrl;
      }
    }
  };

  const verifyOtp = async (email: string, token: string, type: "signup" | "email") => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type });
    return { error: error as Error | null };
  };

  const resendSignupOtp = async (email: string) => {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    return { error: error as Error | null };
  };

  const sendLoginOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    return { error: error as Error | null };
  };

  const resendLoginOtp = sendLoginOtp;

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut, verifyOtp, resendSignupOtp, sendLoginOtp, resendLoginOtp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
