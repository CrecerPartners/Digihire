import { useState, useEffect } from "react";
import { Card, CardContent } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { useTalentProfile } from "@/hooks/useTalentProfile";
import { Briefcase, MapPin, Clock, CheckSquare, Square, Loader2, Save, CalendarDays } from "lucide-react";
import { toast } from "sonner";

const GIG_TYPES = [
  "Merchandising",
  "In-store Promotions",
  "Event Staffing",
  "Field Marketing",
  "Brand Ambassador",
  "Sales Promoter",
  "Product Demonstrations",
  "Market Surveys",
  "Street Marketing",
  "Experiential Marketing",
];

const NIGERIAN_CITIES = [
  "Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan", "Benin City",
  "Kaduna", "Enugu", "Onitsha", "Warri", "Aba", "Jos",
  "Ilorin", "Calabar", "Uyo", "Maiduguri", "Abeokuta", "Akure",
];

const GIG_AVAILABILITY_OPTIONS = [
  { value: "weekdays_only", label: "Weekdays Only" },
  { value: "weekends_only", label: "Weekends Only" },
  { value: "flexible", label: "Flexible (Anytime)" },
  { value: "part_time", label: "Part-time (Few days/week)" },
  { value: "full_time", label: "Full-time (5+ days/week)" },
];

const GigsPage = () => {
  const { profile, loading, updateProfile } = useTalentProfile();
  const [saving, setSaving] = useState(false);

  const [gigTypes, setGigTypes] = useState<string[]>([]);
  const [gigCities, setGigCities] = useState<string[]>([]);
  const [gigAvailability, setGigAvailability] = useState("");

  useEffect(() => {
    if (profile) {
      setGigTypes(profile.job_type_preference || []);
      setGigCities(profile.gig_cities || []);
      setGigAvailability(profile.gig_availability || "");
    }
  }, [profile]);

  const toggleGigType = (type: string) => {
    setGigTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleCity = (city: string) => {
    setGigCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      job_type_preference: gigTypes,
      gig_cities: gigCities,
      gig_availability: gigAvailability,
    });
    setSaving(false);
    if (error) {
      toast.error("Failed to save preferences");
    } else {
      toast.success("Gig preferences saved!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-display">Short-Term Gigs</h1>
        <p className="text-muted-foreground mt-1">Set your gig preferences and get matched to field opportunities</p>
      </div>

      {/* Gig Type Preferences */}
      <Card className="border-border/50">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">What types of gigs are you interested in?</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {GIG_TYPES.map((type) => {
              const selected = gigTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleGigType(type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                    selected
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {selected ? <CheckSquare className="h-4 w-4 shrink-0" /> : <Square className="h-4 w-4 shrink-0" />}
                  {type}
                </button>
              );
            })}
          </div>
          {gigTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {gigTypes.map(t => (
                <Badge key={t} variant="outline" className="text-xs text-primary border-primary/20">{t}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Availability Schedule */}
      <Card className="border-border/50">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">When are you available?</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {GIG_AVAILABILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGigAvailability(opt.value)}
                className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${
                  gigAvailability === opt.value
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-primary/30"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* City / Location Preferences */}
      <Card className="border-border/50">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Which cities can you work in?</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {NIGERIAN_CITIES.map((city) => {
              const selected = gigCities.includes(city);
              return (
                <button
                  key={city}
                  onClick={() => toggleCity(city)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
          {gigCities.length > 0 && (
            <p className="text-xs text-muted-foreground">{gigCities.length} cit{gigCities.length === 1 ? "y" : "ies"} selected</p>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="volt-gradient w-full sm:w-auto">
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save Preferences
      </Button>

      {/* Opportunities Placeholder */}
      <Card className="border-border/50 border-dashed">
        <CardContent className="p-8 text-center space-y-3">
          <CalendarDays className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="font-semibold text-muted-foreground">Gig Opportunities Coming Soon</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Once you've saved your preferences, you'll be notified when matching gig opportunities are posted by brands and agencies.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GigsPage;
