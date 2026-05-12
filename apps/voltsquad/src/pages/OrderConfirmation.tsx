import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@digihire/shared";
import { Card, CardContent } from "@digihire/shared";
import { CheckCircle, ShoppingCart, XCircle, Copy, ExternalLink, Info } from "lucide-react";
import { ReviewPrompt } from "@/components/ReviewPrompt";
import { supabase } from "@digihire/shared";
import { toast } from "sonner";
import { copyToClipboard } from "@digihire/shared";

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference");
  const status = searchParams.get("status") || "success";
  const productIds = searchParams.get("products")?.split(",").filter(Boolean) || [];

  const isSuccess = status !== "failed";
  const [deliveryItems, setDeliveryItems] = useState<any[]>([]);

  useEffect(() => {
    if (isSuccess && reference) {
      // Fetch order items with their delivery details, using the paystack reference
      const fetchDelivery = async () => {
        // Find the order by reference
        const { data: order } = await supabase
          .from("orders")
          .select("id")
          .eq("paystack_reference", reference)
          .single();

        if (order) {
          // It might take a moment for the edge function to finish fulfilling the items
          const timer = setTimeout(async () => {
            const { data: items } = await supabase
              .from("order_items")
              .select("id, delivery_details, products(name)")
              .eq("order_id", order.id)
              .not("delivery_details", "is", null);
            
            if (items) setDeliveryItems(items);
          }, 2000);
          return () => clearTimeout(timer);
        }
      };
      fetchDelivery();
    }
  }, [isSuccess, reference]);

  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-6">
      <Card>
        <CardContent className="pt-8 pb-8 space-y-4">
          {isSuccess ? (
            <>
              <CheckCircle className="h-16 w-16 text-success mx-auto" />
              <h1 className="text-2xl font-bold font-display">Order Confirmed!</h1>
              <p className="text-muted-foreground">
                Thank you for your purchase. Your order has been placed successfully.
              </p>
              {reference && (
                <p className="text-xs text-muted-foreground">
                  Reference: <span className="font-mono">{reference}</span>
                </p>
              )}

              {/* Digital Delivery Section */}
              {deliveryItems.length > 0 && (
                <div className="mt-8 space-y-4 text-left">
                  <h3 className="font-semibold text-lg border-b pb-2">Your Digital Products</h3>
                  {deliveryItems.map((item) => {
                    const details = item.delivery_details;
                    return (
                      <div key={item.id} className="p-4 bg-muted/30 rounded-lg border border-border/50 space-y-2">
                        <p className="font-medium text-sm text-primary">{item.products?.name}</p>
                        
                        {details.type === "link" && (
                          <div className="space-y-2">
                            <p className="text-sm text-foreground">{details.message}</p>
                            <Button className="w-full" onClick={() => window.open(details.url, "_blank")}>
                              <ExternalLink className="h-4 w-4 mr-2" /> Access Product
                            </Button>
                          </div>
                        )}

                        {details.type === "key" && (
                          <div className="space-y-2">
                            <p className="text-sm text-foreground">{details.message}</p>
                            {details.keys?.map((k: string, i: number) => (
                              <div key={i} className="flex items-center justify-between p-2 bg-background border rounded-md">
                                <code className="text-sm font-mono">{k}</code>
                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(k, "License Key")}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {details.type === "manual" && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-accent/50 p-3 rounded-md">
                            <Info className="h-4 w-4 mt-0.5 shrink-0" />
                            <p>{details.instructions}</p>
                          </div>
                        )}

                        {details.type === "error" && (
                          <p className="text-sm text-destructive">{details.message}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto" />
              <h1 className="text-2xl font-bold font-display">Payment Failed</h1>
              <p className="text-muted-foreground">
                Something went wrong with your payment. Please try again.
              </p>
            </>
          )}

          <div className="flex flex-col gap-2 pt-4">
            <Button asChild className="volt-gradient">
              <Link to="/marketplace">
                <ShoppingCart className="h-4 w-4 mr-2" /> Continue Shopping
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">Create an Account</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Review prompt after successful purchase */}
      {isSuccess && productIds.length > 0 && (
        <ReviewPrompt productIds={productIds} />
      )}
    </div>
  );
};

export default OrderConfirmation;


