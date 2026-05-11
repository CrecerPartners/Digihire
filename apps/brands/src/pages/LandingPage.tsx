import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@digihire/shared";
import { Card, CardContent } from "@digihire/shared";
import {
  ArrowRight,
  Zap,
  Users,
  TrendingUp,
  Briefcase,
  Target,
  Globe,
  CheckCircle2,
  Phone,
  Building2,
  Rocket,
  ShieldCheck,
  Clock,
  ChevronRight,
} from "lucide-react";

const talentTypes = [
  { icon: TrendingUp, label: "B2B Sales Executives" },
  { icon: Zap, label: "Tech Sales & SaaS Sales Reps" },
  { icon: Target, label: "Closers & Account Executives" },
  { icon: Briefcase, label: "Business Development Reps (BDRs)" },
  { icon: Users, label: "SDRs & Lead Qualification Teams" },
  { icon: Globe, label: "Field & External Sales Agents" },
];

const hiringModels = [
  {
    number: "01",
    title: "Direct Hire (Full-Time Recruitment)",
    subtitle: "Build your internal sales team with vetted, full-time talent.",
    points: [
      "End-to-end recruitment",
      "Role scoping & candidate screening",
      "Interview coordination & placement",
      "Ideal for long-term sales growth",
    ],
  },
  {
    number: "02",
    title: "Contract Sales Teams",
    subtitle: "Deploy sales talent on a flexible, short-term or project basis.",
    points: [
      "Fixed-term or performance-based contracts",
      "Great for launches, pilots, or market entry",
      "Scale up or down without long-term risk",
    ],
  },
  {
    number: "03",
    title: "Sales Outsourcing (End-to-End)",
    subtitle: "We deploy and manage sales teams for you.",
    points: [
      "Fully outsourced sales teams",
      "Performance tracking & reporting",
      "Ongoing management and optimization",
      "Best for companies that want execution, not oversight",
    ],
  },
  {
    number: "04",
    title: "External Sales Force Management",
    subtitle: "Already have external or distributed sales agents? We manage them.",
    points: [
      "Sales process setup",
      "CRM & reporting structure",
      "Performance management",
      "Optimization and scaling",
    ],
  },
];

const whyPoints = [
  { icon: ShieldCheck, text: "Pre-vetted, sales-ready talent" },
  { icon: Briefcase, text: "Experience across B2B, tech, and commercial sales" },
  { icon: Target, text: "Flexible hiring and outsourcing models" },
  { icon: Clock, text: "Faster deployment than traditional hiring" },
  { icon: Globe, text: "Support across African and international markets" },
];

const whoForItems = [
  "B2B companies",
  "Tech & SaaS businesses",
  "Marketplaces & platforms",
  "Growth-stage startups",
  "Enterprises expanding into new markets",
];

const brands = ["KoboGo", "Sabi Microfinance Bank", "GingerMe"];

const TALENT_OPTIONS = [
  "B2B Sales Executives",
  "Tech / SaaS Sales",
  "Closers / Account Executives",
  "Business Development Reps (BDRs)",
  "SDRs / Lead Qualification",
  "Field / External Sales Agents",
  "Not sure yet — need guidance",
];

const HIRING_MODEL_OPTIONS = [
  "Direct Hire (Full-time recruitment)",
  "Contract Sales",
  "Sales Outsourcing (End-to-End)",
  "External Sales Force Management",
  "Open to recommendations",
];

interface FormData {
  fullName: string;
  workEmail: string;
  companyName: string;
  role: string;
  businessType: string;
  companyStage: string;
  talentTypes: string[];
  hiringModels: string[];
  teamSize: string;
  startDate: string;
}

const initialForm: FormData = {
  fullName: "",
  workEmail: "",
  companyName: "",
  role: "",
  businessType: "",
  companyStage: "",
  talentTypes: [],
  hiringModels: [],
  teamSize: "",
  startDate: "",
};

