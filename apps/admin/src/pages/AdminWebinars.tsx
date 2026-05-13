import { useState, useEffect } from "react";
import { supabase as _supabase } from "@digihire/shared";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Button, Input, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, toast, Card, CardContent, CardHeader, CardTitle } from "@digihire/shared";
import { Plus, Pencil, Trash2, Users, Calendar, Clock, Link2, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

const emptyForm = {
  title: "",
  description: "",
  host_name: "",
  host_title: "",
  scheduled_at: "",
  duration_minutes: 60,
  meeting_url: "",
  cover_color: "#7c3aed",
  category: "Sales Skills",
  max_registrations: null as number | null,
  is_published: false,
};

function useAdminWebinars() {
  return useQuery({
    queryKey: ["admin-webinars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talent_webinars")
        .select("*")
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

function useUpsertWebinar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: Record<string, unknown>) => {
      const { error } = await supabase.from("talent_webinars").upsert(form as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-webinars"] }),
  });
}

function useDeleteWebinar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("talent_webinars").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-webinars"] }),
  });
}

function useWebinarRegistrationCount(webinarId: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    supabase
      .from("talent_webinar_registrations")
      .select("id", { count: "exact", head: true })
      .eq("webinar_id", webinarId)
      .then(({ count: c }: { count: number }) => setCount(c ?? 0));
  }, [webinarId]);
  return count;
}

export default function AdminWebinars() {
  const { data: webinars, isLoading } = useAdminWebinars();
  const upsert = useUpsertWebinar();
  const remove = useDeleteWebinar();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>(emptyForm);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    const payload: Record<string, any> = { ...form };
    if (!payload.max_registrations) delete payload.max_registrations;
    upsert.mutate(payload, {
      onSuccess: () => { toast({ title: "Session saved" }); setOpen(false); },
      onError: (e) => toast({ title: "Error", description: (e as Error).message, variant: "destructive" }),
    });
  };

  const togglePublish = (webinar: any) => {
    upsert.mutate({ ...webinar, is_published: !webinar.is_published }, {
      onSuccess: () => toast({ title: webinar.is_published ? "Unpublished" : "Published" }),
    });
  };

  const isPast = (iso: string) => new Date(iso) < new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Webinars & Live Sessions</h2>
          <p className="text-muted-foreground text-sm">Schedule and manage live training events for the talent pool.</p>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Schedule Session
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {webinars?.map((w: any) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <Card className={isPast(w.scheduled_at) ? "opacity-60" : ""}>
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="h-10 w-1.5 rounded-full flex-shrink-0"
                          style={{ background: w.cover_color }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base truncate">{w.title}</CardTitle>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${w.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {w.is_published ? 'PUBLISHED' : 'DRAFT'}
                            </span>
                            {isPast(w.scheduled_at) && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">PAST</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(w.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {' · '}
                              {new Date(w.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {w.duration_minutes} min</span>
                            {w.host_name && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {w.host_name}</span>}
                            <RegistrationBadge webinarId={w.id} max={w.max_registrations} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePublish(w)}
                          className="text-xs"
                        >
                          {w.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {w.is_published ? 'Unpublish' : 'Publish'}
                        </Button>
                        {w.meeting_url && (
                          <a href={w.meeting_url} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="icon" title="Open meeting link">
                              <Link2 className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => { setForm({ ...w }); setOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { if (confirm("Delete this session?")) remove.mutate(w.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {w.description && (
                    <CardContent className="pt-0 pb-4">
                      <p className="text-xs text-muted-foreground line-clamp-2">{w.description}</p>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {(!webinars || webinars.length === 0) && (
            <div className="text-center py-16 border border-dashed rounded-xl text-muted-foreground">
              No sessions scheduled yet. Click "Schedule Session" to add one.
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Session" : "Schedule New Session"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Input placeholder="Session Title" value={form.title} onChange={(e: any) => set("title", e.target.value)} />
            <Textarea placeholder="Description" value={form.description} onChange={(e: any) => set("description", e.target.value)} rows={3} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at ? form.scheduled_at.slice(0, 16) : ''}
                  onChange={(e) => set("scheduled_at", new Date(e.target.value).toISOString())}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Input
                type="number"
                placeholder="Duration (minutes)"
                value={form.duration_minutes}
                onChange={(e: any) => set("duration_minutes", +e.target.value)}
                label="Duration (min)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Host Name" value={form.host_name} onChange={(e: any) => set("host_name", e.target.value)} />
              <Input placeholder="Host Title / Role" value={form.host_title} onChange={(e: any) => set("host_title", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Category (e.g. SaaS Sales)" value={form.category} onChange={(e: any) => set("category", e.target.value)} />
              <Input
                type="number"
                placeholder="Max Registrations (optional)"
                value={form.max_registrations ?? ''}
                onChange={(e: any) => set("max_registrations", e.target.value ? +e.target.value : null)}
              />
            </div>

            <Input placeholder="Meeting / Zoom / Google Meet URL" value={form.meeting_url} onChange={(e: any) => set("meeting_url", e.target.value)} />

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Session Colour</label>
                <input
                  type="color"
                  value={form.cover_color}
                  onChange={(e) => set("cover_color", e.target.value)}
                  className="h-8 w-10 rounded border cursor-pointer"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => set("is_published", e.target.checked)}
                />
                Publish immediately
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving..." : "Save Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RegistrationBadge({ webinarId, max }: { webinarId: string; max: number | null }) {
  const count = useWebinarRegistrationCount(webinarId);
  return (
    <span className="flex items-center gap-1">
      <Users className="h-3.5 w-3.5" />
      {count} registered{max ? ` / ${max}` : ''}
    </span>
  );
}
