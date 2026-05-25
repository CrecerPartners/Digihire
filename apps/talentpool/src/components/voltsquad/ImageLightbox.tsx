import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { ChevronLeft, ChevronRight, X, Share2 } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { shareContent, canNativeShare } from "@digihire/shared";
import { SharePopover } from "@/components/voltsquad/SharePopover";
import { useModalBackHandler } from "@/hooks/voltsquad/useModalBackHandler";

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  referralLink: string;
}

export function ImageLightbox({ images, initialIndex, open, onOpenChange, productName, referralLink }: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);
  useModalBackHandler(open, handleClose);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const prev = useCallback(() => setIndex((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length]);
  const next = useCallback(() => setIndex((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, prev, next, onOpenChange]);

  const handleShare = () => {
    const text = `Check out ${productName}!`;
    if (canNativeShare()) {
      shareContent(productName, text, referralLink);
    }
  };

  const shareText = `Check out ${productName}!\n${referralLink}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen p-0 border-none bg-black/95 [&>button]:hidden">
        <VisuallyHidden><DialogTitle>Image viewer</DialogTitle></VisuallyHidden>

        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
          <span className="text-white/80 text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
            {index + 1} / {images.length}
          </span>
          <div className="flex items-center gap-2">
            {canNativeShare() ? (
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 h-9 w-9" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
            ) : (
              <SharePopover text={shareText} url={referralLink} />
            )}
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 h-10 w-10 rounded-full bg-white/10" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div
          className="flex items-center justify-center w-full h-full px-4 md:px-16"
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as any)._touchStartX = touch.clientX;
          }}
          onTouchEnd={(e) => {
            const startX = (e.currentTarget as any)._touchStartX;
            if (startX == null) return;
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            if (Math.abs(diff) > 50) {
              if (diff > 0) next();
              else prev();
            }
          }}
        >
          <img
            src={images[index]}
            alt={`${productName} ${index + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        </div>

        {images.length > 1 && (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 bg-white/10 h-11 w-11 rounded-full"
              onClick={prev}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 bg-white/10 h-11 w-11 rounded-full"
              onClick={next}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
