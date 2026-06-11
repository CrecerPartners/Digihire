// Salted PIN hashing shared by set-transaction-pin and request-payout.
//
// A transaction PIN is only 4 digits (10,000 possibilities), so an unsalted
// hash is trivially reversible with a precomputed table. We use PBKDF2 with a
// per-PIN random salt and a high iteration count, and store everything needed
// to verify in a single self-describing string:
//
//   pbkdf2$<iterations>$<saltBase64>$<hashBase64>

const ITERATIONS = 200_000;
const HASH_BITS = 256;

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function derive(pin: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    HASH_BITS,
  );
  return new Uint8Array(bits);
}

/** Produce a salted, self-describing PBKDF2 hash for a PIN. */
export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(pin, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * Verify a PIN against a stored value. Supports the new PBKDF2 format and the
 * legacy bare-SHA-256 hash (for users who set a PIN before this change) so they
 * are not locked out. Plaintext comparison is NOT supported.
 */
export async function verifyPin(pin: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;

  if (stored.startsWith("pbkdf2$")) {
    const [, iterStr, saltB64, hashB64] = stored.split("$");
    const iterations = Number(iterStr);
    if (!iterations || !saltB64 || !hashB64) return false;
    const expected = fromBase64(hashB64);
    const actual = await derive(pin, fromBase64(saltB64), iterations);
    return timingSafeEqual(actual, expected);
  }

  // Legacy: unsalted SHA-256 hex (migration support only).
  if (/^[0-9a-f]{64}$/i.test(stored)) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
    const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return timingSafeEqual(new TextEncoder().encode(hex), new TextEncoder().encode(stored.toLowerCase()));
  }

  return false;
}
