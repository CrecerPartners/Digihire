import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useProduct } from "@digihire/shared";
import { useCart } from "@digihire/shared";
import { useProducts } from "@digihire/shared";
import { useProfile } from "@digihire/shared";
import { useAuth } from "@digihire/shared";
import { useMyShopItems, useAddToShop, useRemoveFromShop } from "@/hooks/voltsquad/useSellerShop";
import { formatNaira } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Card, CardContent } from "@digihire/shared";
import { AspectRatio } from "@digihire/shared";
import { ImageLightbox } from "@/components/voltsquad/ImageLightbox";
import { SharePopover } from "@/components/voltsquad/SharePopover";
import { shareContent, canNativeShare, copyToClipboard } from "@digihire/shared";
import { supabase } from "@digihire/shared";
import {
  Link2, Share2, Lightbulb, Copy, MessageCircle, Instagram, Twitter,
  ChevronLeft, Loader2, ShoppingCart, ExternalLink, Store, Check, Download, UserSearch,
  Truck, RotateCcw, ShieldCheck, Star
} from "lucide-react";
import { ReviewSection } from "@/components/voltsquad/ReviewSection";
import { useProductRatingStats } from "@digihire/shared";
import { toast } from "sonner";

const categoryColors: Record<string, string> = {
  gadgets: "bg-primary/10 text-primary border-primary/20",
  telco: "bg-success/10 text-success border-success/20",
  fintech: "bg-warning/10 text-warning border-warning/20",
  events: "bg-destructive/10 text-destructive border-destructive/20",
  fashion: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  courses: "bg-violet-500/10 text-violet-500 border-violet-500/20",
};

