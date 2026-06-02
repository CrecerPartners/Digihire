import { Dialog, DialogContent } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Gift, Zap, PartyPopper } from "lucide-react";

interface SignupBonusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
}

export function SignupBonusDialog({ open, onOpenChange, name }: SignupBonusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm text-center border-primary/30">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full volt-gradient volt-glow flex items-center justify-center">
              <Gift className="h-10 w-10 text-primary-foreground" />
            </div>
            <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-success flex items-center justify-center animate-bounce">
              <PartyPopper className="h-4 w-4 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-display">
              Welcome, {name}! 🎉
            </h2>
            <p className="text-muted-foreground text-sm">
              You just earned your signup bonus!
            </p>
          </div>

          <div className="rounded-xl bg-primary/10 border border-primary/20 px-6 py-4 w-full">
            <p className="text-xs text-muted-foreground mb-1">Bonus Credited</p>
            <p className="text-3xl font-bold font-display text-primary">₦500</p>
          </div>

          <p className="text-xs text-muted-foreground px-4">
            Make your first sale to unlock payouts and start cashing out your earnings! ⚡
          </p>

          <Button className="w-full volt-gradient font-semibold" onClick={() => onOpenChange(false)}>
            <Zap className="h-4 w-4 mr-2" /> Let's Go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
