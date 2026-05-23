import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { Clipboard } from "@capacitor/clipboard";

export async function shareContent(title: string, text: string, url?: string) {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      await Share.share({
        title,
        text,
        url,
        dialogTitle: 'Share with buddies',
      });
      return true;
    } catch (e) {
      console.error("Native share failed", e);
      await copyToClipboard(text + (url ? "\n" + url : ""), "Content");
      return false;
    }
  }

  const shareData: ShareData = { title, text };
  if (url) shareData.url = url;

  if (navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        await copyToClipboard(text + (url ? "\n" + url : ""), "Content");
      }
      return false;
    }
  }
  // Fallback
  await copyToClipboard(text + (url ? "\n" + url : ""), "Content");
  return false;
}

export function shareToWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}

export function shareToTwitter(text: string, url?: string) {
  const params = new URLSearchParams({ text });
  if (url) params.set("url", url);
  window.open(`https://twitter.com/intent/tweet?${params.toString()}`, "_blank", "noopener,noreferrer");
}

export function shareToTelegram(text: string, url?: string) {
  const fullText = url ? `${text}\n${url}` : text;
  window.open(`https://t.me/share/url?url=${encodeURIComponent(url || "")}&text=${encodeURIComponent(fullText)}`, "_blank", "noopener,noreferrer");
}

export function shareToTikTok(text: string) {
  // TikTok doesn't have a direct share URL; open the app/site with copied text
  navigator.clipboard.writeText(text);
  window.open("https://www.tiktok.com/upload", "_blank", "noopener,noreferrer");
}

export function shareToSnapchat(url: string) {
  window.open(`https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
}

export async function copyToClipboard(text: string, label: string) {
  const isNative = Capacitor.isNativePlatform();
  if (isNative) {
    await Clipboard.write({ string: text });
  } else {
    await navigator.clipboard.writeText(text);
  }
  toast.success(`${label} copied!`);
}

export function canNativeShare() {
  const isNative = Capacitor.isNativePlatform();
  if (isNative) return true;
  return typeof navigator.share === "function";
}