const productTypeBadge: Record<string, { label: string; className: string }> = {
  physical: { label: "Physical", className: "bg-muted text-muted-foreground" },
  digital: { label: "Digital", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  lead: { label: "Sign-Up Offer", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  lead_url: { label: "Sign-Up Offer", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};

function getCommissionLabel(product: { commissionRate: number; commissionModel: string; productType: string }) {
  if (product.commissionModel === "percentage") return `${product.commissionRate}% commission`;
  if (product.commissionModel === "fixed") return `${formatNaira(product.commissionRate)} per sale`;
  if (product.commissionModel === "per_signup") return `${formatNaira(product.commissionRate)} per sign-up`;
  if (product.commissionModel === "per_install") return `${formatNaira(product.commissionRate)} per install`;
  return `${product.commissionRate}% commission`;
}

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  const { user } = useAuth();

  const { data: product, isLoading, error } = useProduct(slug);
  const { data: products = [] } = useProducts();
  const { data: profile } = useProfile();
  const { addItem } = useCart();
  const { data: shopItemIds = [] } = useMyShopItems();
  const addToShop = useAddToShop();
  const removeFromShop = useRemoveFromShop();

  const [activeThumb, setActiveThumb] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [sellerInfo, setSellerInfo] = useState<{ shopSlug: string; shopName: string } | null>(null);
  const { avg: reviewAvg, count: reviewCount } = useProductRatingStats(product?.id);

  const isSeller = !!user;
  const isBuyerWithRef = !isSeller && !!refCode;
  const isDirectVisitor = !isSeller && !refCode;

  const userRefCode = profile?.referral_code || refCode || "VOLT";
  const referralLink = product ? `${window.location.origin}/product/${product.slug}?ref=${userRefCode}` : "";

  useEffect(() => {
    if (refCode) {
      localStorage.setItem("volt_ref_code", refCode);
    }
  }, [refCode]);

  useEffect(() => {
    if (!refCode) return;
    const fetchSellerByRef = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("shop_slug, shop_name, name")
        .eq("referral_code", refCode)
        .limit(1);
      if (data && data.length > 0 && data[0].shop_slug) {
        setSellerInfo({ shopSlug: data[0].shop_slug, shopName: data[0].shop_name || data[0].name || "Shop" });
      }
    };
    fetchSellerByRef();
  }, [refCode]);

  const [sellerProducts, setSellerProducts] = useState<string[]>([]);
  useEffect(() => {
    if (!product) return;
    const fetchSellerProducts = async () => {
      const { data: shopEntries } = await supabase
        .from("seller_shop_items" as any)
        .select("user_id")
        .eq("product_id", product.id)
        .limit(1);
      if (shopEntries && shopEntries.length > 0) {
        const sellerId = (shopEntries[0] as any).user_id;
        const { data: sellerItems } = await supabase
          .from("seller_shop_items" as any)
          .select("product_id")
          .eq("user_id", sellerId);
        if (sellerItems) {
          setSellerProducts((sellerItems as any[]).map(i => i.product_id).filter((id: string) => id !== product.id));
        }
      }
    };
    fetchSellerProducts();
  }, [product?.id]);

  const related = sellerProducts.length > 0
    ? products.filter(p => sellerProducts.includes(p.id)).slice(0, 4)
    : products.filter(p => product && p.category === product.category && p.id !== product.id).slice(0, 4);
  const relatedTitle = sellerProducts.length > 0 ? "More from this Seller" : "Similar Products";

  const handleLeadClick = async () => {
    if (!product) return;
    const fulfillmentUrl = product.assets?.fulfillment_url;
    if (!fulfillmentUrl) {
      toast.error("Sign-up link not available for this product");
      return;
    }
    setLeadLoading(true);
    try {
      if (user) {
        await supabase
          .from("sales" as any)
          .insert({
            user_id: user.id,
            product_id: product.id,
            date: new Date().toISOString().split("T")[0],
            customer: "Lead click",
            quantity: 1,
            amount: 0,
            commission: 0,
            status: "pending",
            conversion_status: "clicked",
          } as any);
      }
      if (!user && refCode) {
        supabase.functions.invoke("log-lead-click", {
          body: { product_id: product.id, ref_code: refCode }
        }).catch(() => {});
      }
      const separator = fulfillmentUrl.includes("?") ? "&" : "?";
      const trackedUrl = `${fulfillmentUrl}${separator}ref=${userRefCode}`;
      window.open(trackedUrl, "_blank");
    } catch (err) {
      console.error("Lead tracking error:", err);
    } finally {
      setLeadLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh] text-center">
        <p className="text-lg font-semibold text-foreground">Product not found</p>
        <p className="text-sm text-muted-foreground mt-1">This product may have been removed.</p>
        <Link to="/">
          <Button variant="outline" className="mt-4">
            <ChevronLeft className="h-4 w-4 mr-1" /> Go Home
          </Button>
        </Link>
      </div>
    );
  }

  const images = product.assets?.images?.length > 0
    ? product.assets.images
    : product.image
    ? [product.image]
    : [];
  const shareText = `${product.name} — ${product.description}\n\n${referralLink}`;
  const isLead = product.delivery_type === "lead_url";
  const isDigital = product.productType === "Digital" || product.delivery_type !== "manual_provision";
  const typeBadge = productTypeBadge[product.delivery_type] || productTypeBadge[product.productType] || productTypeBadge.physical;
  const productAssets = (product.assets || {}) as Record<string, unknown>;

  const sellerName = (product.organization || product.brand || "Verified Merchant").toUpperCase();
  const sellerYears = Number(productAssets.seller_years ?? 3);
  const productQualityRate = Number(productAssets.product_quality_rate ?? 94);
  const deliveryRate = Number(productAssets.delivery_rate ?? 70);
  const sellerSalesCount = Number(productAssets.sales_count ?? Math.max(25, reviewCount * 12));

  const estimatedDelivery = String(productAssets.estimated_delivery_time ?? (isDigital ? "Instant to 24 hours" : "1 - 9 business days"));
  const returnPolicy = String(productAssets.return_policy ?? "Guaranteed 7-Day Return Policy");
  const returnPolicyUrl = String(productAssets.return_policy_url ?? "");
  const warrantyInfo = String(productAssets.warranty_info ?? "Warranty information unavailable for this item.");
  const deliveryInformation = product.delivery_instructions || String(
    productAssets.delivery_notes ??
    (isDigital
      ? "Digital fulfillment details are shared immediately after successful payment."
      : "Delivery timeline and availability may vary by location.")
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Breadcrumb — context-aware */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isSeller ? (
          <>
            <Link to="/talent/voltsquad/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
            <span>/</span>
          </>
        ) : sellerInfo ? (
          <>
            <Link to={`/s/${sellerInfo.shopSlug}`} className="hover:text-foreground transition-colors">{sellerInfo.shopName}</Link>
            <span>/</span>
          </>
        ) : (
          <>
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Image Carousel */}
        <div className="space-y-3">
          {images.length > 0 ? (
            <>
              <div
                className="rounded-2xl overflow-hidden border border-border/50 bg-muted/30 cursor-pointer"
                onClick={() => setLightboxOpen(true)}
              >
                <AspectRatio ratio={4 / 3}>
                  <img src={images[activeThumb]} alt={product.name} className="w-full h-full object-cover" />
                </AspectRatio>
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((url: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActiveThumb(i)}
                      className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all w-16 h-16 ${
                        i === activeThumb ? "border-primary ring-2 ring-primary/30" : "border-border/50 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-border/50 bg-muted/30 flex items-center justify-center aspect-[4/3]">
              <span className="text-7xl">{product.image}</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className={categoryColors[product.category] || "bg-muted text-muted-foreground"}>
                {product.category}
              </Badge>
              <Badge variant="outline" className={typeBadge.className}>
                {typeBadge.label}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">{product.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{product.brand}</p>
          </div>

          <div className="flex items-baseline gap-3">
            {product.price > 0 && (
              <span className="text-2xl font-bold text-foreground">{formatNaira(product.price)}</span>
            )}
            {isSeller && (
              <Badge className="volt-gradient text-primary-foreground text-sm px-3 py-1">
                {getCommissionLabel(product)}
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>

          <div className="space-y-3 pt-2">
            {isDirectVisitor ? (
              <div className="rounded-xl border border-border/50 bg-muted/30 p-4 text-center space-y-2">
                <UserSearch className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium text-foreground">Want to buy this product?</p>
                <p className="text-xs text-muted-foreground">Find a Volt seller to get a purchase link, or visit a seller's shop to browse and buy.</p>
              </div>
            ) : isLead ? (
              <Button className="w-full volt-gradient h-12 text-base" onClick={handleLeadClick} disabled={leadLoading}>
                {leadLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ExternalLink className="h-5 w-5 mr-2" />}
                Sign Up Now
              </Button>
            ) : (
              <Button
                className="w-full volt-gradient h-12 text-base"
                onClick={() => {
                  addItem({
                    productId: product.id,
                    name: product.name,
                    slug: product.slug,
                    image: product.image,
                    imageUrl: product.assets?.images?.[0],
                    price: product.price,
                    commissionRate: product.commissionRate,
                  });
                  toast.success(`${product.name} added to cart!`);
                }}
              >
                <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart — {formatNaira(product.price)}
              </Button>
            )}

            {isSeller && (
              <>
                <Button variant="outline" className="w-full h-10" onClick={() => copyToClipboard(referralLink, "Share link")}>
                  <Link2 className="h-4 w-4 mr-2" /> Copy My Share Link
                </Button>
                {canNativeShare() ? (
                  <Button variant="outline" className="w-full h-10" onClick={() => shareContent(product.name, shareText, referralLink)}>
                    <Share2 className="h-4 w-4 mr-2" /> Share to Earn
                  </Button>
                ) : (
                  <SharePopover
                    text={shareText}
                    url={referralLink}
                    triggerClassName="w-full h-10 border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md gap-2"
                  />
                )}
                <Button
                  variant={shopItemIds.includes(product.id) ? "secondary" : "outline"}
                  className="w-full h-10"
                  onClick={() => {
                    const inShop = shopItemIds.includes(product.id);
                    if (inShop) {
                      removeFromShop.mutate(product.id, { onSuccess: () => toast.success("Removed from My Shop") });
                    } else {
                      addToShop.mutate(product.id, { onSuccess: () => toast.success("Added to My Shop!") });
                    }
                  }}
                >
                  {shopItemIds.includes(product.id) ? <Check className="h-4 w-4 mr-2" /> : <Store className="h-4 w-4 mr-2" />}
                  {shopItemIds.includes(product.id) ? "In My Shop" : "Add to My Shop"}
                </Button>
              </>
            )}
          </div>

          {product.assets.videoUrl && (
            <Button variant="outline" className="w-full" onClick={() => window.open(product.assets.videoUrl, "_blank")}>
              <ExternalLink className="h-4 w-4 mr-2" /> Watch Promo Video
            </Button>
          )}

          {isSeller && (
            <>
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-semibold text-foreground">Ready-made Captions</h3>
                <CaptionCard icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" text={product.assets.whatsappMessage} link={referralLink} productName={product.name} />
                <CaptionCard icon={<Instagram className="h-4 w-4" />} label="Instagram" text={product.assets.instagramCaption} link={referralLink} productName={product.name} />
                <CaptionCard icon={<Twitter className="h-4 w-4" />} label="Twitter / X" text={product.assets.twitterCaption} link={referralLink} productName={product.name} />
              </div>

              {product.assets.sellingTips?.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-warning" /> Selling Tips
                  </h3>
                  <ul className="space-y-2">
                    {product.assets.sellingTips.map((tip: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary font-bold mt-0.5">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Seller Information + Delivery/Returns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold text-lg">Seller Information</h3>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-lg">
                    {sellerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-xl leading-none text-primary">{sellerName}</p>
                    <p className="text-muted-foreground mt-1">{sellerYears} year{sellerYears === 1 ? "" : "s"} of marketplace activity</p>
                  </div>
                </div>
                {sellerInfo?.shopSlug && (
                  <Link to={`/s/${sellerInfo.shopSlug}`}>
                    <Button variant="secondary" size="sm">View Merchant Store</Button>
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Number of Sales</p>
                  <p className="text-3xl font-bold mt-1">{sellerSalesCount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Successful sales</p>
                </div>
                <div className="space-y-4">
                  <ProgressBar label="Product Quality" value={productQualityRate} />
                  <ProgressBar label="Delivery Rate" value={deliveryRate} />
                </div>
              </div>

              <div>
                <p className="text-lg font-semibold">Merchant Reviews ({reviewCount})</p>
                <p className="text-4xl font-bold leading-tight mt-1">{reviewAvg || 0}/5</p>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(reviewAvg || 0) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/40"}`} />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold text-lg">Delivery & Returns</h3>
            </div>
            <div className="divide-y">
              <div className="p-5 space-y-2">
                <div className="flex items-center gap-2 font-semibold"><Truck className="h-4 w-4 text-primary" /> Delivery</div>
                <p className="text-sm text-muted-foreground">Estimated delivery time {estimatedDelivery}</p>
                <p className="text-sm text-foreground">{deliveryInformation}</p>
              </div>
              <div className="p-5 space-y-2">
                <div className="flex items-center gap-2 font-semibold"><RotateCcw className="h-4 w-4 text-primary" /> Return Policy</div>
                <p className="font-semibold">{returnPolicy}</p>
                {returnPolicyUrl ? (
                  <a href={returnPolicyUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    View return policy details
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">Contact seller support for return details where applicable.</p>
                )}
              </div>
              <div className="p-5 space-y-2">
                <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Warranty</div>
                <p className="text-sm text-muted-foreground">{warrantyInfo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ReviewSection productId={product.id} />

      {isSeller && images.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" /> Media Kit
            </h3>
            <p className="text-xs text-muted-foreground">Download product images and copy descriptions for your social posts.</p>
            <div className="flex flex-wrap gap-2">
              {images.map((url: string, i: number) => (
                <a key={i} href={url} download={`${product.slug}-${i + 1}.jpg`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="text-xs h-7">
                    <Download className="h-3 w-3 mr-1" /> Image {i + 1}
                  </Button>
                </a>
              ))}
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                const kit = `${product.name}\n${product.description}\n\nPrice: ₦${product.price}\n\n${referralLink}`;
                navigator.clipboard.writeText(kit);
                toast.success("Media kit text copied!");
              }}>
                <Copy className="h-3 w-3 mr-1" /> Copy All Text
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {related.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-bold font-display text-foreground">{relatedTitle}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {related.map(p => (
              <Link key={p.id} to={`/product/${p.slug}${refCode ? `?ref=${refCode}` : ""}`}>
                <Card className="border-border/50 group hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden">
                  <div className="overflow-hidden">
                    <AspectRatio ratio={4 / 3}>
                      {p.assets?.images?.length > 0 ? (
                        <img src={p.assets.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center"><span className="text-muted-foreground text-xs">No image</span></div>
                      )}
                    </AspectRatio>
                  </div>
                  <CardContent className="p-3 space-y-1">
                    <h3 className="font-semibold text-sm leading-tight truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.brand}</p>
                    {isSeller ? (
                      <p className="text-sm font-bold text-primary">{getCommissionLabel(p)}</p>
                    ) : (
                      <p className="text-sm font-bold text-foreground">{formatNaira(p.price)}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {images.length > 0 && (
        <ImageLightbox
          images={images}
          initialIndex={activeThumb}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          productName={product.name}
          referralLink={referralLink}
        />
      )}
    </div>
  );
};

function CaptionCard({ icon, label, text, link, productName }: {
  icon: React.ReactNode; label: string; text: string; link: string; productName: string;
}) {
  const full = `${text}\n\n${link}`;
  return (
    <div className="rounded-xl border border-border/50 p-3 space-y-2 bg-card">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">{icon} {label}</div>
      <p className="text-xs text-foreground line-clamp-3">{text}</p>
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => copyToClipboard(full, `${label} caption`)}>
          <Copy className="h-3 w-3 mr-1" /> Copy
        </Button>
        {canNativeShare() ? (
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => shareContent(productName, full, link)}>
            <Share2 className="h-3 w-3" />
          </Button>
        ) : (
          <SharePopover text={full} url={link} triggerClassName="text-xs h-7 border border-input bg-background hover:bg-accent rounded-md px-2 inline-flex items-center" />
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}:</p>
      <div className="h-4 rounded-sm bg-muted overflow-hidden relative">
        <div className="h-full bg-primary/80" style={{ width: `${clamped}%` }} />
        <span className="absolute inset-0 text-[11px] font-semibold text-primary-foreground flex items-center justify-center">
          {clamped}%
        </span>
      </div>
    </div>
  );
}

export default ProductPage;
