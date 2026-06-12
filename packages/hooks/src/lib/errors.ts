// User-facing error messages.
//
// Raw error text (Supabase/Postgres/RLS internals, stack traces, network
// library strings) must never be shown to end users — it's confusing and can
// leak implementation details. `getFriendlyError` uses an ALLOWLIST: only
// known, human-readable error signatures are surfaced as friendly text;
// anything unrecognized falls back to the caller-provided message or a generic
// one. The original error is always logged so debugging isn't lost.

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

interface KnownError {
  match: RegExp;
  message: string;
}

// Order matters: first match wins. Matches are tested against the raw message.
const KNOWN_ERRORS: KnownError[] = [
  // ── Authentication ───────────────────────────────────────────────
  { match: /invalid login credentials|invalid email or password/i, message: "Incorrect email or password." },
  { match: /email not confirmed|email.*not.*verif/i, message: "Please verify your email before signing in." },
  { match: /user already registered|already registered|already been registered/i, message: "An account with this email already exists." },
  { match: /password should be at least|password.*at least \d|weak password/i, message: "Please choose a stronger password." },
  { match: /(token|otp|code).*(expired|invalid)|invalid.*(token|otp|code)|expired/i, message: "That code is invalid or has expired. Please request a new one." },
  { match: /rate limit|too many requests|too many attempts/i, message: "Too many attempts. Please wait a moment and try again." },
  { match: /signups? (not allowed|disabled)/i, message: "Sign-ups are currently unavailable." },
  { match: /user not found|no user found/i, message: "We couldn't find an account with those details." },
  { match: /session.*(expired|missing|not found)|not authenticated|auth session/i, message: "Your session has expired. Please sign in again." },

  // ── Network ──────────────────────────────────────────────────────
  { match: /failed to fetch|network\s*error|networkerror|fetch failed|load failed|err_network/i, message: "Network error. Please check your connection and try again." },
  { match: /timeout|timed out|aborted|abort\b/i, message: "The request timed out. Please try again." },

  // ── Authorization / RLS (never echo policy text) ─────────────────
  { match: /row-level security|violates row-level|permission denied|not authorized|unauthorized|forbidden|new row violates|insufficient privilege/i, message: "You don't have permission to do that." },

  // ── Storage / uploads ────────────────────────────────────────────
  { match: /payload too large|file.*too large|exceeded the maximum|413/i, message: "That file is too large. Please choose a smaller one." },
  { match: /invalid.*(file type|mime)|unsupported.*(file|format)/i, message: "That file type isn't supported." },

  // ── Data constraints ─────────────────────────────────────────────
  { match: /duplicate key|unique constraint|already exists/i, message: "That already exists." },
  { match: /foreign key|violates foreign key/i, message: "That action can't be completed because related data is missing." },
];

function extractMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const e = error as Record<string, unknown>;
    return String(e.message ?? e.error_description ?? e.error ?? e.msg ?? e.hint ?? "");
  }
  return String(error);
}

/**
 * Convert any thrown value into a safe, user-friendly message.
 *
 * @param error    The caught error (Error, Supabase error object, string, etc.)
 * @param fallback A friendly message to show when the error isn't recognized.
 *                 Omit to use the generic "Something went wrong" message.
 */
export function getFriendlyError(error: unknown, fallback?: string): string {
  const raw = extractMessage(error);

  if (raw) {
    for (const known of KNOWN_ERRORS) {
      if (known.match.test(raw)) return known.message;
    }
  }

  // Keep the technical detail in the console (and any console-capturing
  // monitoring like Sentry) without ever showing it to the user.
  if (error) {
    // eslint-disable-next-line no-console
    console.error("[error]", error);
  }

  return fallback ?? GENERIC_MESSAGE;
}
