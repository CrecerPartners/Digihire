import { Button } from "@digihire/shared";
import { Popover, PopoverContent, PopoverTrigger } from "@digihire/shared";
import { Share2, Copy, MessageCircle } from "lucide-react";
import { shareToWhatsApp, shareToTwitter, shareToTelegram, shareToTikTok, shareToSnapchat, copyToClipboard } from "@digihire/shared";

interface SharePopoverProps {
  text: string;
  url: string;
  triggerClassName?: string;
}

export function SharePopover({ text, url, triggerClassName }: SharePopoverProps) {
  const socials = [
    { icon: MessageCircle, label: "WhatsApp", action: () => shareToWhatsApp(text), color: "text-green-500" },
    { icon: () => <span className="text-sm font-bold">𝕏</span>, label: "Twitter/X", action: () => shareToTwitter(text, url), color: "text-foreground" },
    { icon: () => <span className="text-sm font-bold">T</span>, label: "Telegram", action: () => shareToTelegram(text, url), color: "text-blue-400" },
    { icon: () => <span className="text-sm font-bold">tk</span>, label: "TikTok", action: () => shareToTikTok(text), color: "text-foreground" },
    { icon: () => <span className="text-sm font-bold">👻</span>, label: "Snapchat", action: () => shareToSnapchat(url), color: "text-yellow-400" },
    { icon: Copy, label: "Copy", action: () => copyToClipboard(text, "Content"), color: "text-muted-foreground" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className={triggerClassName || "h-9 w-9 text-white hover:bg-white/20"}>
          <Share2 className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="end">
        <div className="flex items-center gap-1">
          {socials.map((s) => (
            <Button key={s.label} size="icon" variant="ghost" className={`h-9 w-9 ${s.color}`} onClick={s.action} title={s.label}>
              {typeof s.icon === "function" && s.icon.length === 0 ? (
                <s.icon />
              ) : (
                <s.icon className="h-4 w-4" />
              )}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
