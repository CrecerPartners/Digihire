import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { useProducts, Product } from "@digihire/shared";
import { useCart } from "@digihire/shared";
import { useProfile } from "@digihire/shared";
import { useAuth } from "@digihire/shared";
import { useMyShopItems, useAddToShop, useRemoveFromShop } from "@/hooks/voltsquad/useSellerShop";
import { formatNaira } from "@digihire/shared";
import { Link2, Filter, Search, PackageOpen, Loader2, Eye, Store, Check } from "lucide-react";
import { toast } from "sonner";
import { AspectRatio } from "@digihire/shared";
import { PRODUCT_TYPES, getCategoriesByType, getSubcategoriesByCategory } from "@digihire/shared";

const productTypeLabels: Record<string, string> = {
  Physical: "Physical Products",
  Digital: "Digital Products",
};

const categoryColors: Record<string, string> = {
  "Fashion & Lifestyle": "bg-pink-500/10 text-pink-500 border-pink-500/20",
  "Electronics & Gadgets": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Fintech": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "Tech Products": "bg-violet-500/10 text-violet-500 border-violet-500/20",
  "Software & Tools": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "Subscriptions": "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
};

function getCommissionLabel(product: Product) {
  if (product.commissionModel === "percentage") return `${product.commissionRate}%`;
  if (product.commissionModel === "fixed") return formatNaira(product.commissionRate);
  if (product.commissionModel === "per_signup") return `${formatNaira(product.commissionRate)}/signup`;
  if (product.commissionModel === "per_install") return `${formatNaira(product.commissionRate)}/install`;
  return `${product.commissionRate}%`;
}

const Marketplace = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { data: shopItemIds = [] } = useMyShopItems();
  const addToShop = useAddToShop();
  const removeFromShop = useRemoveFromShop();

  const [activeType, setActiveType] = useState<string>("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("all");
  const [activeOrg, setActiveOrg] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"commission" | "name">("commission");
  const [searchQuery, setSearchQuery] = useState("");

  const organizations = Array.from(new Set(products.map(p => p.organization || p.brand)))
    .filter(Boolean)
    .sort();

  const filtered = products
    .filter((p) => activeType === "all" || p.productType === activeType)
    .filter((p) => activeCategory === "all" || p.category === activeCategory)
    .filter((p) => activeSubcategory === "all" || p.subcategory === activeSubcategory)
    .filter((p) => activeOrg === "all" || (p.organization || p.brand) === activeOrg)
    .filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.organization || p.brand).toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => sortBy === "commission" ? b.commissionRate - a.commissionRate : a.name.localeCompare(b.name));

  const getLink = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const code = profile?.referral_code || "VOLT";
    navigator.clipboard.writeText(`${window.location.origin}/product/${product.slug}?ref=${code}`);
    toast.success(`Link copied for ${product.name}!`);
  };

  const currentCategories = getCategoriesByType(activeType as "all" | "Physical" | "Digital");
  const currentSubcategories = activeCategory === "all" ? [] : getSubcategoriesByCategory(activeCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="volt-gradient rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative z-10 space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-white">
              What are you selling today, <span className="underline decoration-white/40 underline-offset-4">{firstName}</span>?
            </h1>
            <p className="text-white/70 text-sm mt-1">{filtered.length} products available</p>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input
              placeholder="Search products, brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30 truncate"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {["all", ...PRODUCT_TYPES].map((t) => (
            <Button
              key={t}
              variant={activeType === t ? "default" : "outline"}
              size="sm"
              onClick={() => { setActiveType(t); setActiveCategory("all"); setActiveSubcategory("all"); }}
              className={activeType === t ? "volt-gradient h-8 text-xs font-semibold" : "h-8 text-xs"}
            >
              {t === "all" ? "All Products" : productTypeLabels[t]}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["all", ...currentCategories].map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? "volt-gradient h-8 text-xs" : "h-8 text-xs font-medium text-muted-foreground hover:text-foreground"}
            >
              {cat === "all" ? "All Categories" : cat}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["all", ...currentSubcategories].map((sub) => (
            <Button
              key={sub}
              variant={activeSubcategory === sub ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSubcategory(sub)}
              disabled={activeCategory === "all"}
              className={activeSubcategory === sub ? "volt-gradient h-8 text-xs" : "h-8 text-xs font-medium text-muted-foreground hover:text-foreground"}
            >
              {sub === "all" ? "All Subcategories" : sub}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {["all", ...organizations].map((org) => (
              <Button
                key={org}
                variant={activeOrg === org ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveOrg(org)}
                className={`${activeOrg === org ? "volt-gradient h-8 text-xs" : "h-8 text-xs font-medium text-muted-foreground"}`}
              >
                {org === "all" ? "All Brands" : org}
              </Button>
            ))}
          </div>
          <div className="shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setSortBy(sortBy === "commission" ? "name" : "commission")} className="text-muted-foreground h-8 text-xs px-2 sm:px-3">
              <Filter className="h-3 w-3 mr-1" /> Sort: {sortBy === "commission" ? "Commission" : "Name"}
            </Button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PackageOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No products found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <Link key={product.id} to={`/product/${product.slug}`} className="block">
              <Card className="border-border/50 group hover:border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden h-full flex flex-col">
                <div className="relative overflow-hidden shrink-0">
                  <AspectRatio ratio={4 / 3}>
                    {(() => {
                      const src = product.assets?.images?.[0] || product.image;
                      return src ? (
                        <img
                          src={src}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          loading="lazy"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-xs">No image</span>
                        </div>
                      );
                    })()}
                  </AspectRatio>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-background/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <Eye className="h-4 w-4 text-foreground" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
                    <Badge variant="outline" className={`${categoryColors[product.category] || "bg-muted text-muted-foreground"} text-[10px] px-2 py-0.5 backdrop-blur-md bg-white/70 dark:bg-black/70 border-white/20`}>
                      {product.category}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4 flex flex-col flex-1 gap-2.5">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</h3>
                      <Badge variant="secondary" className="text-[10px] shrink-0 font-medium capitalize">
                        {product.productType}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{product.organization || product.brand}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed opacity-80">{product.description}</p>
                  </div>

                  <div className="flex flex-col gap-3 pt-1 border-t border-border/40">
                    <div className="flex items-baseline justify-between">
                      {product.price > 0 && <span className="text-xs font-medium text-muted-foreground">{formatNaira(product.price)}</span>}
                      <span className="text-base font-bold text-primary ml-auto">{getCommissionLabel(product)}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={shopItemIds.includes(product.id) ? "secondary" : "default"}
                        className={shopItemIds.includes(product.id) ? "text-xs h-9 flex-1" : "volt-gradient text-xs h-9 flex-1 shadow-md hover:shadow-lg transition-all"}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const inShop = shopItemIds.includes(product.id);
                          if (inShop) {
                            removeFromShop.mutate(product.id, { onSuccess: () => toast.success(`Removed from shop`) });
                          } else {
                            addToShop.mutate(product.id, { onSuccess: () => toast.success(`Added to My Shop!`) });
                          }
                        }}
                      >
                        {shopItemIds.includes(product.id) ? <><Check className="h-3 w-3 mr-1" /> In Shop</> : <><Store className="h-3 w-3 mr-1" /> Add to Shop</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 border-border/50 hover:bg-secondary transition-colors"
                        onClick={(e) => getLink(e, product)}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
