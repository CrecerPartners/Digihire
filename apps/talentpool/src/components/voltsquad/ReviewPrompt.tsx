import { useState } from "react";
import { Card, CardContent } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { Textarea } from "@digihire/shared";
import { useSubmitReview } from "@digihire/shared";
import { Star, Send, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className="cursor-pointer transition-colors" style={{ width: 24, height: 24 }}
          fill={i <= value ? "hsl(var(--primary))" : "transparent"}
          stroke={i <= value ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
          onClick={() => onChange(i)} />
      ))}
    </div>
  );
}

export function ReviewPrompt({ productIds }: { productIds: string[] }) {
  const submitReview = useSubmitReview();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (productIds.length === 0 || submitted) return null;

  const handleSubmit = async () => {
    if (!rating) { toast.error("Please select a rating"); return; }
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    try {
      await submitReview.mutateAsync({
        product_id: productIds[currentIdx],
        reviewer_name: name.trim(),
        rating,
        comment: comment.trim(),
      });
      toast.success("Thanks for your review!");
      if (currentIdx < productIds.length - 1) {
        setCurrentIdx(i => i + 1);
        setRating(0); setComment("");
      } else {
        setSubmitted(true);
      }
    } catch { toast.error("Failed to submit"); }
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5 space-y-3 text-center">
        <CheckCircle className="h-8 w-8 text-primary mx-auto" />
        <p className="text-sm font-semibold">How was your purchase?</p>
        <p className="text-xs text-muted-foreground">Leave a quick review to help other buyers</p>
        <StarRating value={rating} onChange={setRating} />
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="bg-secondary border-border" />
        <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Comment (optional)" className="bg-secondary border-border resize-none" rows={2} />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSubmit} disabled={submitReview.isPending} className="volt-gradient flex-1">
            {submitReview.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
            Submit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSubmitted(true)}>Skip</Button>
        </div>
      </CardContent>
    </Card>
  );
}
