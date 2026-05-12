import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@digihire/shared";
import { useAuth } from "@digihire/shared";
import { useProducts } from "@digihire/shared";
import { supabase } from "@digihire/shared";
import { formatNaira } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { Label } from "@digihire/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@digihire/shared";
import { ChevronLeft, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { data: products = [] } = useProducts();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Determine if all items in cart are digital
  const allDigital = useMemo(() => {
    return items.length > 0 && items.every((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product?.productType === "Digital" || product?.delivery_type !== "manual_provision";
    });
  }, [items, products]);

  // Determine if we need to ask for manual provisioning notes
  const needsManualNotes = useMemo(() => {
    return items.some((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product?.delivery_type === "manual_provision" && product?.productType === "Digital";
    });
  }, [items, products]);

  const checkoutSchema = useMemo(() => {
    const base = {
      name: z.string().trim().min(2, "Name is required").max(100),
      email: z.string().trim().email("Valid email is required").max(255),
      phone: z.string().trim().min(10, "Valid phone number is required").max(20),
    };
    if (allDigital) {
      if (needsManualNotes) {
        return z.object({ ...base, order_notes: z.string().trim().min(2, "Please provide the required account details") });
      }
      return z.object(base);
    }
    return z.object({
      ...base,
      address: z.string().trim().min(5, "Delivery address is required").max(500),
      city: z.string().trim().min(2, "City is required").max(100),
      state: z.string().trim().min(2, "State is required").max(100),
      order_notes: z.string().optional(),
    });
  }, [allDigital, needsManualNotes]);

  type CheckoutForm = z.infer<typeof checkoutSchema>;

  const [form, setForm] = useState<Record<string, string>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    order_notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh] text-center">
        <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <p className="text-lg font-semibold">Your cart is empty</p>
        <Link to="/marketplace">
          <Button variant="outline" className="mt-4">
            <ChevronLeft className="h-4 w-4 mr-1" /> Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const visibleFields = allDigital
    ? (needsManualNotes ? ["name", "email", "phone", "order_notes"] as const : ["name", "email", "phone"] as const)
    : (["name", "email", "phone", "address", "city", "state"] as const);

  const handleSubmit = async () => {
    const result = checkoutSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<string, string>> = {};
      result.error.errors.forEach((e) => {
        const field = e.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const refCode = localStorage.getItem("volt_ref_code") || null;
      
      // Get IP Address
      let ip = "0.0.0.0";
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        ip = data.ip;
      } catch (_e) {
        // IP detection is best-effort; continue without it
      }

      // Get/Generate Device ID
      let deviceId = localStorage.getItem("volt_device_id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("volt_device_id", deviceId);
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id || null,
          email: form.email,
          name: form.name,
          phone: form.phone,
          address: allDigital ? "Digital delivery" : form.address,
          city: allDigital ? "N/A" : form.city,
          state: allDigital ? "N/A" : form.state,
          total: totalPrice,
          status: "pending",
          notes: form.order_notes || null,
          ip_address: ip,
          device_id: deviceId,
          user_agent: navigator.userAgent,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
        commission_rate: item.commissionRate,
        ref_code: refCode,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // Resolve Paystack public key
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || import.meta.env.VITE_PAYSTACK_TEST_PUBLIC_KEY;
      if (!publicKey) {
        toast.error("Payment configuration error. Please contact support.");
        setLoading(false);
        return;
      }

      // Inline Paystack Checkout configuration
      const paystackConfig = {
        reference: `VOLT-${order.id.slice(0, 8)}-${Date.now()}`,
        email: form.email,
        amount: Math.round(totalPrice * 100), // Paystack uses kobo
        publicKey: publicKey as string,
        metadata: {
          order_id: order.id,
          custom_fields: []
        }
      };

      // Guard: if Paystack is already loaded, use it directly
      if (typeof (window as any).PaystackPop !== "undefined" || document.querySelector('script[src*="paystack"]')) {
        const handler = (window as any).PaystackPop.setup({
          ...paystackConfig,
          onClose: () => {
            setLoading(false);
            toast.info("Payment window closed.");
          },
          callback: (response: any) => {
            clearCart();
            navigate(`/order-confirmation?reference=${response.reference}`);
          }
        });
        handler.openIframe();
        return;
      }

      // Dynamically load the Paystack script
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => {
        const handler = (window as any).PaystackPop.setup({
          ...paystackConfig,
          onClose: () => {
            setLoading(false);
            toast.info("Payment window closed.");
          },
          callback: (response: any) => {
            clearCart();
            // The webhook will process the fulfillment in the background!
            navigate(`/order-confirmation?reference=${response.reference}`);
          }
        });
        handler.openIframe();
      };
      script.onerror = async () => {
        if (order?.id) {
          await supabase.from("order_items").delete().eq("order_id", order.id);
          await supabase.from("orders").delete().eq("id", order.id);
        }
        setLoading(false);
        toast.error("Failed to load payment processor. Please try again.");
      };
      document.body.appendChild(script);

    } catch (err: any) {
      toast.error(err.message || "Checkout failed. Please try again.");
      setLoading(false);
    }
  };

  const fieldLabels: Record<string, string> = {
    name: "Full Name",
    email: "Email",
    phone: "Phone Number",
    address: "Address",
    city: "City",
    state: "State",
    order_notes: needsManualNotes ? "Account Details / Provisioning Notes" : "Order Notes (Optional)",
  };

  const fieldPlaceholders: Record<string, string> = {
    name: "Full name",
    email: "you@example.com",
    phone: "08012345678",
    address: "Street address",
    city: "Lagos",
    state: "Lagos State",
    order_notes: needsManualNotes ? "e.g., Preferred username, existing account email..." : "Any special instructions...",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Link to="/marketplace" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4 mr-1" /> Continue Shopping
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold font-display">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {allDigital ? "Contact Information" : "Delivery Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {visibleFields.map((field) => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={field}>{fieldLabels[field]}</Label>
                  <Input
                    id={field}
                    type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                    placeholder={fieldPlaceholders[field]}
                    value={form[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                  />
                  {errors[field] && <p className="text-xs text-destructive">{errors[field]}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="truncate flex-1 mr-2">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium shrink-0">{formatNaira(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-border/50 pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{formatNaira(totalPrice)}</span>
              </div>
              <Button
                className="w-full volt-gradient h-12 text-base"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Pay {formatNaira(totalPrice)}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Secured by Paystack
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;


