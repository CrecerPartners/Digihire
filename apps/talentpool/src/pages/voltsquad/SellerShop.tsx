import { useParams, Link } from "react-router-dom";
import { usePublicSellerShop } from "@/hooks/voltsquad/useSellerShop";
import { useCart } from "@digihire/shared";
import { formatNaira } from "@digihire/shared";
import { Avatar, AvatarImage, AvatarFallback } from "@digihire/shared";
import { Card, CardContent } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { AspectRatio } from "@digihire/shared";
import { Loader2, ShoppingCart, PackageOpen, Store, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ReviewSection } from "@/components/voltsquad/ReviewSection";

const SellerShop = () => {
  const { shopSlug } = useParams<{ shopSlug: string }>();
  const { seller, products, isLoading, error } = usePublicSellerShop(shopSlug);
  const { addItem } = useCart();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh] text-center">
        <Store className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <p className="text-lg font-semibold text-foreground">Shop not found</p>
        <p className="text-sm text-muted-foreground mt-1">This shop may not exist yet.</p>
        <Link to="/">
          <Button variant="outline" className="mt-4">Go Home</Button>
        </Link>
      </div>
    );
  }

  const initials = (seller.name || "").split(" ").map((n: string) => n[0]).join("").toUpperCase() || "?";
  const displayName = seller.shop_name || seller.name || "Seller";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col items-center text-center space-y-3 pt-4">
        {seller.shop_logo_url ? (
          <img src={seller.shop_logo_url} alt={displayName} className="h-20 w-20 rounded-xl object-cover border border-border" />
        ) : (
          <Avatar className="h-20 w-20 text-3xl">
            {seller.avatar_url ? <AvatarImage src={seller.avatar_url} alt={seller.name} /> : null}
            <AvatarFallback className="bg-primary/20 text-primary font-bold font-display text-3xl">{initials}</AvatarFallback>
          </Avatar>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display flex items-center justify-center gap-2">
            {displayName}
            {seller.verification_status === "verified" && <ShieldCheck className="h-5 w-5 text-primary" />}
          </h1>
          {seller.bio && <p className="text-muted-foreground mt-1 max-w-md mx-auto">{seller.bio}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Store className="h-3 w-3 mr-1" /> {products.length} product{products.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-display font-semibold mb-4">Shop {displayName}'s Picks</h2>
      </div>
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PackageOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">{displayName} hasn't added products yet</p>
          <p className="text-xs text-muted-foreground mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product: any) => {
            const images = product.assets?.images || [];
            return (
              <Link key={product.id} to={`/product/${product.slug}?ref=${seller.referral_code || "VOLT"}`} className="block">
                <Card className="border-border/50 group hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full">
                  <div className="relative overflow-hidden">
                    <AspectRatio ratio={4 / 3}>
                      {images.length > 0 ? (
                        <img src={images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-xs">No image</span>
                        </div>
                      )}
                    </AspectRatio>
                  </div>
                  <CardContent className="p-4 space-y-2.5">
                    <div>
                      <h3 className="font-semibold text-sm leading-tight line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">{product.description}</p>
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-sm font-bold text-foreground">{formatNaira(product.price)}</p>
                      <Button size="sm" onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem({
                          productId: product.id,
                          name: product.name,
                          slug: product.slug,
                          image: product.image,
                          imageUrl: images[0],
                          price: product.price,
                          commissionRate: product.commission_rate,
                        });
                        toast.success(`${product.name} added to cart!`);
                      }} className="volt-gradient text-xs h-8 px-3">
                        <ShoppingCart className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerShop;
