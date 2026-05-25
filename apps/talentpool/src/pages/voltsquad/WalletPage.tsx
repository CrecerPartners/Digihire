import { useState } from "react";
import { Card, CardContent } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@digihire/shared";
import { useWallet } from "@digihire/shared";
import { formatNaira } from "@digihire/shared";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Clock, DollarSign, PlusCircle, Loader2, AlertCircle } from "lucide-react";
import { ManualSaleDialog } from "@/components/voltsquad/ManualSaleDialog";
import { RequestPayoutDialog } from "@/components/voltsquad/RequestPayoutDialog";
import { Alert, AlertDescription } from "@digihire/shared";

const typeLabels: Record<string, string> = {
  commission: "Commission",
  referral_bonus: "Referral Bonus",
  signup_bonus: "Signup Bonus",
  performance_bonus: "Performance Bonus",
  payout: "Payout",
  manual_sale: "Manual Sale",
};

const WalletPage = () => {
  const [manualSaleOpen, setManualSaleOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const { summary, transactions, isLoading } = useWallet();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const allTransactions = transactions || [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display">Wallet & Earnings</h1>
          <p className="text-muted-foreground mt-1">Track your earnings and payouts</p>
        </div>
        <Button className="volt-gradient" onClick={() => setManualSaleOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" /> Log a Sale
        </Button>
      </div>

      {allTransactions.some(t => t.type === "payout" && t.status === "processing") && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning">
            You have a payout being processed. You'll be notified once it's completed.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/30 volt-glow">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <WalletIcon className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Available Balance</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-display">{formatNaira(summary.availableBalance)}</p>
            <Button size="sm" className="mt-3 volt-gradient w-full" onClick={() => setPayoutOpen(true)}>
              Request Payout
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-warning" />
              <span className="text-xs text-muted-foreground">Pending Earnings</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-display">{formatNaira(summary.pendingEarnings)}</p>
            <p className="text-xs text-muted-foreground mt-3">Confirmed in 3-7 working days</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Total Earned (Lifetime)</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-display">{formatNaira(summary.totalEarned)}</p>
            <p className="text-xs text-muted-foreground mt-3">{formatNaira(summary.totalPaidOut)} paid out</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4 md:p-6">
          <Tabs defaultValue="all">
            <TabsList className="bg-secondary mb-4 overflow-x-auto w-full justify-start">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="commission">Commissions</TabsTrigger>
              <TabsTrigger value="manual_sale">Manual Sales</TabsTrigger>
              <TabsTrigger value="referral_bonus">Referral</TabsTrigger>
              <TabsTrigger value="payout">Payouts</TabsTrigger>
            </TabsList>

            {["all", "commission", "manual_sale", "referral_bonus", "payout"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-2">
                {allTransactions
                  .filter((t) => tab === "all" || t.type === tab)
                  .map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${t.amount > 0 ? "bg-success/10" : "bg-destructive/10"}`}>
                          {t.amount > 0 ? <ArrowDownLeft className="h-4 w-4 text-success" /> : <ArrowUpRight className="h-4 w-4 text-destructive" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t.description}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs text-muted-foreground">{typeLabels[t.type]} · {t.date}</p>
                            {t.proof_file_name && (
                              <Badge variant="outline" className="text-[10px] text-primary border-primary/20">📎 {t.proof_file_name}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${t.amount > 0 ? "text-success" : "text-destructive"}`}>
                          {t.amount > 0 ? "+" : "-"}{formatNaira(t.amount)}
                        </p>
                        <Badge variant="outline" className={`text-[10px] ${t.status === "paid" ? "text-success border-success/20" : "text-warning border-warning/20"}`}>
                          {t.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                {allTransactions.filter((t) => tab === "all" || t.type === tab).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <ManualSaleDialog open={manualSaleOpen} onOpenChange={setManualSaleOpen} />
      <RequestPayoutDialog open={payoutOpen} onOpenChange={setPayoutOpen} availableBalance={summary.availableBalance} />
    </div>
  );
};

export default WalletPage;
