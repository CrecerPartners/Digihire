import { useState } from "react";
import { Dialog, DialogContent } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { UserCog, ShoppingBag, Wallet, Copy, Banknote, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface OnboardingWalkthroughProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralCode?: string;
}

const steps = [
  {
    icon: UserCog,
    title: "Set Up Your Profile",
    subtitle: "Add your photo, bio, and bank details so you're ready to earn.",
    action: "Go to Profile",
    route: "/talent/voltsquad/settings",
  },
  {
    icon: ShoppingBag,
    title: "Browse Products",
    subtitle: "Explore products and add them to your shop to start selling.",
    action: "Browse Marketplace",
    route: "/talent/voltsquad/marketplace",
  },
  {
    icon: Wallet,
    title: "Check Your Wallet",
    subtitle: "Your ₦500 signup bonus is already there! See your balance.",
    action: "View Wallet",
    route: "/talent/voltsquad/wallet",
  },
  {
    icon: Copy,
    title: "Copy Your Referral Code",
    subtitle: "Share your code with friends and earn ₦500 per signup!",
    action: "Copy Code",
    route: null,
  },
  {
    icon: Banknote,
    title: "Request a Payout",
    subtitle: "Once you've earned enough, cash out to your bank account.",
    action: "Go to Wallet",
    route: "/talent/voltsquad/wallet",
  },
  {
    icon: Trophy,
    title: "View Leaderboard",
    subtitle: "See how you rank against other Volt sellers nationwide.",
    action: "View Leaderboard",
    route: "/talent/voltsquad/leaderboard",
  },
];

export function OnboardingWalkthrough({ open, onOpenChange, referralCode }: OnboardingWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const step = steps[currentStep];

  const handleAction = () => {
    if (step.route) {
      navigate(step.route);
      onOpenChange(false);
    } else if (currentStep === 3 && referralCode) {
      navigator.clipboard.writeText(referralCode);
      toast.success("Referral code copied!");
      handleNext();
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs border-border">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === currentStep ? "w-5 bg-primary" : i < currentStep ? "w-2.5 bg-primary/40" : "w-2.5 bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Step {currentStep + 1} of {steps.length}</p>

          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
            <step.icon className="h-5 w-5 text-primary" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold font-display">{step.title}</h2>
            <p className="text-xs text-muted-foreground px-1">{step.subtitle}</p>
          </div>

          <div className="w-full space-y-1.5 pt-1">
            <Button className="w-full volt-gradient font-semibold text-sm h-9" onClick={handleAction}>
              {step.action}
            </Button>
            {currentStep < steps.length - 1 ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1 font-medium" onClick={handleNext}>
                  Next →
                </Button>
                <button
                  onClick={handleSkip}
                  className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors px-2"
                >
                  Skip all
                </button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs" onClick={handleSkip}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
