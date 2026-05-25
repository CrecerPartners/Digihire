import { useState } from "react";
import { Card, CardContent } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { useSales, useDeleteSale, Sale } from "@digihire/shared";
import { formatNaira } from "@digihire/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@digihire/shared";
import { ShoppingCart, TrendingUp, Star, Loader2, PlusCircle, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { ManualSaleDialog } from "@/components/voltsquad/ManualSaleDialog";
import { EditSaleDialog } from "@/components/voltsquad/EditSaleDialog";
import { Alert, AlertDescription } from "@digihire/shared";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@digihire/shared";

const statusColors: Record<string, string> = {
  confirmed: "text-success border-success/20",
  pending: "text-warning border-warning/20",
  cancelled: "text-destructive border-destructive/20",
};

const Sales = () => {
  const { data: sales = [], isLoading } = useSales();
  const deleteSale = useDeleteSale();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [manualSaleOpen, setManualSaleOpen] = useState(false);
  const [editSale, setEditSale] = useState<Sale | null>(null);
  const [deleteSaleId, setDeleteSaleId] = useState<string | null>(null);

  const filtered = sales.filter(
    (s) =>
      (statusFilter === "all" || s.status === statusFilter) &&
      (typeFilter === "all" ||
        (typeFilter === "Physical" && s.product_type === "Physical") ||
        (typeFilter === "Digital" && s.product_type === "Digital"))
  );

  const totalSales = sales.length;
  const confirmedSales = sales.filter(s => s.status === "confirmed");
  const topProduct = confirmedSales.length > 0
    ? confirmedSales.reduce((top, s) => (s.commission > (top?.commission || 0) ? s : top), confirmedSales[0])
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display">Sales Tracking</h1>
          <p className="text-muted-foreground mt-1">Monitor all your attributed sales & leads</p>
        </div>
        <Button className="volt-gradient font-semibold" onClick={() => setManualSaleOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" /> Log a Sale
        </Button>
      </div>

      {sales.filter(s => s.status === "pending").length > 0 && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning">
            You have {sales.filter(s => s.status === "pending").length} sale(s) pending verification. Commissions will be credited once confirmed by admin.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 text-center">
            <ShoppingCart className="h-5 w-5 mx-auto text-primary mb-1.5" />
            <p className="text-xl sm:text-2xl font-bold font-display">{totalSales}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Total Sales</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-success mb-1.5" />
            <p className="text-xl sm:text-2xl font-bold font-display">{confirmedSales.length}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Confirmed</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 text-center">
            <Star className="h-5 w-5 mx-auto text-warning mb-1.5" />
            <p className="text-sm font-bold font-display truncate max-w-[200px] mx-auto">{topProduct?.product_name || "—"}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Top Product</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mr-2">Filters:</span>
        {["all", "Physical", "Digital"].map((t) => (
          <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(t)}
            className={typeFilter === t ? "volt-gradient h-8" : "h-8 text-xs font-medium"}>
            {t === "all" ? "All Types" : t}
          </Button>
        ))}
        <div className="hidden sm:block border-l border-border h-4 mx-2" />
        {["all", "confirmed", "pending", "cancelled"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}
            className={statusFilter === s ? "volt-gradient h-8" : "h-8 text-xs font-medium"}>
            {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      <Card className="border-border/50 shadow-md">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden sm:table-cell">Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right font-semibold">Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-muted-foreground italic">No sales found matching your criteria.</TableCell>
                </TableRow>
              )}
              {filtered.map((sale) => (
                <TableRow key={sale.id} className="border-border/50 group transition-colors">
                  <TableCell className="text-[10px] font-medium text-muted-foreground">{sale.date}</TableCell>
                  <TableCell className="font-semibold text-sm">{sale.product_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-tight py-0 px-1.5 ${sale.product_type === 'Digital' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                      {sale.product_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">{sale.customer || "—"}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{sale.amount > 0 ? formatNaira(sale.amount) : "—"}</TableCell>
                  <TableCell className="text-right text-sm font-bold text-success">{formatNaira(sale.commission)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${statusColors[sale.status]} text-[10px] font-bold uppercase px-2 py-0.5`}>
                      {sale.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sale.status === "pending" && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditSale(sale)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteSaleId(sale.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ManualSaleDialog open={manualSaleOpen} onOpenChange={setManualSaleOpen} />
      <EditSaleDialog open={!!editSale} onOpenChange={(open) => !open && setEditSale(null)} sale={editSale} />

      <AlertDialog open={!!deleteSaleId} onOpenChange={(open) => !open && setDeleteSaleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this sale?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The pending sale will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteSaleId) { deleteSale.mutate(deleteSaleId); setDeleteSaleId(null); } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Sales;
