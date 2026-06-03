import { useState } from "react";
import { useAdminSales, useUpdateSaleStatus, useUpdateSaleDetails, useUpdateTransactionStatus, useAdminTransactions, useAdminUsers } from "@/hooks/useAdminData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { Textarea } from "@digihire/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { Checkbox } from "@digihire/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@digihire/shared";
import { toast } from "@digihire/shared";
import { supabase, getSignedUrlFromR2 } from "@digihire/shared";
import { Check, X, Download, Eye, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { exportToCsv } from "@digihire/shared";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { AdminTablePagination, paginateItems } from "@/components/AdminTablePagination";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const conversionStatusColors: Record<string, string> = {
  clicked: "bg-muted text-muted-foreground",
  signed_up: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  paid_out: "bg-primary/10 text-primary",
};

const PAGE_SIZE = 20;

export default function AdminSales() {
  const { data: sales, isLoading } = useAdminSales();
  const { data: transactions } = useAdminTransactions();
  const { data: users } = useAdminUsers();
  const updateSale = useUpdateSaleStatus();
  const updateDetails = useUpdateSaleDetails();
  const updateTx = useUpdateTransactionStatus();
  const [searchParams] = useSearchParams();
  const userFilter = searchParams.get("user");

  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailSale, setDetailSale] = useState<any>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editAmount, setEditAmount] = useState(0);
  const [editCommission, setEditCommission] = useState(0);
  const [editConversionStatus, setEditConversionStatus] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const userMap = Object.fromEntries((users || []).map((u) => [u.user_id, u]));
  const getSellerName = (sale: any) => sale.profiles?.name || userMap[sale.user_id]?.name || "Unknown";

  let filtered = filter === "all" ? sales : sales?.filter((s) => s.status === filter);
  if (typeFilter === "leads") filtered = filtered?.filter((s: any) => s.products?.product_type === "lead");
  else if (typeFilter === "sales") filtered = filtered?.filter((s: any) => s.products?.product_type !== "lead");
  if (userFilter) filtered = filtered?.filter((s) => s.user_id === userFilter);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered?.filter((s: any) =>
      s.customer?.toLowerCase().includes(q) || s.products?.name?.toLowerCase().includes(q) || getSellerName(s).toLowerCase().includes(q)
    );
  }
  if (dateFrom) filtered = filtered?.filter((s) => new Date(s.date) >= dateFrom);
  if (dateTo) { const end = new Date(dateTo); end.setHours(23, 59, 59); filtered = filtered?.filter((s) => new Date(s.date) <= end); }

  const totalPages = Math.max(1, Math.ceil((filtered?.length ?? 0) / PAGE_SIZE));
  const paginated = paginateItems(filtered, page, PAGE_SIZE);

  const findMatchingTransaction = (sale: any) => {
    return transactions?.find((t) =>
      t.user_id === sale.user_id &&
      (t.type === "commission" || t.type === "manual_sale") &&
      t.status === "pending" &&
      Math.abs(Number(t.amount) - Number(sale.commission)) < 0.01
    );
  };

  const handleConfirm = async (sale: any) => {
    await updateSale.mutateAsync({ saleId: sale.id, status: "confirmed" });
    const tx = findMatchingTransaction(sale);
    if (tx) await updateTx.mutateAsync({ transactionId: tx.id, status: "paid" });
    toast({ title: "Sale confirmed & commission credited to wallet" });
  };

  const handleCancel = async (sale: any) => {
    await updateSale.mutateAsync({ saleId: sale.id, status: "cancelled" });
    const tx = findMatchingTransaction(sale);
    if (tx) await updateTx.mutateAsync({ transactionId: tx.id, status: "cancelled" as any });
    toast({ title: "Sale cancelled" });
  };

  const handleUpdateConversionStatus = async (saleId: string, newStatus: string) => {
    const updates: any = { conversion_status: newStatus };
    // If marking as verified, also confirm the sale to credit commission
    if (newStatus === "verified") {
      updates.status = "confirmed";
    }
    await updateDetails.mutateAsync({ saleId, updates });
    if (newStatus === "verified") {
      const sale = (sales || []).find(s => s.id === saleId);
      if (sale) {
        const tx = findMatchingTransaction(sale);
        if (tx) await updateTx.mutateAsync({ transactionId: tx.id, status: "paid" });
      }
    }
    toast({ title: `Conversion status updated to "${newStatus}"` });
  };

  const handleBulkConfirm = async () => {
    setBulkProcessing(true);
    const pendingSales = (filtered || []).filter(s => selected.has(s.id) && s.status === "pending");
    for (const sale of pendingSales) {
      try { await handleConfirm(sale); } catch {}
    }
    setSelected(new Set());
    setBulkProcessing(false);
    toast({ title: `${pendingSales.length} sale(s) confirmed` });
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    const pendingIds = paginated.filter(s => s.status === "pending").map(s => s.id);
    const allSelected = pendingIds.every(id => selected.has(id));
    setSelected(prev => { const n = new Set(prev); pendingIds.forEach(id => allSelected ? n.delete(id) : n.add(id)); return n; });
  };

  const openDetail = (s: any) => {
    setDetailSale(s);
    setEditNotes(s.notes || "");
    setEditAmount(Number(s.amount));
    setEditCommission(Number(s.commission));
    setEditConversionStatus(s.conversion_status || "");
  };
  const saveDetails = () => {
    if (!detailSale) return;
    const updates: any = { notes: editNotes, amount: editAmount, commission: editCommission };
    if (detailSale.products?.product_type === "lead" && editConversionStatus) {
      updates.conversion_status = editConversionStatus;
    }
    updateDetails.mutate({ saleId: detailSale.id, updates }, {
      onSuccess: () => { toast({ title: "Sale updated" }); setDetailSale(null); },
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  const viewProof = async (url: string) => {
    try {
      const signedUrl = await getSignedUrlFromR2("sale-proofs", url);
      setProofUrl(signedUrl);
    } catch (error) {
      toast({ title: "Error loading proof", variant: "destructive" });
    }
  };

  const downloadProof = async (url: string) => {
    try {
      const signedUrl = await getSignedUrlFromR2("sale-proofs", url);
      const res = await fetch(signedUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = url.split("/").pop() || "proof";
      a.click();
    } catch (error) {
      toast({ title: "Error downloading", variant: "destructive" });
    }
  };

  const handleExport = () => {
    if (!filtered?.length) return;
    exportToCsv("sales", filtered.map(s => ({ ...s, seller: getSellerName(s), product: (s as any).products?.name ?? "" })), [
      { key: "date", label: "Date" }, { key: "seller", label: "Seller" }, { key: "customer", label: "Customer" },
      { key: "product", label: "Product" }, { key: "amount", label: "Amount" }, { key: "commission", label: "Commission" },
      { key: "status", label: "Status" }, { key: "conversion_status", label: "Conversion" },
    ]);
  };

  const pendingCount = sales?.filter(s => s.status === "pending").length || 0;
  const selectedPendingCount = [...selected].filter(id => (filtered || []).find(s => s.id === id && s.status === "pending")).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Sales Verification</h2>
          {pendingCount > 0 && <Badge className="bg-yellow-500 text-white">{pendingCount} pending</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!filtered?.length}>Export CSV</Button>
          {/* Type filter */}
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="leads">Leads</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search seller, customer, product..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <DateRangeFilter from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); setPage(1); }} />
      </div>

      {selectedPendingCount > 0 && (
        <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-muted">
          <span className="text-sm">{selectedPendingCount} pending sale(s) selected</span>
          <Button size="sm" onClick={handleBulkConfirm} disabled={bulkProcessing}>
            <Check className="h-3.5 w-3.5 mr-1" /> Bulk Confirm
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={paginated.filter(s => s.status === "pending").length > 0 && paginated.filter(s => s.status === "pending").every(s => selected.has(s.id))} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((s: any) => {
                const isLead = s.products?.product_type === "lead";
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      {s.status === "pending" && <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} />}
                    </TableCell>
                    <TableCell className="text-xs">{new Date(s.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">{getSellerName(s)}</TableCell>
                    <TableCell>{s.customer}</TableCell>
                    <TableCell>{s.products?.name ?? "—"}</TableCell>
                    <TableCell>
                      {isLead ? (
                        <div className="space-y-1">
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-[10px]">Lead</Badge>
                          {s.conversion_status && (
                            <Select
                              value={s.conversion_status}
                              onValueChange={(v) => handleUpdateConversionStatus(s.id, v)}
                            >
                              <SelectTrigger className="h-6 text-[10px] w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="clicked">Clicked</SelectItem>
                                <SelectItem value="signed_up">Signed Up</SelectItem>
                                <SelectItem value="verified">Verified</SelectItem>
                                <SelectItem value="paid_out">Paid Out</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          {s.products?.product_type === "digital" ? "Digital" : "Physical"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>₦{Number(s.amount).toLocaleString()}</TableCell>
                    <TableCell>₦{Number(s.commission).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="secondary" className={statusColors[s.status] || ""}>{s.status}</Badge></TableCell>
                    <TableCell>
                      {s.proof_file_url ? (
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" onClick={() => viewProof(s.proof_file_url)}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => downloadProof(s.proof_file_url)}><Download className="h-3.5 w-3.5" /></Button>
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" onClick={() => openDetail(s)}><Eye className="h-4 w-4" /></Button>
                        {s.status === "pending" && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleConfirm(s)}><Check className="h-4 w-4 text-green-600" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleCancel(s)}><X className="h-4 w-4 text-destructive" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <AdminTablePagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered?.length ?? 0} pageSize={PAGE_SIZE} />
        </div>
      )}

      {/* Sale detail dialog */}
      <Dialog open={!!detailSale} onOpenChange={(o) => !o && setDetailSale(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sale Details</DialogTitle></DialogHeader>
          {detailSale && (
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Seller:</span> <strong>{getSellerName(detailSale)}</strong></div>
                <div><span className="text-muted-foreground">Customer:</span> <strong>{detailSale.customer}</strong></div>
                <div><span className="text-muted-foreground">Product:</span> <strong>{detailSale.products?.name ?? "—"}</strong></div>
                <div><span className="text-muted-foreground">Quantity:</span> <strong>{detailSale.quantity}</strong></div>
                <div><span className="text-muted-foreground">Date:</span> <strong>{new Date(detailSale.date).toLocaleDateString()}</strong></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant="secondary" className={statusColors[detailSale.status] || ""}>{detailSale.status}</Badge></div>
                <div><span className="text-muted-foreground">Type:</span> <strong>{detailSale.products?.product_type || "physical"}</strong></div>
                {detailSale.conversion_status && (
                  <div><span className="text-muted-foreground">Conversion:</span> <Badge variant="secondary" className={conversionStatusColors[detailSale.conversion_status] || ""}>{detailSale.conversion_status}</Badge></div>
                )}
              </div>
              {detailSale.status === "pending" && (
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs text-muted-foreground">Amount</label><Input type="number" value={editAmount} onChange={(e) => setEditAmount(+e.target.value)} /></div>
                  <div><label className="text-xs text-muted-foreground">Commission</label><Input type="number" value={editCommission} onChange={(e) => setEditCommission(+e.target.value)} /></div>
                </div>
              )}
              {/* Conversion status editor for lead products */}
              {detailSale.products?.product_type === "lead" && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Conversion Status</label>
                  <Select value={editConversionStatus} onValueChange={setEditConversionStatus}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clicked">Clicked</SelectItem>
                      <SelectItem value="signed_up">Signed Up</SelectItem>
                      <SelectItem value="verified">Verified (credits commission)</SelectItem>
                      <SelectItem value="paid_out">Paid Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div><label className="text-xs text-muted-foreground">Admin Notes</label><Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Add notes..." /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailSale(null)}>Close</Button>
            <Button onClick={saveDetails} disabled={updateDetails.isPending}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!proofUrl} onOpenChange={(o) => !o && setProofUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Proof of Sale</DialogTitle></DialogHeader>
          {proofUrl && <img src={proofUrl} alt="Proof" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}


