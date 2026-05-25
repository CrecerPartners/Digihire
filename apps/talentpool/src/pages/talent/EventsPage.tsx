import { useState, useEffect } from "react";
import { Card, CardContent } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@digihire/shared";
import { supabase } from "@digihire/shared";
import { useAuth } from "@digihire/shared";
import { CalendarDays, MapPin, Users, Clock, Loader2, CheckCircle, CalendarX } from "lucide-react";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  description?: string;
  event_type?: string;
  location?: string;
  event_date?: string;
  end_date?: string;
  capacity?: number;
  registration_deadline?: string;
  status: string;
}

interface Registration {
  id: string;
  event_id: string;
  status: string;
  registered_at: string;
  events: Event;
}

const statusColors: Record<string, string> = {
  upcoming: "text-primary border-primary/20",
  live: "text-success border-success/20",
  past: "text-muted-foreground border-border/50",
};

const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: eventsData }, { data: regsData }] = await Promise.all([
          (supabase as any)
            .from("events")
            .select("*")
            .in("status", ["upcoming", "live"])
            .order("event_date", { ascending: true }),
          user
            ? (supabase as any)
                .from("event_registrations")
                .select("*, events(*)")
                .eq("talent_id", user.id)
                .order("registered_at", { ascending: false })
            : Promise.resolve({ data: [] }),
        ]);
        setEvents(eventsData || []);
        setRegistrations(regsData || []);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const registeredEventIds = new Set(registrations.map(r => r.event_id));

  const handleRegister = async (event: Event) => {
    if (!user) {
      toast.error("Please sign in to register for events");
      return;
    }
    if (registeredEventIds.has(event.id)) return;

    setRegistering(event.id);
    try {
      const { error } = await (supabase as any)
        .from("event_registrations")
        .insert({
          event_id: event.id,
          talent_id: user.id,
          full_name: user.user_metadata?.full_name || user.email,
          email: user.email,
          status: "registered",
        });

      if (error) throw error;

      setRegistrations(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          event_id: event.id,
          status: "registered",
          registered_at: new Date().toISOString(),
          events: event,
        },
      ]);
      toast.success(`Registered for ${event.title}!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      if (message.includes("unique")) {
        toast.info("You're already registered for this event");
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setRegistering(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "TBD";
    return new Date(dateStr).toLocaleDateString("en-NG", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-display">Events</h1>
        <p className="text-muted-foreground mt-1">Upcoming workshops, networking events, and career opportunities</p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="bg-secondary">
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="mine">My Registrations</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-4">
          {events.length === 0 ? (
            <Card className="border-border/50 border-dashed">
              <CardContent className="p-10 text-center space-y-3">
                <CalendarDays className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <p className="font-semibold text-muted-foreground">No upcoming events</p>
                <p className="text-sm text-muted-foreground">Check back soon — events will appear here when they're posted.</p>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => {
              const isRegistered = registeredEventIds.has(event.id);
              const isRegistering = registering === event.id;
              return (
                <Card key={event.id} className="border-border/50 hover:border-primary/20 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={statusColors[event.status] || "text-muted-foreground"}>
                            {event.status}
                          </Badge>
                          {event.event_type && (
                            <Badge variant="secondary" className="text-xs">{event.event_type}</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-base">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                          {event.event_date && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(event.event_date)}
                            </span>
                          )}
                          {event.event_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(event.event_date)}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          )}
                          {event.capacity && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {event.capacity} capacity
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isRegistered ? (
                          <div className="flex items-center gap-2 text-success text-sm font-medium">
                            <CheckCircle className="h-4 w-4" /> Registered
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="volt-gradient"
                            onClick={() => handleRegister(event)}
                            disabled={isRegistering}
                          >
                            {isRegistering ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                            Register
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="mine" className="mt-4 space-y-4">
          {registrations.length === 0 ? (
            <Card className="border-border/50 border-dashed">
              <CardContent className="p-10 text-center space-y-3">
                <CalendarX className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <p className="font-semibold text-muted-foreground">No registrations yet</p>
                <p className="text-sm text-muted-foreground">Register for events above to see them here.</p>
              </CardContent>
            </Card>
          ) : (
            registrations.map((reg) => (
              <Card key={reg.id} className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm">{reg.events?.title}</h3>
                      {reg.events?.event_date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(reg.events.event_date)}
                        </p>
                      )}
                      {reg.events?.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {reg.events.location}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Registered {new Date(reg.registered_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-success border-success/20 text-xs shrink-0">
                      <CheckCircle className="h-3 w-3 mr-1" /> {reg.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventsPage;
