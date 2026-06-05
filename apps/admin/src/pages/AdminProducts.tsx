import { useState, useRef, useEffect } from "react";
import { useAdminProducts, useUpsertProduct, useDeleteProduct, useInsertLicenseKeys } from "@/hooks/useAdminData";
import { Button } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@digihire/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@digihire/shared";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@digihire/shared";
import { toast } from "@digihire/shared";
import { Plus, Pencil, Trash2, Upload, X, Image as ImageIcon, Search } from "lucide-react";
import { Textarea, RichTextEditor } from "@digihire/shared";
import { supabase, uploadFileToR2 } from "@digihire/shared";
import { AdminTablePagination, paginateItems } from "@/components/AdminTablePagination";
import { Label } from "@digihire/shared";
import { PRODUCT_TAXONOMY, PRODUCT_TYPES, getCategoriesByType, getProductTypeForCategory, getSubcategoriesByCategory } from "@digihire/shared";

const empty = {
  name: "", brand: "", organization: "", category: "", subcategory: "", price: 0, commission_rate: 0, image: "", description: "",
  product_type: "Physical", commission_model: "percentage", delivery_type: "manual_provision", delivery_instructions: "",
  assets: {
    images: [] as string[],
    videos: [] as string[],
    fulfillment_url: "",
    seller_years: 3,
    sales_count: 0,
    product_quality_rate: 94,
    delivery_rate: 70,
    estimated_delivery_time: "",
    delivery_notes: "",
    return_policy: "Guaranteed 7-Day Return Policy",
    return_policy_url: "",
    warranty_info: "",
  },
};

const PAGE_SIZE = 20;
const NEW_PRODUCT_DRAFT_KEY = "admin-product-draft:new";
const EDIT_PRODUCT_DRAFT_PREFIX = "admin-product-draft:edit:";

