import { useState } from "react";
import { useAdminVerifications } from "@/hooks/useAdminVerifications";
import { useUpdateProfile } from "@/hooks/useAdminData";
import { Input } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@digihire/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { toast } from "@digihire/shared";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { AdminTablePagination, paginateItems } from "@/components/AdminTablePagination";
import { supabase, getSignedUrlFromR2 } from "@digihire/shared";

const PAGE_SIZE = 20;

const statusColors: Record<string, string> = {
  verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  unverified: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminVerification() {
  const { data: profiles, isLoading } = useAdminVerifications();
  const updateProfile = useUpdateProfile();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = profiles?.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.verification_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil((filtered?.length ?? 0) / PAGE_SIZE));
  const paginated = paginateItems(filtered, page, PAGE_SIZE);

  const updateStatus = (userId: string, status: string) => {
    updateProfile.mutate(
      { userId, updates: { verification_status: status } },
      {
        onSuccess: () => toast({ title: `Status set to ${status}` }),
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  const handleViewDoc = async (path: string) => {
    try {
      const url = await getSignedUrlFromR2("verification-docs", path);
      window.open(url, "_blank");
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to load document", variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Verification Requests</h2>
        <span className="text-sm text-muted-foreground">{profiles?.length ?? 0} total</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Input placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-sm" />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Account Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm capitalize">{p.account_type || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[p.verification_status || "unverified"]}>
                      {p.verification_status || "unverified"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.id_document_url ? (
                      <button onClick={() => handleViewDoc(p.id_document_url)} className="text-primary text-sm flex items-center gap-1 hover:underline bg-transparent border-0 cursor-pointer p-0 font-medium">
                        View <ExternalLink className="h-3 w-3" />
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">No document</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-green-600 h-7 px-2" onClick={() => updateStatus(p.user_id, "verified")} disabled={p.verification_status === "verified"}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 h-7 px-2" onClick={() => updateStatus(p.user_id, "unverified")} disabled={p.verification_status === "unverified"}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No verification requests.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <AdminTablePagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered?.length ?? 0} pageSize={PAGE_SIZE} />
        </div>
      )}
    </div>
  );
}