function MultiCheckbox({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]
    );
  };
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const checked = selected.includes(opt);
        return (
          <label
            key={opt}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-all ${
              checked
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                checked ? "border-primary bg-primary" : "border-border"
              }`}
            >
              {checked && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
            </span>
            {opt}
          </label>
        );
      })}
    </div>
  );
}

export default function LandingPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.fullName || !form.workEmail || !form.companyName || !form.role) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.talentTypes.length === 0) {
      setError("Please select at least one talent type.");
      return;
    }
    if (form.hiringModels.length === 0) {
      setError("Please select at least one hiring model.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-20 right-0 h-[300px] w-[300px] rounded-full bg-primary/4 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center md:py-28">
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
            brands.digihire.io
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Hire High-Performing
            <br className="hidden md:block" /> Sales Talent.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Close more deals faster with pre-vetted, ready-to-perform sales talent you can hire instantly.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground/80">
            Hire, deploy, and manage high-performing sales talent without the hiring headache. We help businesses recruit, outsource, and build sales teams across B2B, tech, and commercial sales roles.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={scrollToForm}
              size="lg"
              className="volt-gradient border-0 px-8 text-base font-semibold shadow-lg hover:opacity-90"
            >
              Hire Sales Talent <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 text-base font-semibold"
              asChild
            >
              <a href="mailto:hire@digihire.io">
                <Phone className="mr-2 h-4 w-4" /> Talk to Our Team
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Brands ───────────────────────────────────── */}
      <section className="border-y border-border bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Brands we've worked with
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            {brands.map((brand) => (
              <div
                key={brand}
                className="rounded-xl border border-border/60 bg-card px-6 py-3 text-sm font-bold text-foreground/70 shadow-sm"
              >
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who You Can Hire ─────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Who You Can Hire</h2>
          <p className="mt-3 text-muted-foreground">Sales talent built for revenue, not just resumes.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {talentTypes.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-semibold text-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Hiring Models ────────────────────────────── */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Flexible Hiring Models</h2>
            <p className="mt-3 text-muted-foreground">Flexible hiring models to match your growth stage.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {hiringModels.map((model) => (
              <Card key={model.number} className="border-border/60 bg-card/80 transition-all hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <span className="font-display text-4xl font-black text-primary/20">{model.number}</span>
                    <div>
                      <h3 className="font-display text-lg font-bold leading-snug">{model.title}</h3>
                    </div>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">{model.subtitle}</p>
                  <ul className="space-y-2">
                    {model.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Crecer ───────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16 md:items-center">
          <div>
            <span className="mb-3 inline-block text-sm font-semibold text-primary">Why Crecer?</span>
            <h2 className="font-display text-3xl font-bold leading-snug md:text-4xl">
              More than recruitment. We deliver sales execution.
            </h2>
            <ul className="mt-8 space-y-4">
              {whyPoints.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-8">
            <h3 className="font-display mb-5 text-xl font-bold">Who This Is For</h3>
            <ul className="space-y-3">
              {whoForItems.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Final CTA Banner ─────────────────────────── */}
      <section className="volt-gradient">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
            Ready to scale your sales team?
          </h2>
          <p className="mt-4 text-base text-primary-foreground/80">
            Whether you need one closer or a full sales force, Crecer helps you hire and deploy sales talent that performs.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={scrollToForm}
              size="lg"
              className="bg-background text-foreground px-8 font-semibold hover:bg-background/90"
            >
              Hire Sales Talent <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-primary-foreground hover:bg-primary-foreground/10 px-8 font-semibold border border-primary-foreground/30"
              asChild
            >
              <a href="mailto:hire@digihire.io">Book a Consultation</a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Hire Form ────────────────────────────────── */}
      <section ref={formRef} id="hire-form" className="mx-auto max-w-3xl px-4 py-16 md:py-24 scroll-mt-20">
        <div className="mb-10 text-center">
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
            Get Started
          </span>
          <h2 className="font-display text-3xl font-bold">Hire Sales Talent</h2>
          <p className="mt-3 text-muted-foreground">Tell us about your needs and we'll be in touch within 24–48 hours.</p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-display text-2xl font-bold">Request Submitted!</h3>
            <p className="mt-3 text-muted-foreground">
              Our team will review your request and get back to you within 24–48 hours.
            </p>
            <Button
              className="volt-gradient mt-8 border-0 font-semibold"
              onClick={() => { setForm(initialForm); setSubmitted(false); }}
            >
              Submit Another Request
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-10">

            {/* Section 1: Basic Details */}
            <fieldset className="space-y-4">
              <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-black">1</span>
                Basic Details
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">Full Name <span className="text-destructive">*</span></span>
                  <input
                    required
                    type="text"
                    placeholder="John Adeyemi"
                    value={form.fullName}
                    onChange={set("fullName")}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">Work Email <span className="text-destructive">*</span></span>
                  <input
                    required
                    type="email"
                    placeholder="john@company.com"
                    value={form.workEmail}
                    onChange={set("workEmail")}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">Company Name <span className="text-destructive">*</span></span>
                  <input
                    required
                    type="text"
                    placeholder="Acme Corp"
                    value={form.companyName}
                    onChange={set("companyName")}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">Your Role <span className="text-destructive">*</span></span>
                  <select
                    required
                    value={form.role}
                    onChange={set("role")}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="" disabled>Select your role</option>
                    <option>Founder / Co-Founder</option>
                    <option>CEO / Managing Director</option>
                    <option>Head of Sales / Revenue</option>
                    <option>HR / Talent Lead</option>
                    <option>Operations / Growth</option>
                    <option>Other</option>
                  </select>
                </label>
              </div>
            </fieldset>

            <div className="h-px bg-border" />

            {/* Section 2: Business Context */}
            <fieldset className="space-y-4">
              <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-black">2</span>
                Business Context
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">What best describes your business?</span>
                  <select
                    value={form.businessType}
                    onChange={set("businessType")}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="" disabled>Select business type</option>
                    <option>B2B company</option>
                    <option>Tech / SaaS / Digital product</option>
                    <option>Service-based business</option>
                    <option>Marketplace / Platform</option>
                    <option>Ecommerce / Product-led business</option>
                    <option>Other</option>
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">Company Stage</span>
                  <select
                    value={form.companyStage}
                    onChange={set("companyStage")}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="" disabled>Select company stage</option>
                    <option>Early-stage</option>
                    <option>Growth-stage</option>
                    <option>Scaling / Expansion</option>
                    <option>Enterprise</option>
                  </select>
                </label>
              </div>
            </fieldset>

            <div className="h-px bg-border" />

            {/* Section 3: Sales Talent */}
            <fieldset className="space-y-4">
              <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-black">3</span>
                Sales Talent You Need
              </legend>
              <p className="text-sm text-muted-foreground">What type of sales talent are you looking for? <span className="text-destructive">*</span></p>
              <MultiCheckbox
                options={TALENT_OPTIONS}
                selected={form.talentTypes}
                onChange={(val) => setForm((p) => ({ ...p, talentTypes: val }))}
              />
            </fieldset>

            <div className="h-px bg-border" />

            {/* Section 4: Hiring Model */}
            <fieldset className="space-y-4">
              <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-black">4</span>
                Hiring Model
              </legend>
              <p className="text-sm text-muted-foreground">How would you like to hire? <span className="text-destructive">*</span></p>
              <MultiCheckbox
                options={HIRING_MODEL_OPTIONS}
                selected={form.hiringModels}
                onChange={(val) => setForm((p) => ({ ...p, hiringModels: val }))}
              />
            </fieldset>

            <div className="h-px bg-border" />

            {/* Section 5: Scale & Geography */}
            <fieldset className="space-y-4">
              <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-black">5</span>
                Scale & Timeline
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">How many sales professionals do you need?</span>
                  <select
                    value={form.teamSize}
                    onChange={set("teamSize")}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="" disabled>Select team size</option>
                    <option>2–5</option>
                    <option>6–10</option>
                    <option>10+</option>
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">When do you want to get started?</span>
                  <select
                    value={form.startDate}
                    onChange={set("startDate")}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="" disabled>Select timeline</option>
                    <option>Immediately</option>
                    <option>Within 30 days</option>
                    <option>1–3 months</option>
                    <option>Just exploring</option>
                  </select>
                </label>
              </div>
            </fieldset>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
                {error}
              </p>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitting}
                size="lg"
                className="volt-gradient w-full border-0 text-base font-semibold shadow-lg hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit & Talk to Sales"}
                {!submitting && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Our team will review your request and get back to you within 24–48 hours.
              </p>
            </div>
          </form>
        )}
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 md:flex-row md:justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg volt-gradient">
              <Building2 className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            DigiHire
          </Link>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Crecer Partners · DigiHire</p>
        </div>
      </footer>
    </div>
  );
}
