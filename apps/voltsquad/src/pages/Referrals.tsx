import { Card, CardContent } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { useProfile } from "@digihire/shared";
import { useReferrals } from "@digihire/shared";
import { formatNaira } from "@digihire/shared";
import { Copy, Share2, Users, Gift, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  signed_up: "text-warning border-warning/20",
  active: "text-primary border-primary/20",
  earned: "text-success border-success/20",
};

const Referrals = () => {
  const { data: profile } = useProfile();
  const { data: referrals = [], isLoading } = useReferrals();

  const totalBonus = referrals.reduce((sum, r) => sum + r.earnings, 0);

  const copyCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success("Referral code copied!");
    }
  };

  const shareLink = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(`https://voltsquad.digihire.io/join-now?ref=${profile.referral_code}`);
      toast.success("Referral link copied!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-display">Referral Center</h1>
        <p className="text-muted-foreground mt-1">Invite friends and earn bonuses</p>
      </div>

      <Card className="border-primary/30 volt-glow">
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">Your Referral Code</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold font-display tracking-widest text-primary">
            {profile?.referral_code || "..."}
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={copyCode} variant="outline" size="sm">
              <Copy className="h-3 w-3 mr-1" /> Copy Code
            </Button>
            <Button onClick={shareLink} size="sm" className="volt-gradient">
              <Share2 className="h-3 w-3 mr-1" /> Share Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xl sm:text-2xl font-bold font-display">{referrals.length}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-success mb-1" />
            <p className="text-xl sm:text-2xl font-bold font-display">{referrals.filter(r => r.status !== "signed_up").length}</p>
            <p className="text-xs text-muted-foreground">Active Signups</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Gift className="h-5 w-5 mx-auto text-warning mb-1" />
            <p className="text-xl sm:text-2xl font-bold font-display">{formatNaira(totalBonus)}</p>
            <p className="text-xs text-muted-foreground">Bonus Earned</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4 md:p-6">
          <h3 className="text-sm font-semibold mb-4">Referred Students</h3>
          <div className="space-y-3">
            {referrals.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No referrals yet. Share your code to get started!</p>
            )}
            {referrals.map((r) => (
              <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-border/50 last:border-0 gap-1 sm:gap-0">
                <div>
                  <p className="text-sm font-medium">{r.referred_name}</p>
                  <p className="text-xs text-muted-foreground">{r.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  {r.earnings > 0 && (
                    <span className="text-sm font-semibold text-success">+{formatNaira(r.earnings)}</span>
                  )}
                  <Badge variant="outline" className={statusColors[r.status]}>
                    {r.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Referrals;


