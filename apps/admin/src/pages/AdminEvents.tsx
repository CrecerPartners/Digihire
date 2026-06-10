import { useState, useEffect } from "react";
import { supabase } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { Label } from "@digihire/shared";
import { Textarea, RichTextEditor } from "@digihire/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@digihire/shared";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@digihire/shared";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@digihire/shared";
import { Plus, Pencil, Users, Loader2, CalendarDays, Trash2, Download, MessageSquare, Image, Link2, X } from "lucide-react";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  description?: string;
  event_type?: string;
  location?: string;
  meeting_url?: string;
  event_date?: string;
  end_date?: string;
  capacity?: number;
  registration_deadline?: string;
  status: string;
  banner_url?: string;
  gallery?: string[];
  created_at: string;
}

interface Registration {
  id: string;
  talent_id: string;
  full_name?: string;
  email?: string;
  status: string;
  registered_at: string;
  followup_notes?: string;
}

const emptyForm: Omit<Event, "id" | "created_at"> = {
  title: "",
  description: "",
  event_type: "",
  location: "",
  meeting_url: "",
  event_date: "",
  end_date: "",
  capacity: undefined,
  registration_deadline: "",
  status: "upcoming",
  banner_url: "",
  gallery: [],
};

const statusColors: Record<string, string> = {
  upcoming: "text-primary border-primary/20",
  live: "text-success border-success/20",
  past: "text-muted-foreground border-border/50",
};

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [galleryInput, setGalleryInput] = useState("");
  const [regsEvent, setRegsEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regsLoading, setRegsLoading] = useState(false);
  const [followupNotes, setFollowupNotes] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });
    if (!error) setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const openCreate = () => {
    setEditEvent(null);
    setForm(emptyForm);
    setGalleryInput("");
    setFormOpen(true);
  };

  const openEdit = (event: Event) => {
    setEditEvent(event);
    setForm({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type || "",
      location: event.location || "",
      meeting_url: event.meeting_url || "",
      event_date: event.event_date ? event.event_date.slice(0, 16) : "",
      end_date: event.end_date ? event.end_date.slice(0, 16) : "",
      capacity: event.capacity,
      registration_deadline: event.registration_deadline ? event.registration_deadline.slice(0, 16) : "",
      status: event.status,
      banner_url: event.banner_url || "",
      gallery: event.gallery || [],
    });
    setGalleryInput("");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const payload = {
      ...form,
      event_date: form.event_date || null,
      end_date: form.end_date || null,
      registration_deadline: form.registration_deadline || null,
      capacity: form.capacity || null,
      banner_url: form.banner_url || null,
      meeting_url: form.meeting_url || null,
      gallery: form.gallery ?? [],
    };

    try {
      if (editEvent) {
        const { error } = await (supabase as any)
          .from("events")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editEvent.id);
        if (error) throw error;
        toast.success("Event updated");
      } else {
        const { error } = await (supabase as any)
          .from("events")
          .insert(payload);
        if (error) throw error;
        toast.success("Event created");
      }
      setFormOpen(false);
      fetchEvents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from("events").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
    } else {
      toast.success("Event deleted");
      fetchEvents();
    }
  };

  const viewRegistrations = async (event: Event) => {
    setRegsEvent(event);
    setRegsLoading(true);
    setNoteOpen(null);
    const { data } = await (supabase as any)
      .from("event_registrations")
      .select("*")
      .eq("event_id", event.id)
      .order("registered_at", { ascending: false });
    const regs: Registration[] = data || [];
    setRegistrations(regs);
    const notes: Record<string, string> = {};
    regs.forEach(r => { notes[r.id] = r.followup_notes ?? ''; });
    setFollowupNotes(notes);
    setRegsLoading(false);
  };

  const exportCSV = () => {
    if (!regsEvent || registrations.length === 0) return;
    const headers = ['Name', 'Email', 'Status', 'Registered At', 'Follow-up Notes'];
    const rows = registrations.map(r => [
      r.full_name ?? '',
      r.email ?? '',
      r.status,
      new Date(r.registered_at).toLocaleString(),
      (followupNotes[r.id] ?? r.followup_notes ?? '').replace(/,/g, ';'),
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${regsEvent.title}-registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const saveFollowupNote = async (regId: string) => {
    setSavingNote(regId);
    const { error } = await (supabase as any)
      .from('event_registrations')
      .update({ followup_notes: followupNotes[regId] || null })
      .eq('id', regId);
    if (!error) toast.success('Note saved');
    else toast.error('Failed to save note');
    setSavingNote(null);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Events</h1>
          <p className="text-muted-foreground mt-1">Create and manage events for talent</p>
        </div>
        <Button className="volt-gradient" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Event
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
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
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                    No events yet. Create the first one.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id} className="border-border/50">
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{event.event_type || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(event.event_date)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{event.location || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${statusColors[event.status] || ""}`}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => viewRegistrations(event)} title="View registrations">
                          <Users className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(event)} title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(event.id)} title="Delete">
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editEvent ? "Edit Event" : "Create Event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <RichTextEditor value={form.description || ''} onChange={html => setForm(f => ({ ...f, description: html }))} placeholder="What is this event about?" minHeight="110px" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Event Type</Label>
                <Input value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))} placeholder="e.g. Workshop, Networking" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="past">Past</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Venue or Online" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" /> Meeting / Stream URL</Label>
              <Input value={form.meeting_url} onChange={e => setForm(f => ({ ...f, meeting_url: e.target.value }))} placeholder="https://meet.google.com/..." />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Image className="h-3.5 w-3.5" /> Banner Image URL</Label>
              <Input value={form.banner_url} onChange={e => setForm(f => ({ ...f, banner_url: e.target.value }))} placeholder="https://..." />
              {form.banner_url && (
                <img src={form.banner_url} alt="Banner preview" className="mt-2 rounded-lg object-cover w-full h-32 border border-border/50" onError={e => (e.currentTarget.style.display = 'none')} />
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Image className="h-3.5 w-3.5" /> Gallery Images</Label>
              <div className="flex gap-2">
                <Input
                  value={galleryInput}
                  onChange={e => setGalleryInput(e.target.value)}
                  placeholder="Paste image URL and press Add"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const url = galleryInput.trim();
                      if (url) {
                        setForm(f => ({ ...f, gallery: [...(f.gallery ?? []), url] }));
                        setGalleryInput("");
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    const url = galleryInput.trim();
                    if (url) {
                      setForm(f => ({ ...f, gallery: [...(f.gallery ?? []), url] }));
                      setGalleryInput("");
                    }
                  }}
                >Add</Button>
              </div>
              {(form.gallery ?? []).length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(form.gallery ?? []).map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={`Gallery ${i + 1}`} className="rounded-md object-cover w-full h-20 border border-border/50" onError={e => (e.currentTarget.style.display = 'none')} />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setForm(f => ({ ...f, gallery: (f.gallery ?? []).filter((_, idx) => idx !== i) }))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date & Time</Label>
                <Input type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date & Time</Label>
                <Input type="datetime-local" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Capacity</Label>
                <Input type="number" value={form.capacity || ""} onChange={e => setForm(f => ({ ...f, capacity: e.target.value ? Number(e.target.value) : undefined }))} placeholder="Max attendees" />
              </div>
              <div className="space-y-1.5">
                <Label>Registration Deadline</Label>
                <Input type="datetime-local" value={form.registration_deadline} onChange={e => setForm(f => ({ ...f, registration_deadline: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button className="volt-gradient" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editEvent ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registrations Dialog */}
      <Dialog open={!!regsEvent} onOpenChange={(open) => !open && setRegsEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Registrations — {regsEvent?.title}
            </DialogTitle>
          </DialogHeader>
          {regsLoading ? (
            <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>
          ) : registrations.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No registrations yet</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{registrations.length} registrant{registrations.length !== 1 ? "s" : ""}</p>
                <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map(r => (
                    <>
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{r.full_name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.email || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(r.registered_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs text-success border-success/20">{r.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => setNoteOpen(noteOpen === r.id ? null : r.id)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <MessageSquare className="h-3 w-3" />
                            {followupNotes[r.id] ? 'View' : 'Add'}
                          </button>
                        </TableCell>
                      </TableRow>
                      {noteOpen === r.id && (
                        <TableRow key={r.id + '-note'}>
                          <TableCell colSpan={5} className="bg-muted/30 pb-3">
                            <div className="flex gap-2 items-start">
                              <textarea
                                rows={2}
                                placeholder="Follow-up notes, action items..."
                                value={followupNotes[r.id] ?? ''}
                                onChange={e => setFollowupNotes(p => ({ ...p, [r.id]: e.target.value }))}
                                className="flex-1 rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:border-primary resize-none"
                              />
                              <Button size="sm" variant="outline" onClick={() => saveFollowupNote(r.id)} disabled={savingNote === r.id} className="text-xs shrink-0">
                                {savingNote === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
