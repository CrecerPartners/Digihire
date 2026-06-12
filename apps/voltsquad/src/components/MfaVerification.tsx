import { useState } from "react";
import { Button } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@digihire/shared";
import { toast } from "sonner";
import { getFriendlyError } from '@digihire/shared';

interface MfaVerificationProps {
  factorId: string;
  onVerify: () => void;
  onBack: () => void;
}

export function MfaVerification({ factorId, onVerify, onBack }: MfaVerificationProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.length !== 6) return;

    setLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: code,
      });

      if (verifyError) throw verifyError;

      toast.success("Security check passed! ⚡");
      onVerify();
    } catch (err: any) {
      toast.error(getFriendlyError(err, "Invalid authenticator code"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-display font-bold">Security Check</h3>
        <p className="text-sm text-muted-foreground px-4">
          Authenticator app 2FA is enabled. Enter the 6-digit code from your app to continue.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="space-y-3">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000 000"
            className="font-mono tracking-[0.5em] text-center text-2xl h-16"
            maxLength={6}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Button type="submit" className="w-full volt-gradient h-12 font-semibold" disabled={code.length !== 6 || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Verify & Sign In
          </Button>
          <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={onBack} disabled={loading}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
          </Button>
        </div>
      </form>
    </div>
  );
}


