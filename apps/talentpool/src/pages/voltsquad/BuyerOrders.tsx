import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { ShoppingBag, Search, ExternalLink, Copy, Info } from "lucide-react";
import { supabase } from "@digihire/shared";
import { useProfile } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { formatNaira } from "@digihire/shared";
import { toast } from "sonner";
import { copyToClipboard } from "@digihire/shared";

export default function BuyerOrders() {
  const { data: profile } = useProfile();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!profile?.user_id) {
      setLoading(false);
      return;
    }
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            id, created_at, status, total, paystack_reference,
            order_items (
              id, quantity, price, delivery_details,
              products (id, name, description)
            )
          `)
          .eq("user_id", profile.user_id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err: unknown) {
        console.error("Error fetching orders:", err);
        toast.error("Failed to load your orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [profile?.user_id]);

  const filteredOrders = orders.filter(
    (order) =>
      order.paystack_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_items.some((item: any) =>
        item.products?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="space-y-6 max-w-7xl relative mx-auto pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-display flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" /> My Purchases
        </h1>
        <p className="text-muted-foreground mt-1">View your order history and access digital products.</p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            <CardTitle className="text-lg">Order History</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 border-border/50 focus:border-primary/50"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold font-display mb-2">No purchases yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery ? "No orders match your search." : "When you buy products on the marketplace, they will appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-4 sm:p-6 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Order #{order.paystack_reference?.slice(-6) || order.id.slice(0, 8)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'success' || order.status === 'paid' || order.status === 'confirmed'
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="font-bold font-display text-lg">
                      {formatNaira(order.total)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {order.order_items.map((item: any) => {
                      const details = item.delivery_details;
                      return (
                        <div key={item.id} className="flex flex-col p-4 bg-background border border-border rounded-lg gap-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium block">{item.products?.name}</span>
                              <span className="text-sm text-muted-foreground">Qty: {item.quantity} × {formatNaira(item.price)}</span>
                            </div>
                          </div>

                          {details && (
                            <div className="mt-2 bg-muted/40 p-3 rounded-md border text-sm">
                              {details.type === "link" && (
                                <div className="space-y-2">
                                  <p className="font-medium flex items-center gap-2">
                                    <ExternalLink className="h-4 w-4" /> Access Link
                                  </p>
                                  <p className="text-muted-foreground">{details.message}</p>
                                  <Button size="sm" onClick={() => window.open(details.url, "_blank")}>
                                    Open Product
                                  </Button>
                                </div>
                              )}

                              {details.type === "key" && (
                                <div className="space-y-2">
                                  <p className="font-medium flex items-center gap-2">
                                    <Copy className="h-4 w-4" /> License Keys
                                  </p>
                                  <p className="text-muted-foreground">{details.message}</p>
                                  <div className="space-y-1">
                                    {details.keys?.map((k: string, i: number) => (
                                      <div key={i} className="flex items-center justify-between p-2 bg-background border rounded-md max-w-sm">
                                        <code className="text-xs font-mono">{k}</code>
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(k, "License Key")}>
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {details.type === "manual" && (
                                <div className="flex items-start gap-2 text-muted-foreground bg-accent/30 p-2 rounded-md">
                                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                                  <p>{details.instructions}</p>
                                </div>
                              )}

                              {details.type === "error" && (
                                <p className="text-destructive font-medium">{details.message}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
