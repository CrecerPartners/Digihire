import { useState, useCallback } from "react";
import { Product } from "@digihire/shared";
import { useProfile } from "@digihire/shared";
import { formatNaira } from "@digihire/shared";
import { useModalBackHandler } from "@/hooks/useModalBackHandler";
import { Badge } from "@digihire/shared";
import { Button } from "@digihire/shared";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@digihire/shared";
import { Copy, Link2, MessageCircle, Instagram, Lightbulb, Image, ExternalLink, Share2, Twitter, Eye } from "lucide-react";
import { toast } from "sonner";
import { ImageLightbox } from "@/components/ImageLightbox";
import { SharePopover } from "@/components/SharePopover";
import { shareContent, canNativeShare, copyToClipboard } from "@digihire/shared";

interface ProductDetailSheetProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryColors: Record<string, string> = {
  physical: "bg-warning/10 text-warning border-warning/20",
  digital: "bg-primary/10 text-primary border-primary/20",
  fintech: "bg-success/10 text-success border-success/20",
  events: "bg-destructive/10 text-destructive border-destructive/20",
};

export function ProductDetailSheet({ product, open, onOpenChange }: ProductDetailSheetProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { data: profile } = useProfile();
  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);
  useModalBackHandler(open, handleClose);

  if (!product) return null;

  const referralLink = `https://talents.digihire.io/product/${product.slug}?ref=${profile?.referral_code || "VOLT"}`;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleShare = (title: string, text: string, url?: string) => {
    if (canNativeShare()) {
      shareContent(title, text, url);
    }
  };

  const shareText = (caption: string) => `${caption}\n\n${referralLink}`;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
          <SheetHeader className="text-left pb-4">
            <div className="flex items-center gap-3">
              {product.image ? (
                <img
                  src={product.assets?.images?.[0] || product.image}
                  alt={product.name}
                  className="h-14 w-14 rounded-xl object-cover border border-border/50 shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <span className="text-muted-foreground text-xs">No img</span>
                </div>
              )}
              <div>
                <SheetTitle className="text-lg">{product.name}</SheetTitle>
                <SheetDescription>{product.brand}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-5">
            {/* Info */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={categoryColors[product.category]}>
                {product.category}
              </Badge>
              {product.price > 0 && (
                <Badge variant="secondary">{formatNaira(product.price)}</Badge>
              )}
              <Badge className="volt-gradient text-primary-foreground">
                {product.commissionRate}% commission
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">{product.description}</p>

            {/* Product Images */}
            {product.assets.images.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Image className="h-4 w-4 text-primary" /> Product Images
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {product.assets.images.map((url, i) => (
                    <div
                      key={i}
                      className="relative group rounded-xl overflow-hidden border border-border/50 cursor-pointer"
                      onClick={() => openLightbox(i)}
                    >
                      <img src={url} alt={`${product.name} ${i + 1}`} className="w-full aspect-[4/3] object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                          <Eye className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {product.assets.videoUrl && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Promo Video</h4>
                <div className="rounded-xl border border-border/50 bg-muted/30 p-6 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <ExternalLink className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Video available</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => window.open(product.assets.videoUrl, "_blank")}>
                      Watch Video
                    </Button>
                    <UniversalShareButton
                      title={product.name}
                      text={`Watch this! ${product.assets.videoUrl}\n\n${referralLink}`}
                      url={referralLink}
                      label="Share"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sales Assets */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Sales Assets</h4>

              {/* WhatsApp */}
              <AssetRow
                icon={<MessageCircle className="h-3 w-3" />}
                label="WhatsApp"
                text={product.assets.whatsappMessage}
                shareText={shareText(product.assets.whatsappMessage)}
                referralLink={referralLink}
                productName={product.name}
              />

              {/* Instagram */}
              <AssetRow
                icon={<Instagram className="h-3 w-3" />}
                label="Instagram"
                text={product.assets.instagramCaption}
                shareText={shareText(product.assets.instagramCaption)}
                referralLink={referralLink}
                productName={product.name}
              />

              {/* Twitter/X */}
              <AssetRow
                icon={<Twitter className="h-3 w-3" />}
                label="Twitter / X"
                text={product.assets.twitterCaption}
                shareText={shareText(product.assets.twitterCaption)}
                referralLink={referralLink}
                productName={product.name}
              />
            </div>

            {/* Selling Tips */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warning" /> Selling Tips
              </h4>
              <ul className="space-y-1.5">
                {product.assets.sellingTips.map((tip, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <Button className="w-full volt-gradient" onClick={() => copyToClipboard(referralLink, "Referral link")}>
                <Link2 className="h-4 w-4 mr-2" /> Get Referral Link
              </Button>
              <UniversalShareButton
                title={product.name}
                text={`${product.name} — ${product.description}\n\n${referralLink}`}
                url={referralLink}
                label="Share Product"
                fullWidth
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ImageLightbox
        images={product.assets.images}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        productName={product.name}
        referralLink={referralLink}
      />
    </>
  );
}

/* Sub-components */

function AssetRow({ icon, label, text, shareText, referralLink, productName }: {
  icon: React.ReactNode;
  label: string;
  text: string;
  shareText: string;
  referralLink: string;
  productName: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon} {label}
      </div>
      <p className="text-xs text-foreground line-clamp-3">{text}</p>
      <div className="flex gap-1.5">
        <UniversalShareButton
          title={productName}
          text={shareText}
          url={referralLink}
          label="Share"
          className="flex-1"
        />
        <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => copyToClipboard(shareText, `${label} caption`)}>
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function UniversalShareButton({ title, text, url, label, fullWidth, className }: {
  title: string;
  text: string;
  url: string;
  label: string;
  fullWidth?: boolean;
  className?: string;
}) {
  if (canNativeShare()) {
    return (
      <Button
        size="sm"
        variant={fullWidth ? "outline" : "outline"}
        className={`text-xs h-7 ${fullWidth ? "w-full" : ""} ${className || ""}`}
        onClick={() => shareContent(title, text, url)}
      >
        <Share2 className="h-3 w-3 mr-1" /> {label}
      </Button>
    );
  }

  return (
    <SharePopover
      text={text}
      url={url}
      triggerClassName={`text-xs h-7 border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md px-3 gap-1 ${fullWidth ? "w-full" : ""} ${className || ""}`}
    />
  );
}


