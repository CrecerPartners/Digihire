import { useState } from "react";
import { Card, CardContent } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { Textarea } from "@digihire/shared";
import { useReviews, useSubmitReview, useAuth } from "@digihire/shared";
import { Star, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

function StarRating({ value, onChange, readonly = false, size = 16 }: { value: number; onChange?: (v: number) => void; readonly?: boolean; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${readonly ? "" : "cursor-pointer"} transition-colors`}
          style={{ width: size, height: size }}
          fill={i <= value ? "hsl(var(--primary))" : "transparent"}
          stroke={i <= value ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
          onClick={() => !readonly && onChange?.(i)}
        />
      ))}
    </div>
  );
}

export function ReviewSection({ productId }: { productId: string }) {
  const { data: reviews = [], isLoading } = useReviews(productId);
  const submitReview = useSubmitReview();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const handleSubmit = async () => {
    if (!rating) { toast.error("Please select a rating"); return; }
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    try {
      await submitReview.mutateAsync({ product_id: productId, reviewer_name: name.trim(), rating, comment: comment.trim() });
      toast.success("Review submitted!");
      setName(""); setRating(0); setComment("");
    } catch { toast.error("Failed to submit review"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-display font-semibold">Reviews</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating value={Math.round(avg)} readonly size={14} />
            <span className="text-sm text-muted-foreground">({avg.toFixed(1)} · {reviews.length})</span>
          </div>
        )}
      </div>

      {!user ? (
        <p className="text-sm text-muted-foreground">Please sign in to leave a review.</p>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium">Leave a review</p>
            <StarRating value={rating} onChange={setRating} />
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="bg-secondary border-border" />
            <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Write your review (optional)" className="bg-secondary border-border resize-none" rows={2} />
            <Button size="sm" onClick={handleSubmit} disabled={submitReview.isPending} className="volt-gradient">
              {submitReview.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
              Submit Review
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-2">
          {reviews.map(r => (
            <Card key={r.id} className="border-border/50">
              <CardContent className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.reviewer_name || "Anonymous"}</span>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <StarRating value={r.rating} readonly size={12} />
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
