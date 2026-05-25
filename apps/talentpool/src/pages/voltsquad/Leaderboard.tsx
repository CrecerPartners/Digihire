import { Card, CardContent } from "@digihire/shared";
import { Progress } from "@digihire/shared";
import { useLeaderboard } from "@/hooks/voltsquad/useLeaderboard";
import { useTransactions } from "@digihire/shared";
import { formatNaira } from "@digihire/shared";
import { Trophy, Medal, Crown, Loader2 } from "lucide-react";
import { useMemo } from "react";

const tiers = [
  { name: "Bronze", minEarnings: 0, color: "hsl(30 60% 50%)" },
  { name: "Silver", minEarnings: 25000, color: "hsl(0 0% 65%)" },
  { name: "Gold", minEarnings: 75000, color: "hsl(45 90% 50%)" },
  { name: "Platinum", minEarnings: 150000, color: "hsl(207 90% 54%)" },
];

const rankIcons = [Crown, Medal, Trophy];

const Leaderboard = () => {
  const { data: entries = [], isLoading } = useLeaderboard();
  const { data: transactions } = useTransactions();

  const totalEarnings = useMemo(() => {
    if (!transactions) return 0;
    return transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  const currentTier = tiers.filter((t) => totalEarnings >= t.minEarnings).pop()!;
  const nextTier = tiers[tiers.indexOf(currentTier) + 1];
  const progress = nextTier
    ? ((totalEarnings - currentTier.minEarnings) / (nextTier.minEarnings - currentTier.minEarnings)) * 100
    : 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderBoard = (list: typeof entries) => (
    <div className="space-y-2">
      {list.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
      )}
      {list.map((entry) => {
        const RankIcon = entry.rank <= 3 ? rankIcons[entry.rank - 1] : null;
        return (
          <div
            key={entry.user_id}
            className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${entry.isCurrentUser ? "bg-primary/10 border border-primary/30" : "bg-secondary/50"}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 text-center">
                {RankIcon ? (
                  <RankIcon className={`h-5 w-5 mx-auto ${entry.rank === 1 ? "text-warning" : entry.rank === 2 ? "text-muted-foreground" : "text-warning/60"}`} />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">#{entry.rank}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {entry.name || "Anonymous"} {entry.isCurrentUser && <span className="text-primary">(You)</span>}
                </p>
                <p className="text-xs text-muted-foreground">{entry.university || "Unknown"}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{formatNaira(entry.total_earnings)}</p>
              <p className="text-xs text-muted-foreground">{entry.total_sales} sales</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-display">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">See how you rank among fellow agents</p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Current Tier</p>
              <p className="text-base sm:text-lg font-bold font-display" style={{ color: currentTier.color }}>{currentTier.name}</p>
            </div>
            {nextTier && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Next Tier</p>
                <p className="text-base sm:text-lg font-bold font-display" style={{ color: nextTier.color }}>{nextTier.name}</p>
              </div>
            )}
          </div>
          <Progress value={progress} className="h-2" />
          {nextTier && (
            <p className="text-xs text-muted-foreground text-center">
              {formatNaira(nextTier.minEarnings - totalEarnings)} more to reach {nextTier.name}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-4 md:p-6">
          <h3 className="text-sm font-semibold mb-4">Rankings</h3>
          {renderBoard(entries)}
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
