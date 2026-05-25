import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { useProfile } from "@digihire/shared";
import { useSales } from "@digihire/shared";
import { useAuth } from "@digihire/shared";
import { supabase } from "@digihire/shared";
import { formatNaira } from "@digihire/shared";
import { Loader2, AlertCircle, Banknote, ShoppingCart, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { KYCModal } from "@/components/voltsquad/KYCModal";
import { ShieldCheck } from "lucide-react";

interface RequestPayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
}

const MIN_PAYOUT = 1000;

export function RequestPayoutDialog({ open, onOpenChange, availableBalance }: RequestPayoutDialogProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: sales } = useSales();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);

  useEffect(() => {
    const checkMfa = async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      if (data && data.all.some(f => f.factor_type === 'totp' && f.status === 'verified')) {
        setIsMfaEnabled(true);
      }
    };
    if (open) checkMfa();
  }, [open]);

  const parsedAmount = parseFloat(amount) || 0;
  const hasBankDetails = profile?.bank_name && profile?.account_number;
  const hasSales = sales && sales.length > 0;
  const hasKyc = !!(profile?.nin && profile?.bvn && profile?.proof_of_address_url);

  const error =
    parsedAmount <= 0
      ? null
      : parsedAmount < MIN_PAYOUT
        ? `Minimum payout is ${formatNaira(MIN_PAYOUT)}`
        : parsedAmount > availableBalance
          ? "Amount exceeds available balance"
          : null;

  const canSubmit =
    parsedAmount >= MIN_PAYOUT &&
    parsedAmount <= availableBalance &&
    hasBankDetails &&
    hasKyc &&
    pin.length >= 4 &&
    (!isMfaEnabled || mfaCode.length === 6) &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !user || !profile) return;

    setSubmitting(true);
    try {
      const { data, error: functionError } = await supabase.functions.invoke('request-payout', {
        body: { amount: parsedAmount, pin, mfaCode }
      });

      if (functionError) throw new Error(functionError.message || "Failed to process payout");
      if (data?.error) throw new Error(data.error);

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(data?.message || "Payout requested! Payment confirmation takes 3-7 working days.");
      setAmount(""); setPin(""); setMfaCode("");
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to request payout");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>Withdraw your earnings to your bank account.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!hasSales && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 flex items-start gap-3">
              <ShoppingCart className="h-5 w-5 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning">Make your first sale to unlock payouts</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your ₦500 signup bonus will be available for withdrawal after you complete your first sale. Head to the marketplace to get started!
                </p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link to="/talent/voltsquad/marketplace" onClick={() => onOpenChange(false)}>Browse Products</Link>
                </Button>
              </div>
            </div>
          )}

          {hasSales && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Only verified sales are eligible for payout. Sale verification and payment confirmation takes 3-7 working days.
              </p>
            </div>
          )}

          <div className="rounded-lg bg-secondary p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
            <p className="text-2xl font-bold font-display">{formatNaira(availableBalance)}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Amount (₦)</label>
            <Input
              type="number"
              min={MIN_PAYOUT}
              max={availableBalance}
              placeholder={`Min ${formatNaira(MIN_PAYOUT)}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {error}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex justify-between">
              <span>Transaction PIN</span>
              {!profile?.transaction_pin && (
                <Link to="/talent/profile/setup" className="text-primary hover:underline" onClick={() => onOpenChange(false)}>Set up PIN</Link>
              )}
            </label>
            <Input
              type="password"
              placeholder="Enter 4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="font-mono tracking-widest text-lg h-12"
              maxLength={4}
            />
          </div>

          {isMfaEnabled && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <QrCode className="h-3 w-3" /> 2FA Authenticator Code
              </label>
              <Input
                type="text"
                placeholder="6-digit code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="font-mono tracking-[0.5em] text-center text-lg h-12"
                maxLength={6}
              />
              <p className="text-[10px] text-muted-foreground">Enter the 6-digit code from your authenticator app.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Bank Details</label>
            {hasBankDetails ? (
              <div className="rounded-lg border border-border/50 p-3 flex items-center gap-3">
                <Banknote className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{profile.bank_name}</p>
                  <p className="text-xs text-muted-foreground">****{profile.account_number.slice(-4)}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-2">No bank details on file.</p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/talent/profile/setup" onClick={() => onOpenChange(false)}>Add Bank Details</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">KYC Verification</label>
            {hasKyc ? (
              <div className="rounded-lg border border-border/50 p-3 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Verified</p>
                  <p className="text-xs text-muted-foreground">Documents uploaded</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-2">KYC information required for payouts.</p>
                <Button variant="outline" size="sm" onClick={() => setKycOpen(true)}>
                  Complete KYC
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="volt-gradient" onClick={handleSubmit} disabled={!canSubmit || !hasSales}>
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : "Request Payout"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <KYCModal open={kycOpen} onOpenChange={setKycOpen} />
    </Dialog>
  );
}
