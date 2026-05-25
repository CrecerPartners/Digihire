import { useState, useEffect } from "react";
import { supabase } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { Label } from "@digihire/shared";
import { Textarea } from "@digihire/shared";
import { Card, CardContent } from "@digihire/shared";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@digihire/shared";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@digihire/shared";
import { Plus, Pencil, Trash2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  cover_image: string;
  excerpt: string;
  content: string;
  status: string;
  reading_time: number;
  published_at: string | null;
  created_at: string;
}

const emptyForm: Omit<BlogPost, "id" | "created_at"> = {
  title: "",
  slug: "",
  category: "",
  cover_image: "",
  excerpt: "",
  content: "",
  status: "draft",
  reading_time: 5,
  published_at: null,
};

const CATEGORIES = [
  "Sales Strategy",
  "Recruitment",
  "Activations",
  "Talent Growth",
  "Future of Work",
  "Digihire Updates",
  "Sales",
  "Campaigns",
];

const statusColors: Record<string, string> = {
  published: "text-success border-success/20",
  draft: "text-muted-foreground border-border/50",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [slugManual, setSlugManual] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (!error) setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const openCreate = () => {
    setEditPost(null);
    setForm(emptyForm);
    setSlugManual(false);
    setFormOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      category: post.category || "",
      cover_image: post.cover_image || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      status: post.status,
      reading_time: post.reading_time || 5,
      published_at: post.published_at ? post.published_at.slice(0, 16) : null,
    });
    setSlugManual(true);
    setFormOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setForm(f => ({
      ...f,
      title,
      slug: slugManual ? f.slug : slugify(title),
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }
    setSaving(true);

    const payload = {
      ...form,
      published_at: form.status === "published"
        ? (form.published_at || new Date().toISOString())
        : null,
    };

    try {
      if (editPost) {
        const { error } = await (supabase as any)
          .from("blog_posts")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editPost.id);
        if (error) throw error;
        toast.success("Post updated");
      } else {
        const { error } = await (supabase as any)
          .from("blog_posts")
          .insert(payload);
        if (error) throw error;
        toast.success("Post created");
      }
      setFormOpen(false);
      fetchPosts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from("blog_posts").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
    } else {
      toast.success("Post deleted");
      fetchPosts();
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-NG", { dateStyle: "medium" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Blog CMS</h1>
          <p className="text-muted-foreground mt-1">Create and manage blog posts for the landing site</p>
        </div>
        <Button className="volt-gradient" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Post
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Read Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                    No posts yet. Create the first one.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id} className="border-border/50">
                    <TableCell className="font-medium max-w-[280px]">
                      <div className="truncate">{post.title}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">/{post.slug}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{post.category || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(post.published_at)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{post.reading_time} min</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${statusColors[post.status] || ""}`}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => {
                            const landingUrl = import.meta.env.VITE_LANDING_URL || 
                              (window.location.hostname === "localhost" ? "http://localhost:8080" : "https://digihire.io");
                            window.open(`${landingUrl}/blog-post.html?slug=${post.slug}`, "_blank");
                          }}
                          title="Preview"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(post)} title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(post.id)} title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPost ? "Edit Post" : "New Blog Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Post title"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug *</Label>
              <Input
                value={form.slug}
                onChange={e => { setSlugManual(true); setForm(f => ({ ...f, slug: e.target.value })); }}
                placeholder="url-friendly-slug"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Used in the URL: blog-post.html?slug=<span className="font-mono">{form.slug || "your-slug"}</span></p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Reading Time (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={form.reading_time}
                  onChange={e => setForm(f => ({ ...f, reading_time: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Publish Date</Label>
                <Input
                  type="datetime-local"
                  value={form.published_at || ""}
                  onChange={e => setForm(f => ({ ...f, published_at: e.target.value || null }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cover Image URL</Label>
              <Input
                value={form.cover_image}
                onChange={e => setForm(f => ({ ...f, cover_image: e.target.value }))}
                placeholder="https://images.unsplash.com/..."
              />
              {form.cover_image && (
                <img
                  src={form.cover_image}
                  alt="Cover preview"
                  className="w-full h-32 object-cover rounded-md mt-1.5 border border-border/50"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Excerpt</Label>
              <Textarea
                value={form.excerpt}
                onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                placeholder="A short description shown in cards and previews..."
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Full article content (supports plain text or basic HTML like <h2>, <p>, <strong>, <ul>)..."
                rows={14}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Supports basic HTML: &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;blockquote&gt;</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button className="volt-gradient" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editPost ? "Save Changes" : "Create Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
