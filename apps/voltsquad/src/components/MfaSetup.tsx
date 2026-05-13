import { useState, useEffect } from "react";
import { Button } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { Card, CardContent } from "@digihire/shared";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@digihire/shared";
import { supabase } from "@digihire/shared";
import { Loader2, QrCode, ShieldCheck, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function MfaSetup() {
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaQr, setMfaQr] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"initial" | "setup">("initial");
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return;
    const verified = data.all.some(f => f.factor_type === 'totp' && f.status === 'verified');
    setIsMfaEnabled(verified);
  };

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setMfaFactorId(data.id);
      setMfaQr(data.totp.qr_code);
      setMfaSecret(data.totp.secret);
      setStep("setup");
    } catch (err: any) {
      toast.error(err.message || "Failed to start MFA setup");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (mfaCode.length !== 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaFactorId,
        code: mfaCode,
      });
      if (error) throw error;
      toast.success("MFA successfully enabled!");
      setIsMfaEnabled(true);
      setStep("initial");
      setMfaQr("");
      setMfaSecret("");
      setMfaCode("");
    } catch (err: any) {
      toast.error(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      const factor = data?.all.find(f => f.factor_type === 'totp' && f.status === 'verified');
      if (factor) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (error) throw error;
        toast.success("MFA disabled");
        setIsMfaEnabled(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to disable MFA");
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(mfaSecret);
    toast.success("Secret key copied");
  };

  if (isMfaEnabled) {
    return (
      <>
      <div className="p-4 border border-success/30 bg-success/5 rounded-lg flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="font-semibold text-sm">Authenticator 2FA Protection Active</p>
            <p className="text-xs text-muted-foreground">Your wallet and login are secured with TOTP.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowDisableConfirm(true)} disabled={loading} className="text-destructive hover:bg-destructive/10 border-destructive/20">
          Disable
        </Button>
      </div>

      <AlertDialog open={showDisableConfirm} onOpenChange={setShowDisableConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove Authenticator 2FA from your account. Your login and wallet withdrawals will no longer require a verification code, reducing your account security.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setShowDisableConfirm(false); handleUnenroll(); }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Yes, disable 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
    );
  }

  if (step === "setup") {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 space-y-5">
          <div className="text-center space-y-2">
            <h3 className="font-bold">Setup Authenticator App</h3>
            <p className="text-xs text-muted-foreground">Scan the QR code with Google Authenticator, Authy, or any TOTP app.</p>
          </div>

          <div className="flex justify-center flex-col items-center gap-4">
            <img
              src={`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(mfaQr)))}`}
              alt="Scan this QR code with your authenticator app"
              className="w-48 h-48"
            />
            
            <div className="w-full space-y-2">
              <label className="text-xs font-medium">Can't scan? Enter this secret manually:</label>
              <div className="flex gap-2">
                <code className="flex-1 bg-secondary p-2 rounded text-xs font-mono break-all">{mfaSecret}</code>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copySecret}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium">Enter 6-digit code to verify</label>
            <div className="flex gap-3">
              <Input
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="font-mono tracking-[0.5em] text-center text-lg h-12"
                maxLength={6}
              />
              <Button onClick={handleVerify} disabled={mfaCode.length !== 6 || loading} className="volt-gradient px-8">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
              </Button>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setStep("initial")}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 p-4 border border-border/50 rounded-lg bg-card/50">
        <div className="h-10 w-10 mt-1 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <QrCode className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-sm">Two-Factor Authentication (TOTP)</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Adds an extra layer of security to your account. You will need a code from an authenticator app (like Google Authenticator) whenever you sign in or withdraw funds.
          </p>
        </div>
      </div>
      <Button onClick={handleEnroll} disabled={loading} className="w-full sm:w-auto volt-gradient">
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <QrCode className="h-4 w-4 mr-2" />}
        Enable Authenticator App
      </Button>
    </div>
  );
}


