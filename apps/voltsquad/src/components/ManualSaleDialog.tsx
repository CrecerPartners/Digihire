import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useProducts,
  useAuth,
  supabase,
  formatNaira,
} from "@digihire/shared";
import { Upload, Calculator, Loader2, Minus, Plus, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ManualSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualSaleDialog({ open, onOpenChange }: ManualSaleDialogProps) {
  const { data: products = [] } = useProducts();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState<number | "">("");
  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [conversionStatus, setConversionStatus] = useState("clicked");
  const [submitting, setSubmitting] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = products.find((p) => p.id === productId);
  const isLead = selectedProduct?.productType === "Digital" && selectedProduct?.delivery_type === "lead_url";
  const effectivePrice = typeof price === "number" ? price : (selectedProduct?.price ?? 0);

  const commission = selectedProduct
    ? selectedProduct.commissionModel === "percentage"
      ? quantity * effectivePrice * (selectedProduct.commissionRate / 100)
      : selectedProduct.commissionRate
    : 0;

  const handleSubmit = async () => {
    if (!productId) return toast.error("Select a product");
    if (!isLead && !customer.trim()) return toast.error("Enter customer name");
    if (!user) return toast.error("Not authenticated");

    setSubmitting(true);
    try {
      let proofFileName: string | null = null;

      if (proofFile) {
        const fileName = `${user.id}/${Date.now()}_${proofFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("sale-proofs")
          .upload(fileName, proofFile);
        if (uploadError) throw uploadError;
        proofFileName = fileName;
      }

      const saleData: any = {
        user_id: user.id,
        product_id: productId,
        date: new Date().toISOString().split("T")[0],
        customer: isLead ? "Lead" : customer,
        quantity: isLead ? 1 : quantity,
        amount: isLead ? 0 : effectivePrice * quantity,
        commission: isLead ? 0 : commission,
        status: "pending",
        proof_file_url: proofFileName,
        notes,
      };
      if (isLead) {
        saleData.conversion_status = conversionStatus;
      }

      const { error: saleError } = await supabase
        .from("sales" as any)
        .insert(saleData as any);
      if (saleError) throw saleError;

      if (!isLead) {
        const { error: txError } = await supabase
          .from("transactions" as any)
          .insert({
            user_id: user.id,
            date: new Date().toISOString().split("T")[0],
            type: "manual_sale",
            description: `${selectedProduct!.name} x${quantity} — ${customer}`,
            amount: commission,
            status: "pending",
            proof_file_name: proofFile?.name || null,
          } as any);
        if (txError) throw txError;
      }

      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(isLead ? "Lead logged!" : "Sale logged! Verification takes 3-7 working days.");
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit sale");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setProductId("");
    setQuantity(1);
    setPrice("");
    setCustomer("");
    setNotes("");
    setProofFile(null);
    setConversionStatus("clicked");
    if (proofInputRef.current) proofInputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isLead ? "Log a Lead" : "Log a Sale"}</DialogTitle>
          <DialogDescription>
            {isLead
              ? "Record a lead/sign-up. It will be reviewed and verified by admin."
              : "Record an offline sale. Upload a receipt or screenshot for faster verification (optional)."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Product</label>
            <Select value={productId} onValueChange={(v) => { setProductId(v); const p = products.find(x => x.id === v); if (p) setPrice(p.price); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLead ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Conversion Status</label>
              <Select value={conversionStatus} onValueChange={setConversionStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="clicked">Clicked</SelectItem>
                  <SelectItem value="signed_up">Signed Up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              {/* Customer name — full width, prominent */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Customer Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. Bola Adeyemi"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                />
              </div>

              {/* Quantity + Price row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Quantity</label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => setQuantity(q => q + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Sale Price (₦)</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || "")}
                  />
                </div>
              </div>

              {/* Proof upload — optional */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Receipt / Screenshot <span className="text-muted-foreground/60">(optional — speeds up verification)</span>
                </label>
                <button
                  type="button"
                  onClick={() => proofInputRef.current?.click()}
                  className={`w-full flex items-center gap-3 rounded-lg border border-dashed px-4 py-3 text-sm transition-colors hover:bg-secondary/50 ${
                    proofFile ? "border-primary/40 bg-primary/5 text-foreground" : "border-border text-muted-foreground"
                  }`}
                >
                  {proofFile ? (
                    <ImageIcon className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Upload className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{proofFile ? proofFile.name : "Upload receipt or screenshot"}</span>
                </button>
                <input
                  ref={proofInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                />
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <Textarea
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Commission preview */}
          {selectedProduct && !isLead && (
            <div className="space-y-1.5">
              <div className="rounded-lg bg-secondary p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calculator className="h-4 w-4" />
                  <span>Estimated Commission</span>
                </div>
                <p className="text-sm font-bold text-primary">{formatNaira(commission)}</p>
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                Credited to your wallet once confirmed (3-7 working days)
              </p>
            </div>
          )}

          {selectedProduct && isLead && (
            <div className="rounded-lg bg-secondary p-3 text-center">
              <p className="text-xs text-muted-foreground">
                Commission of <strong className="text-primary">{formatNaira(selectedProduct.commissionRate)}</strong> will be credited when admin verifies this lead.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" className="volt-gradient" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : isLead ? "Submit Lead" : "Submit Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