export default function AdminProducts() {
  const { data: products, isLoading } = useAdminProducts();
  const upsert = useUpsertProduct();
  const insertKeys = useInsertLicenseKeys();
  const remove = useDeleteProduct();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>(empty);
  const [newLicenseKeys, setNewLicenseKeys] = useState("");
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const [draftKey, setDraftKey] = useState<string | null>(null);

  const organizations = Array.from(new Set((products || []).map((p) => p.organization || p.brand))).filter(Boolean).sort();
  const filterCategories = getCategoriesByType(typeFilter as "all" | "Physical" | "Digital");
  const filterSubcategories = categoryFilter === "all" ? [] : getSubcategoriesByCategory(categoryFilter);

  const filtered = products?.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.organization || p.brand || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || p.product_type === typeFilter;
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    const matchesSubcategory = subcategoryFilter === "all" || p.subcategory === subcategoryFilter;
    const matchesOrg = orgFilter === "all" || (p.organization || p.brand) === orgFilter;
    return matchesSearch && matchesType && matchesCategory && matchesSubcategory && matchesOrg;
  });
  const totalPages = Math.max(1, Math.ceil((filtered?.length ?? 0) / PAGE_SIZE));
  const paginated = paginateItems(filtered, page, PAGE_SIZE);

  const openNew = () => { 
    const rawDraft = localStorage.getItem(NEW_PRODUCT_DRAFT_KEY);
    if (rawDraft) {
      try {
        const draft = JSON.parse(rawDraft);
        setForm({ ...empty, ...draft.form, assets: { images: [], videos: [], fulfillment_url: "", ...(draft.form?.assets || {}) } });
        setNewLicenseKeys(draft.newLicenseKeys || "");
        setVideoUrl(draft.videoUrl || "");
      } catch {
        setForm({ ...empty, assets: { images: [], videos: [], fulfillment_url: "" } });
        setNewLicenseKeys("");
        setVideoUrl("");
      }
    } else {
      setForm({ ...empty, assets: { images: [], videos: [], fulfillment_url: "" } });
      setNewLicenseKeys("");
      setVideoUrl("");
    }
    setDraftKey(NEW_PRODUCT_DRAFT_KEY);
    setOpen(true); 
  };
  
  const openEdit = (p: any) => {
    const assets = typeof p.assets === "object" && p.assets ? p.assets : { images: [], videos: [] };
    const baseForm = {
      ...p,
      product_type: p.product_type || "Physical",
      category: p.category || "",
      subcategory: p.subcategory || "",
      commission_model: p.commission_model || "percentage",
      delivery_type: p.delivery_type || "manual_provision",
      delivery_instructions: p.delivery_instructions || "",
      organization: p.organization || p.brand || "",
      assets: { images: assets.images || [], videos: assets.videos || [], fulfillment_url: assets.fulfillment_url || "" },
    };
    const editDraftKey = `${EDIT_PRODUCT_DRAFT_PREFIX}${p.id}`;
    const rawDraft = localStorage.getItem(editDraftKey);
    if (rawDraft) {
      try {
        const draft = JSON.parse(rawDraft);
        setForm({ ...baseForm, ...draft.form, assets: { ...(baseForm.assets || {}), ...(draft.form?.assets || {}) } });
        setNewLicenseKeys(draft.newLicenseKeys || "");
        setVideoUrl(draft.videoUrl || "");
      } catch {
        setForm(baseForm);
        setNewLicenseKeys("");
        setVideoUrl("");
      }
    } else {
      setForm(baseForm);
      setNewLicenseKeys("");
      setVideoUrl("");
    }
    setDraftKey(editDraftKey);
    setOpen(true);
  };

  const seedDemoProducts = async () => {
    const demos = [
      {
        name: "iPhone 15 Pro Max", brand: "Apple", organization: "Apple Inc.", 
        category: "Electronics & Gadgets", subcategory: "Phones", 
        price: 1500000, commission_rate: 2, image: "https://images.unsplash.com/photo-1696446701796-654876b50937?q=80&w=600", 
        description: "The latest iPhone with Titanium design and A17 Pro chip.",
        product_type: "Physical", commission_model: "percentage", delivery_type: "manual_provision",
        assets: { ...empty.assets }
      },
      {
        name: "Nike Air Jordan 1 High", brand: "Nike", organization: "Nike Global", 
        category: "Fashion & Lifestyle", subcategory: "Shoes", 
        price: 185000, commission_rate: 5, image: "https://images.unsplash.com/photo-1552346154-21d328109a27?q=80&w=600", 
        description: "Iconic basketball shoes that changed the game.",
        product_type: "Physical", commission_model: "percentage", delivery_type: "manual_provision",
        assets: { ...empty.assets }
      },
      {
        name: "Opay Account Signup", brand: "Opay", organization: "Opay Digital Services", 
        category: "Fintech", subcategory: "Fintech App Signup", 
        price: 0, commission_rate: 500, image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=600", 
        description: "Earn 500 Naira for every successful signup on Opay.",
        product_type: "Digital", commission_model: "fixed", delivery_type: "lead_url",
        assets: { ...empty.assets, fulfillment_url: "https://opay.ng/signup" }
      },
      {
        name: "MacBook Pro 14 M3", brand: "Apple", organization: "Apple Inc.", 
        category: "Electronics & Gadgets", subcategory: "Laptops", 
        price: 2200000, commission_rate: 1.5, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600", 
        description: "Powerful MacBook Pro with M3 chip for professionals.",
        product_type: "Physical", commission_model: "percentage", delivery_type: "manual_provision",
        assets: { ...empty.assets }
      },
      {
        name: "Netflix Premium Yearly", brand: "Netflix", organization: "Netflix Entertainment", 
        category: "Subscriptions", subcategory: "Subscriptions", 
        price: 66000, commission_rate: 10, image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=600", 
        description: "Access movie and TV shows on multiple screens.",
        product_type: "Digital", commission_model: "percentage", delivery_type: "license_key",
        assets: { ...empty.assets }
      },
      {
        name: "SaaS Starter Kit", brand: "CodeX", organization: "CodeX Labs", 
        category: "Software & Tools", subcategory: "Software / Tools Signup", 
        price: 45000, commission_rate: 20, image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600", 
        description: "A complete boilerplate for building SaaS applications.",
        product_type: "Digital", commission_model: "percentage", delivery_type: "direct_link",
        assets: { ...empty.assets, fulfillment_url: "https://codex.io/starter" }
      },
      {
        name: "Zara Linen Shirt", brand: "Zara", organization: "Inditex Group", 
        category: "Fashion & Lifestyle", subcategory: "Clothing", 
        price: 35000, commission_rate: 7, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600", 
        description: "Casual and stylish linen shirt for the summer.",
        product_type: "Physical", commission_model: "percentage", delivery_type: "manual_provision",
        assets: { ...empty.assets }
      },
      {
        name: "ChatGPT Plus Subscription", brand: "OpenAI", organization: "OpenAI", 
        category: "Tech Products", subcategory: "Tech Product Signup", 
        price: 22000, commission_rate: 5, image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=600", 
        description: "Get advanced features with GPT-4 and faster responses.",
        product_type: "Digital", commission_model: "percentage", delivery_type: "manual_provision",
        assets: { ...empty.assets }
      },
      {
        name: "Spotify Family Plan", brand: "Spotify", organization: "Spotify AB", 
        category: "Subscriptions", subcategory: "Subscriptions", 
        price: 4500, commission_rate: 500, image: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=600", 
        description: "Music for everyone in the family with personalized accounts.",
        product_type: "Digital", commission_model: "fixed", delivery_type: "direct_link",
        assets: { ...empty.assets, fulfillment_url: "https://spotify.com/family" }
      },
      {
        name: "Samsung Galaxy S24 Ultra", brand: "Samsung", organization: "Samsung Electronics", 
        category: "Electronics & Gadgets", subcategory: "Phones", 
        price: 1450000, commission_rate: 2, image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600", 
        description: "AI-powered smartphone with 200MP camera.",
        product_type: "Physical", commission_model: "percentage", delivery_type: "manual_provision",
        assets: { ...empty.assets }
      }
    ];

    try {
      setUploading(true);
      const toInsert = demos.map(d => {
        const baseSlug = ((d.organization || d.brand) + "-" + d.name)
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");
        const slug = `${baseSlug}-demo-${Math.random().toString(36).substring(2, 7)}`;
        return { ...d, slug };
      });

      const { error } = await supabase.from("products").insert(toInsert as any);
      if (error) throw error;
      
      toast({ title: "Success", description: "10 demo products added!" });
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add demos", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeDemoProducts = async () => {
    if (!confirm("Are you sure you want to remove all demo products?")) return;

    const demoNames = [
      "iPhone 15 Pro Max", "Nike Air Jordan 1 High", "Opay Account Signup", 
      "MacBook Pro 14 M3", "Netflix Premium Yearly", "SaaS Starter Kit", 
      "Zara Linen Shirt", "ChatGPT Plus Subscription", "Spotify Family Plan", 
      "Samsung Galaxy S24 Ultra"
    ];

    try {
      setUploading(true);
      // Remove by name or by the demo slug pattern
      const { error } = await supabase.from("products")
        .delete()
        .or(`name.in.(${demoNames.map(n => `"${n}"`).join(",")}),slug.ilike.%-demo-%`);

      if (error) throw error;

      toast({ title: "Success", description: "Demo products removed!" });
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to remove demos", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    const toSave = { ...form };
    const selectedType = toSave.product_type as "Physical" | "Digital";
    const validCategories = getCategoriesByType(selectedType);
    const validSubcategories = getSubcategoriesByCategory(toSave.category || "");

    if (!toSave.organization?.trim() && !toSave.brand?.trim()) {
      toast({ title: "Organization is required", description: "Please add a brand/organization name.", variant: "destructive" });
      return;
    }
    if (!toSave.product_type) {
      toast({ title: "Product type is required", variant: "destructive" });
      return;
    }
    if (!toSave.category || !validCategories.includes(toSave.category)) {
      toast({ title: "Invalid category", description: "Pick a valid category for the selected product type.", variant: "destructive" });
      return;
    }
    if (!toSave.subcategory || !validSubcategories.includes(toSave.subcategory)) {
      toast({ title: "Invalid subcategory", description: "Pick a valid subcategory for the selected category.", variant: "destructive" });
      return;
    }

    if (!toSave.brand?.trim() && toSave.organization?.trim()) {
      toSave.brand = toSave.organization.trim();
    }
    if (!toSave.organization?.trim() && toSave.brand?.trim()) {
      toSave.organization = toSave.brand.trim();
    }
    toSave.price = Number(toSave.price || 0);
    toSave.commission_rate = Number(toSave.commission_rate || 0);
    if (!toSave.image && toSave.assets?.images?.length > 0) {
      toSave.image = toSave.assets.images[0];
    }
    // Auto-generate slug from product name if not already set
    if (!toSave.slug) {
      const base = (toSave.name as string)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      const suffix = Math.random().toString(36).slice(2, 7);
      toSave.slug = `${base}-${suffix}`;
    }
    upsert.mutate(toSave, {
      onSuccess: (data: any) => { 
        // If there are new license keys to insert
        if (toSave.delivery_type === "license_key" && newLicenseKeys.trim()) {
          // data is not returned from upsert directly because of no select() by default,
          // but if we are editing (toSave.id exists) we can insert keys.
          // If it's a new product, we would need the created ID, so we must rely on editing for keys.
          if (toSave.id) {
            const keys = newLicenseKeys.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
            if (keys.length > 0) {
               insertKeys.mutate({ productId: toSave.id, keys });
            }
          }
        }
        toast({ title: "Product saved" }); 
        if (draftKey) localStorage.removeItem(draftKey);
        setOpen(false); 
      },
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this product?")) return;
    remove.mutate(id, { onSuccess: () => toast({ title: "Product deleted" }) });
  };

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const url = await uploadFileToR2("product-images", path, file);
      setForm((f) => ({
        ...f,
        assets: { ...f.assets, images: [...(f.assets?.images || []), url] },
        image: f.image || url,
      }));
      toast({ title: "Image uploaded" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const uploadImages = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (const file of fileArray) {
      try {
        const ext = file.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const url = await uploadFileToR2("product-images", path, file);
        setForm((f) => ({
          ...f,
          assets: { ...f.assets, images: [...(f.assets?.images || []), url] },
          image: f.image || url,
        }));
        successCount++;
      } catch (error: any) {
        toast({ title: "Upload failed", description: `${file.name}: ${error.message}`, variant: "destructive" });
      }
    }

    setUploading(false);
    if (successCount > 0) {
      toast({ title: `${successCount} image${successCount > 1 ? "s" : ""} uploaded` });
    }
  };

  const removeImage = (idx: number) => {
    setForm((f) => {
      const images = [...(f.assets?.images || [])];
      const removed = images.splice(idx, 1)[0];
      return {
        ...f,
        assets: { ...f.assets, images },
        image: f.image === removed ? (images[0] || "") : f.image,
      };
    });
  };

  const addVideo = () => {
    if (!videoUrl.trim()) return;
    setForm((f) => ({
      ...f,
      assets: { ...f.assets, videos: [...(f.assets?.videos || []), videoUrl.trim()] },
    }));
    setVideoUrl("");
  };

  const removeVideo = (idx: number) => {
    setForm((f) => {
      const videos = [...(f.assets?.videos || [])];
      videos.splice(idx, 1);
      return { ...f, assets: { ...f.assets, videos } };
    });
  };

  const isDigitalProduct = form.product_type === "Digital";
  const availableSubcategories = getSubcategoriesByCategory(form.category);

  useEffect(() => {
    if (!open || !draftKey) return;
    const payload = JSON.stringify({
      form,
      newLicenseKeys,
      videoUrl,
      savedAt: Date.now(),
    });
    localStorage.setItem(draftKey, payload);
  }, [open, draftKey, form, newLicenseKeys, videoUrl]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage the product catalog</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={seedDemoProducts} disabled={uploading}>
            {uploading ? "Adding..." : "Add Demos"}
          </Button>
          <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={removeDemoProducts} disabled={uploading}>
            {uploading ? "Removing..." : "Remove Demos"}
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCategoryFilter("all"); setSubcategoryFilter("all"); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {PRODUCT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setSubcategoryFilter("all"); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {filterCategories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={subcategoryFilter} onValueChange={(v) => { setSubcategoryFilter(v); setPage(1); }} disabled={categoryFilter === "all"}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Subcategory" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subcategories</SelectItem>
            {filterSubcategories.map((sub) => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={orgFilter} onValueChange={(v) => { setOrgFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Brand" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {organizations.map((org) => <SelectItem key={org} value={org}>{org}</SelectItem>)}
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
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Brand / Org</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.organization || p.brand}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {p.product_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.category}
                    {p.subcategory && <span className="text-muted-foreground block text-[10px]">{p.subcategory}</span>}
                  </TableCell>
                  <TableCell>₦{Number(p.price).toLocaleString()}</TableCell>
                  <TableCell>{p.commission_rate}% <span className="text-xs text-muted-foreground">({p.commission_model || "percentage"})</span></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminTablePagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered?.length ?? 0} pageSize={PAGE_SIZE} />
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[95vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Product Name</label>
                <Input placeholder="iPhone 15 Pro" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Brand / Organization</label>
                <Input placeholder="Crecer / Paystack" value={form.organization || form.brand} onChange={(e) => {
                   set("organization", e.target.value);
                   if (!form.brand) set("brand", e.target.value);
                }} />
              </div>
            </div>

            {/* Classification */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Product Type</label>
                <Select value={form.product_type} onValueChange={(v) => {
                  const nextType = v as "Physical" | "Digital";
                  setForm((f) => ({
                    ...f,
                    product_type: nextType,
                    category: "",
                    subcategory: "",
                    delivery_type: nextType === "Physical" ? "manual_provision" : f.delivery_type,
                    assets: nextType === "Physical" ? { ...f.assets, fulfillment_url: "" } : f.assets,
                  }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={(v) => {
                  const categoryType = getProductTypeForCategory(v);
                  setForm(f => ({
                    ...f,
                    product_type: categoryType || f.product_type,
                    category: v,
                    subcategory: "",
                  }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectGroup>
                      <SelectLabel>Physical</SelectLabel>
                      {PRODUCT_TAXONOMY.Physical.map((entry) => (
                        <SelectItem key={entry.category} value={entry.category}>{entry.category}</SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Digital</SelectLabel>
                      {PRODUCT_TAXONOMY.Digital.map((entry) => (
                        <SelectItem key={entry.category} value={entry.category}>{entry.category}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Selecting a category will auto-set the matching product type.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Subcategory</label>
                <Select value={form.subcategory} onValueChange={(v) => set("subcategory", v)} disabled={!form.category}>
                  <SelectTrigger><SelectValue placeholder="Subcategory" /></SelectTrigger>
                  <SelectContent>
                    {availableSubcategories.map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Commission Model</label>
                <Select value={form.commission_model} onValueChange={(v) => set("commission_model", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₦)</SelectItem>
                    <SelectItem value="per_signup">Per Sign-Up (₦)</SelectItem>
                    <SelectItem value="per_install">Per Install (₦)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Price (₦)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.price ?? ""}
                  onChange={(e) => set("price", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Commission Rate / Amount</label>
              <Input
                type="number"
                placeholder="Value"
                value={form.commission_rate ?? ""}
                onChange={(e) => set("commission_rate", e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <RichTextEditor value={form.description || ''} onChange={html => set("description", html)} placeholder="Describe the product..." minHeight="110px" />
            </div>

            {/* Seller + Delivery Display Data */}
            <div className="space-y-3 p-4 bg-muted/20 border rounded-lg">
              <h3 className="text-sm font-semibold text-foreground">Seller & Delivery Display Info</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Seller Years Active</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.assets?.seller_years ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, assets: { ...f.assets, seller_years: e.target.value === "" ? "" : Number(e.target.value) } }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Sales Count</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.assets?.sales_count ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, assets: { ...f.assets, sales_count: e.target.value === "" ? "" : Number(e.target.value) } }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Product Quality Rate (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.assets?.product_quality_rate ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, assets: { ...f.assets, product_quality_rate: e.target.value === "" ? "" : Number(e.target.value) } }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Delivery Rate (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.assets?.delivery_rate ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, assets: { ...f.assets, delivery_rate: e.target.value === "" ? "" : Number(e.target.value) } }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Estimated Delivery Time</Label>
                <Input
                  placeholder="e.g. 1 - 9 business days"
                  value={form.assets?.estimated_delivery_time || ""}
                  onChange={(e) => setForm((f) => ({ ...f, assets: { ...f.assets, estimated_delivery_time: e.target.value } }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Delivery Notes</Label>
                <Textarea
                  placeholder="Express options, same-day cutoffs, location constraints..."
                  rows={2}
                  value={form.assets?.delivery_notes || ""}
                  onChange={(e) => setForm((f) => ({ ...f, assets: { ...f.assets, delivery_notes: e.target.value } }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Return Policy</Label>
                <Input
                  placeholder="e.g. Guaranteed 7-Day Return Policy"
                  value={form.assets?.return_policy || ""}
                  onChange={(e) => setForm((f) => ({ ...f, assets: { ...f.assets, return_policy: e.target.value } }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Return Policy URL</Label>
                <Input
                  placeholder="https://..."
                  value={form.assets?.return_policy_url || ""}
                  onChange={(e) => setForm((f) => ({ ...f, assets: { ...f.assets, return_policy_url: e.target.value } }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Warranty Information</Label>
                <Textarea
                  placeholder="Describe warranty coverage or leave blank."
                  rows={2}
                  value={form.assets?.warranty_info || ""}
                  onChange={(e) => setForm((f) => ({ ...f, assets: { ...f.assets, warranty_info: e.target.value } }))}
                />
              </div>
            </div>

            {/* Delivery Configuration */}
              <div className="space-y-3 p-4 bg-muted/20 border rounded-lg">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  Delivery Configuration
                </h3>
                <div className="space-y-1.5">
                  <Label>Delivery Method</Label>
                  <Select
                    value={isDigitalProduct ? form.delivery_type : "manual_provision"}
                    onValueChange={(v) => set("delivery_type", v)}
                    disabled={!isDigitalProduct}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {isDigitalProduct ? (
                        <>
                          <SelectItem value="lead_url">Immediate Redirect (Lead/Signup/Install)</SelectItem>
                          <SelectItem value="direct_link">Paid Direct Download/Access Link</SelectItem>
                          <SelectItem value="license_key">Software License Keys</SelectItem>
                          <SelectItem value="manual_provision">Manual Provisioning (Account Setup)</SelectItem>
                        </>
                      ) : (
                        <SelectItem value="manual_provision">Physical Delivery / Shipping</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {isDigitalProduct && form.delivery_type === "lead_url" && (
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs text-muted-foreground uppercase">Fulfillment / Redirect URL</Label>
                    <Input
                      placeholder="https://partner-site.com/signup"
                      value={form.assets?.fulfillment_url || ""}
                      onChange={(e) => setForm((f) => ({ ...f, assets: { ...f.assets, fulfillment_url: e.target.value } }))}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Buyers click "Sign Up Now" and go directly here (with ?ref= tracking appended). They skip the cart.
                    </p>
                  </div>
                )}

                {isDigitalProduct && form.delivery_type === "direct_link" && (
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs text-muted-foreground uppercase">Private Access / Download URL</Label>
                    <Input
                      placeholder="https://drive.google.com/..."
                      value={form.assets?.fulfillment_url || ""}
                      onChange={(e) => setForm((f) => ({ ...f, assets: { ...f.assets, fulfillment_url: e.target.value } }))}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Revealed to the buyer immediately only AFTER successful Paystack checkout.
                    </p>
                  </div>
                )}

                {isDigitalProduct && form.delivery_type === "license_key" && (
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs justify-between flex text-muted-foreground uppercase">
                      <span>Add New License Keys</span>
                      {form.id ? <span className="text-primary">* Will be tracked automatically</span> : <span className="text-warning">* Save product first to add keys</span>}
                    </Label>
                    <Textarea 
                      placeholder={form.id ? "Paste keys separated by commas or new lines..." : "Please save the product first before uploading keys."}
                      value={newLicenseKeys} 
                      onChange={(e) => setNewLicenseKeys(e.target.value)} 
                      rows={3} 
                      disabled={!form.id}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Volt will automatically assign one unused key per purchase and reveal it post-payment.
                    </p>
                  </div>
                )}

                {form.delivery_type === "manual_provision" && (
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs text-muted-foreground uppercase">
                      {isDigitalProduct ? "Instructions for Buyer Post-Purchase" : "Delivery Information for Buyer"}
                    </Label>
                    <Textarea
                      placeholder={isDigitalProduct
                        ? "Thank you for purchasing! We will email your login credentials within 2-4 hours..."
                        : "Delivery timeline, shipping region, pickup details, and post-purchase instructions."}
                      value={form.delivery_instructions || ""}
                      onChange={(e) => set("delivery_instructions", e.target.value)}
                      rows={2}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {isDigitalProduct
                        ? "The buyer sees this on their receipt while they wait for you to set up their account."
                        : "The buyer sees this during checkout and in order details after payment."}
                    </p>
                  </div>
                )}
              </div>

            {/* Image management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Product Images</p>
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="h-3 w-3 mr-1" /> {uploading ? "Uploading..." : "Add Image"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 p-2 border rounded-md min-h-[100px] bg-muted/10">
                {(form.assets?.images || []).map((url: string, i: number) => (
                  <div key={i} className="relative group shrink-0">
                    <img src={url} alt="" className="h-20 w-20 rounded-md object-cover border shadow-sm group-hover:opacity-75 transition-opacity" />
                    <button onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                    {form.image === url && (
                      <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[8px] text-white text-center py-0.5 rounded-b-md">Main</div>
                    )}
                  </div>
                ))}
                {form.assets?.images?.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-1">
                    <ImageIcon className="h-8 w-8 opacity-20" />
                    <span className="text-[10px]">No images yet</span>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    uploadImages(e.target.files);
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>

            {/* Video management */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Product Videos</p>
              <div className="flex flex-col gap-2">
                {(form.assets?.videos || []).map((url: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted/40 rounded border text-xs group">
                    <span className="flex-1 truncate text-muted-foreground">{url}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => removeVideo(i)}><X className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Paste Video URL" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="h-8" />
                <Button type="button" variant="outline" size="sm" onClick={addVideo} className="h-8">Add</Button>
              </div>
            </div>
          </div>
          <DialogFooter className="bg-muted/20 -mx-6 -mb-6 p-6 border-t mt-4 rounded-b-lg">
            {draftKey && (
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem(draftKey);
                  setForm({ ...empty, assets: { images: [], videos: [], fulfillment_url: "" } });
                  setNewLicenseKeys("");
                  setVideoUrl("");
                  toast({ title: "Draft cleared" });
                }}
              >
                Clear Draft
              </Button>
            )}
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending} className="volt-gradient min-w-[100px]">
              {upsert.isPending ? "Saving..." : "Save Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


