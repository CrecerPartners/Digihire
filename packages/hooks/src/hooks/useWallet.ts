import { useMemo } from "react";
import { useTransactions } from "./useTransactions";

export function useWallet() {
  const { data: transactions, ...rest } = useTransactions();

  const summary = useMemo(() => {
    if (!transactions) return { availableBalance: 0, pendingEarnings: 0, totalEarned: 0, totalPaidOut: 0 };

    let totalEarned = 0;
    let totalPaidOut = 0;
    let pendingEarnings = 0;
    const now = new Date();

    for (const t of transactions) {
      if (t.type === "payout") {
        totalPaidOut += Math.abs(t.amount);
      } else if (t.status === "rejected") {
        continue;
      } else if (t.status === "pending" || t.status === "under_review") {
        pendingEarnings += t.amount;
      } else if (t.status === "paid" || t.status === "verified") {
        const withdrawableAt = new Date(t.withdrawable_at);
        if (withdrawableAt <= now) {
          totalEarned += t.amount;
        } else {
          pendingEarnings += t.amount;
        }
      }
    }

    return {
      availableBalance: totalEarned - totalPaidOut,
      pendingEarnings,
      totalEarned: totalEarned + pendingEarnings,
      totalPaidOut,
    };
  }, [transactions]);

  return { summary, transactions, ...rest };
}


