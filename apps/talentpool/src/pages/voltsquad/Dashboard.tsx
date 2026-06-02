import { Card, CardContent } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { formatNaira } from "@digihire/shared";
import { useProfile } from "@digihire/shared";
import { useTransactions } from "@digihire/shared";
import { useSales } from "@digihire/shared";
import { useReferrals } from "@digihire/shared";
import {
  TrendingUp, Clock, ShoppingCart, Users, Copy, ShoppingBag,
  Wallet, UserCog, Banknote, Trophy, BarChart3, Target, ChevronRight,
} from "lucide-react";
import { Progress } from "@digihire/shared";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMemo, useCallback, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useIsMobile } from "@digihire/shared";
import { Loader2 } from "lucide-react";
import { SignupBonusDialog } from "@/components/voltsquad/SignupBonusDialog";
import { OnboardingWalkthrough } from "@/components/voltsquad/OnboardingWalkthrough";

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { data: profile } = useProfile();
  const { data: transactions } = useTransactions();
  const { data: sales } = useSales();
  const { data: referrals } = useReferrals();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    await queryClient.invalidateQueries({ queryKey: ["sales"] });
    await queryClient.invalidateQueries({ queryKey: ["referrals"] });
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
  }, [queryClient]);

  const { containerRef, pullDistance, isRefreshing } = usePullToRefresh({ onRefresh: handleRefresh });

  const dashboardStats = useMemo(() => {
    if (!transactions) return { totalEarnings: 0, pendingPayout: 0, totalSales: 0, referralCount: 0, weeklyGrowth: 0 };
    const totalEarnings = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const pendingPayout = transactions.filter(t => t.status === "pending" && t.amount > 0).reduce((s, t) => s + t.amount, 0);
    return {
      totalEarnings,
      pendingPayout,
      totalSales: sales?.length || 0,
      referralCount: referrals?.length || 0,
      weeklyGrowth: 0,
    };
  }, [transactions, sales, referrals]);

  const recentActivity = useMemo(() => {
    if (!transactions) return [];
    return transactions.slice(0, 5).map(t => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      date: t.date,
    }));
  }, [transactions]);

  const getWeekKey = (d: Date) => {
    const start = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
    return `W${weekNo}`;
  };

  const earningsData = useMemo(() => {
    if (!transactions) return [];
    const weeks: Record<string, number> = {};
    transactions.filter(t => t.amount > 0).forEach(t => {
      const d = new Date(t.date);
      const key = getWeekKey(d);
      weeks[key] = (weeks[key] || 0) + t.amount;
    });
    return Object.entries(weeks).map(([week, earnings]) => ({ week, earnings })).slice(0, 8);
  }, [transactions]);

  const firstName = profile?.name?.split(" ")[0] || "there";

  const [showBonusDialog, setShowBonusDialog] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!profile || !transactions) return;
    const profileAge = new Date().getTime() - new Date(profile.created_at).getTime();
    const isNewSignup = profileAge < 2 * 60 * 1000;
    if (!isNewSignup) return;

    const hasSeenBonus = localStorage.getItem(`volt-bonus-seen-${profile.user_id}`);
    if (!hasSeenBonus) {
      const hasSignupBonus = transactions.some(t => t.type === "signup_bonus");
      if (hasSignupBonus) {
        setShowBonusDialog(true);
        localStorage.setItem(`volt-bonus-seen-${profile.user_id}`, "true");
      }
    }
  }, [profile, transactions]);

  const handleBonusClose = (open: boolean) => {
    setShowBonusDialog(open);
    if (!open && profile) {
      const profileAge = new Date().getTime() - new Date(profile.created_at).getTime();
      const isNewSignup = profileAge < 5 * 60 * 1000;
      const hasSeenOnboarding = localStorage.getItem(`volt-onboarding-done-${profile.user_id}`);
      if (isNewSignup && !hasSeenOnboarding) {
        setShowOnboarding(true);
        localStorage.setItem(`volt-onboarding-done-${profile.user_id}`, "true");
      }
    }
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success("Referral code copied!");
    }
  };

  const stats = [
    { label: "Total Earnings", value: formatNaira(dashboardStats.totalEarnings), icon: TrendingUp, trend: dashboardStats.weeklyGrowth > 0 ? `+${dashboardStats.weeklyGrowth}%` : undefined },
    { label: "Pending Payout", value: formatNaira(dashboardStats.pendingPayout), icon: Clock },
    { label: "Total Sales", value: dashboardStats.totalSales.toString(), icon: ShoppingCart },
    { label: "Referrals", value: dashboardStats.referralCount.toString(), icon: Users },
  ];

  const quickActions = [
    { label: "Set Up Your Profile", icon: UserCog, subtitle: "Complete your profile", onClick: () => navigate("/talent/voltsquad/settings") },
    { label: "Browse Products", icon: ShoppingBag, subtitle: "Find offers to promote", onClick: () => navigate("/talent/voltsquad/marketplace") },
    { label: "Check Wallet", icon: Wallet, subtitle: "View balance & payouts", onClick: () => navigate("/talent/voltsquad/wallet") },
    { label: "Copy Referral Code", icon: Copy, subtitle: "Share & earn bonuses", onClick: copyReferralCode },
    { label: "Request Payout", icon: Banknote, subtitle: "Cash out your earnings", onClick: () => navigate("/talent/voltsquad/wallet") },
    { label: "View Leaderboard", icon: Trophy, subtitle: "See your ranking", onClick: () => navigate("/talent/voltsquad/leaderboard") },
  ];

  return (
    <div ref={isMobile ? containerRef : undefined} className="space-y-6 max-w-7xl relative">
      {isMobile && (pullDistance > 0 || isRefreshing) && (
        <div
          className="flex items-center justify-center transition-all duration-200"
          style={{ height: pullDistance > 0 ? pullDistance : isRefreshing ? 40 : 0 }}
        >
          <Loader2
            className={`h-5 w-5 text-primary transition-transform ${isRefreshing ? "animate-spin" : ""}`}
            style={{ transform: `rotate(${pullDistance * 3}deg)`, opacity: Math.min(pullDistance / 60, 1) }}
          />
        </div>
      )}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-display">
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's how you're doing this week</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                {stat.trend && (
                  <span className="text-xs font-medium text-success">{stat.trend}</span>
                )}
              </div>
              <p className="text-xl md:text-2xl font-bold font-display">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {profile?.income_target_amount && profile.income_target_amount > 0 && (
        <Card className="border-primary/20 bg-primary/5 overflow-hidden">
          <CardContent className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Target className="h-4 w-4" />
                Your {profile.income_target_timeframe} Goal: {formatNaira(profile.income_target_amount)}
              </div>
              <div className="flex justify-between items-end mb-1">
                <p className="text-2xl font-bold font-display">
                  {formatNaira(dashboardStats.totalEarnings)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">achieved</span>
                </p>
                <p className="text-sm font-bold text-primary">
                  {Math.min(Math.round((dashboardStats.totalEarnings / profile.income_target_amount) * 100), 100)}%
                </p>
              </div>
              <Progress value={Math.min((dashboardStats.totalEarnings / profile.income_target_amount) * 100, 100)} className="h-2.5 bg-secondary/50" />
              <p className="text-[11px] text-muted-foreground italic pt-1">
                {dashboardStats.totalEarnings >= profile.income_target_amount
                  ? "🎉 Incredible! You've crushed your target! Set a new one in the calculator."
                  : `You need ${formatNaira(profile.income_target_amount - dashboardStats.totalEarnings)} more to reach your goal.`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/talent/voltsquad/calculator")} className="shrink-0 bg-background hover:bg-primary/10">
              Update Target <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold font-display mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {quickActions.map((action) => (
            <Card
              key={action.label}
              onClick={action.onClick}
              className="border-border/50 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <action.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 border-border/50">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-sm font-semibold mb-4">Earnings Trend</h3>
            <div className="h-[180px] sm:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsData}>
                  <defs>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(207 90% 54%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(207 90% 54%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                    formatter={(value: number) => [formatNaira(value), "Earnings"]}
                  />
                  <Area type="monotone" dataKey="earnings" stroke="hsl(207 90% 54%)" fill="url(#blueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/50">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground">No activity yet. Start selling!</p>
              )}
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                  <span className={`font-semibold ml-2 ${item.amount > 0 ? "text-success" : "text-destructive"}`}>
                    {item.amount > 0 ? "+" : "-"}{formatNaira(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Performance Analytics</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <p className="text-xl font-bold font-display">{dashboardStats.totalSales}</p>
              <p className="text-xs text-muted-foreground">Total Sales</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <p className="text-xl font-bold font-display">{formatNaira(dashboardStats.totalEarnings)}</p>
              <p className="text-xs text-muted-foreground">Total Earnings</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <p className="text-xl font-bold font-display">{dashboardStats.referralCount}</p>
              <p className="text-xs text-muted-foreground">Referrals</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <p className="text-xl font-bold font-display">
                {dashboardStats.totalSales > 0
                  ? `${((dashboardStats.totalEarnings / (sales?.reduce((s, sl) => s + sl.amount, 0) || 1)) * 100).toFixed(1)}%`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Avg Commission Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <SignupBonusDialog open={showBonusDialog} onOpenChange={handleBonusClose} name={firstName} />
      <OnboardingWalkthrough open={showOnboarding} onOpenChange={setShowOnboarding} referralCode={profile?.referral_code || undefined} />
    </div>
  );
};

export default Dashboard;
