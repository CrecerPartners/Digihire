import { useState, useEffect } from "react";
import { Card, CardContent } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@digihire/shared";
import { useProducts, Product } from "@digihire/shared";
import { useProfile, useUpdateProfile } from "@digihire/shared";
import { formatNaira } from "@digihire/shared";
import {
  Calculator, Plus, Trash2, Sparkles, Share2,
  Loader2, Target, TrendingUp, Calendar,
  ChevronRight, Save, Info, AlertTriangle,
  Lightbulb, Minus, MessageCircle, Twitter, Copy
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@digihire/shared";
import { toast } from "sonner";
import { Progress } from "@digihire/shared";
import { Tabs, TabsList, TabsTrigger } from "@digihire/shared";

interface PlanItem {
  productId: string;
  quantity: number;
}

const motivationalMessages = [
  { threshold: 0, message: "Add products to see your earning potential! 💡" },
  { threshold: 5000, message: "Great start! That covers a month of data 📱" },
  { threshold: 15000, message: "Nice! You could buy a new pair of sneakers 👟" },
  { threshold: 30000, message: "Amazing! That's a new phone territory 📲" },
  { threshold: 50000, message: "You'd be on track for Gold tier! 🥇" },
  { threshold: 100000, message: "Incredible! That's a whole semester's pocket money 🎓" },
  { threshold: 200000, message: "Legend status! You're basically running a business 🚀" },
];

const getMotivation = (total: number) => {
  let msg = motivationalMessages[0].message;
  for (const m of motivationalMessages) {
    if (total >= m.threshold) msg = m.message;
  }
  return msg;
};

const Calculator_Page = () => {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [items, setItems] = useState<PlanItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  
  const [mode, setMode] = useState<"quick" | "target">("target");
  const [targetAmount, setTargetAmount] = useState<string>("100000");
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly">("monthly");

  // Load saved target from profile
  useEffect(() => {
    if (profile) {
      if (profile.income_target_amount && profile.income_target_amount > 0) {
        setTargetAmount(profile.income_target_amount.toString());
        setTimeframe(profile.income_target_timeframe || "monthly");
        setMode("target");
        if (profile.income_target_items && profile.income_target_items.length > 0) {
          setItems(profile.income_target_items);
        }
      }
    }
  }, [profile]);

  const addItem = () => {
    if (!selectedProduct) return toast.error("Select a product first");
    if (quantity < 1) return toast.error("Quantity must be at least 1");

    const existing = items.find((i) => i.productId === selectedProduct);
    if (existing) {
      setItems(items.map((i) => i.productId === selectedProduct ? { ...i, quantity: i.quantity + quantity } : i));
    } else {
      setItems([...items, { productId: selectedProduct, quantity }]);
    }
    setSelectedProduct("");
    setQuantity(1);
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((i) => i.productId !== productId));
  };

  const getProduct = (id: string) => products.find((p) => p.id === id);

  const calculateCommission = (item: PlanItem) => {
    const p = getProduct(item.productId);
    if (!p) return 0;
    return item.quantity * p.price * (p.commissionRate / 100);
  };

  const totalEarnings = items.reduce((sum, item) => sum + calculateCommission(item), 0);
  const totalSales = items.reduce((sum, item) => sum + item.quantity, 0);
  const targetNum = parseFloat(targetAmount) || 0;
  const progressPercent = Math.min(Math.round((totalEarnings / targetNum) * 100) || 0, 100);

  // Recommendations for higher commission
  const suggestions = products
    .filter(p => p.price * (p.commissionRate / 100) >= 5000)
    .sort((a, b) => (b.price * b.commissionRate) - (a.price * a.commissionRate))
    .slice(0, 2);

  const handleSaveTarget = () => {
    updateProfile.mutate({
      income_target_amount: targetNum,
      income_target_timeframe: timeframe,
      income_target_items: items,
    }, {
      onSuccess: () => toast.success("Income target saved to your profile! ⚡"),
      onError: (err: any) => toast.error(err.message || "Failed to save target")
    });
  };

  const buildShareText = () => {
    const lines = items.map((item) => {
      const p = getProduct(item.productId);
      if (!p) return "";
      return `• ${p.name} x${item.quantity} = ${formatNaira(calculateCommission(item))}`;
    }).filter(Boolean);
    if (mode === "target") {
      return `🎯 Goal: ${formatNaira(targetNum)} in 1 ${timeframe.replace('ly', '')}\n🔥 Progress: ${progressPercent}%\n\n${lines.join("\n")}\n\n💰 Total: ${formatNaira(totalEarnings)}\n\nJoin VoltSquad & start earning! ⚡ talents.digihire.io`;
    }
    return `🔥 My VoltSquad Earnings Plan\n\n${lines.join("\n")}\n\n💰 Total: ${formatNaira(totalEarnings)} from ${totalSales} sales!\n\nJoin VoltSquad & start earning! ⚡ talents.digihire.io`;
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(buildShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(buildShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(buildShareText());
    toast.success("Plan copied to clipboard!");
  };

  const averageCommission = totalSales > 0 ? totalEarnings / totalSales : 0;

  if (productsLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display">Target Calculator</h1>
          <p className="text-muted-foreground mt-1 text-sm">Strategic planning to hit your income goals</p>
        </div>
        
        <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="w-fit">
          <TabsList className="bg-secondary/50 border border-border">
            <TabsTrigger value="target" className="data-[state=active]:bg-background data-[state=active]:text-primary">
              <Target className="h-3.5 w-3.5 mr-1.5" /> Income Target
            </TabsTrigger>
            <TabsTrigger value="quick" className="data-[state=active]:bg-background data-[state=active]:text-primary">
              <Calculator className="h-3.5 w-3.5 mr-1.5" /> Quick Est.
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Build Plan */}
        <div className="lg:col-span-2 space-y-6">
          {mode === "target" && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                   <Target className="h-4 w-4" /> Set Your Goal
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Target Amount (₦)</label>
                    <Input 
                      type="number" 
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="e.g. 500,000"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Timeframe</label>
                    <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
                       <SelectTrigger className="bg-background">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="weekly">Every Week</SelectItem>
                         <SelectItem value="monthly">Every Month</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/50">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Select Products to Sell
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.image} {p.name} — {formatNaira(p.price * (p.commissionRate/100))} comm.
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-16 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setQuantity(q => q + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button onClick={addItem} className="volt-gradient">
                  Add to Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          {items.length > 0 && (
            <Card className="border-border/50">
              <CardContent className="p-4 md:p-6 space-y-3">
                <h3 className="text-sm font-semibold">Mix of Products Planning</h3>
                {items.map((item) => {
                  const p = getProduct(item.productId);
                  if (!p) return null;
                  const commission = calculateCommission(item);
                  return (
                    <div key={item.productId} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-2xl">{p.image}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity} • {formatNaira(p.price * (p.commissionRate/100))} per sale
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-primary">{formatNaira(commission)}</p>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.productId)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {targetNum > 200000 && suggestions.length > 0 && (
            <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 flex items-start gap-3">
               <Lightbulb className="h-5 w-5 text-warning shrink-0 mt-0.5" />
               <div className="space-y-2">
                 <p className="text-sm font-semibold text-warning">Smart Suggestion for High Target</p>
                 <p className="text-xs text-muted-foreground leading-relaxed">
                   To hit {formatNaira(targetNum)} faster, consider promoting products with higher commission potential:
                 </p>
                 <div className="flex flex-wrap gap-2 pt-1">
                    {suggestions.map(p => (
                      <div key={p.id} className="flex items-center gap-1.5 bg-background/50 border border-border/50 rounded-full px-3 py-1">
                         <span className="text-xs">{p.image}</span>
                         <span className="text-[10px] font-medium">{p.name} ({formatNaira(p.price * (p.commissionRate/100))})</span>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* Right Column: Results & Breakdown */}
        <div className="space-y-6">
          <Card className="border-primary/30 volt-glow bg-gradient-to-b from-primary/5 to-transparent">
            <CardContent className="p-5 md:p-6 text-center space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Est. Earnings</p>
                <p className="text-3xl font-bold font-display text-primary">{formatNaira(totalEarnings)}</p>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">from {totalSales} total sales</p>
                  {totalSales > 0 && (
                    <p className="text-[10px] text-muted-foreground/80 lowercase">
                      avg. {formatNaira(averageCommission)} commission per sale
                    </p>
                  )}
                </div>
              </div>

              {mode === "target" && (
                <div className="pt-4 border-t border-border/50 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs mb-1">
                       <span className="font-medium">Goal Progress</span>
                       <span className="text-primary font-bold">{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2 bg-secondary" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-secondary/30 p-3 rounded-lg text-left">
                       <p className="text-[10px] text-muted-foreground uppercase font-bold">Weekly Sales</p>
                       <p className="text-base font-bold">
                          {timeframe === "monthly" ? Math.ceil(totalSales / 4) : totalSales}
                       </p>
                    </div>
                    <div className="bg-secondary/30 p-3 rounded-lg text-left">
                       <p className="text-[10px] text-muted-foreground uppercase font-bold">Daily Target</p>
                       <p className="text-base font-bold">
                          {timeframe === "monthly" ? Math.round(totalSales / 30 * 10) / 10 : Math.round(totalSales / 7 * 10) / 10}
                       </p>
                    </div>
                  </div>

                  {totalEarnings < targetNum && (
                    <div className="text-[11px] text-muted-foreground italic flex justify-center items-center gap-1">
                       <AlertTriangle className="h-3 w-3 text-warning" />
                       You need {formatNaira(targetNum - totalEarnings)} more to hit goal.
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-center gap-2 py-2">
                <Sparkles className="h-4 w-4 text-warning" />
                <p className="text-sm font-medium">{getMotivation(totalEarnings)}</p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {mode === "target" && (
                  <Button onClick={handleSaveTarget} disabled={updateProfile.isPending} variant="secondary" className="w-full">
                    {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save My Target
                  </Button>
                )}
                {items.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="volt-gradient w-full">
                        <Share2 className="h-3.5 w-3.5 mr-2" /> Share Plan
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={shareToWhatsApp} className="gap-2 cursor-pointer">
                        <MessageCircle className="h-4 w-4 text-green-500" /> Share on WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={shareToTwitter} className="gap-2 cursor-pointer">
                        <Twitter className="h-4 w-4 text-sky-500" /> Share on X / Twitter
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={copyToClipboard} className="gap-2 cursor-pointer">
                        <Copy className="h-4 w-4" /> Copy to Clipboard
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {items.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setItems([])} className="text-muted-foreground text-xs">Clear Plan</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5 space-y-3">
              <h4 className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                 <Info className="h-3.5 w-3.5" /> How it works
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2">
                   <ChevronRight className="h-3 w-3 text-primary shrink-0" />
                   <span>Set an income target to see exactly what products to focus on.</span>
                </li>
                <li className="flex gap-2">
                   <ChevronRight className="h-3 w-3 text-primary shrink-0" />
                   <span>Weekly and Daily targets help you stay on track with consistent sales.</span>
                </li>
                <li className="flex gap-2">
                   <ChevronRight className="h-3 w-3 text-primary shrink-0" />
                   <span>Saved targets will be tracked on your dashboard.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Calculator_Page;



