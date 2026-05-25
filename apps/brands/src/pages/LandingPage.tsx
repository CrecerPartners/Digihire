import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Zap,
  Users,
  TrendingUp,
  Briefcase,
  Target,
  Globe,
  CheckCircle,
  Phone,
  ShieldCheck,
  Clock,
  Building2,
  UserCheck,
  ClipboardList,
  Settings,
} from "lucide-react";

/* ── CSS vars matched from voltsquad.html ── */
const V = {
  navy:       "#06111F",
  navy1:      "#0B1D33",
  cyan:       "#00C2FF",
  cyanDim:    "#0096C7",
  cyanSoft:   "#33CFFF",
  cyanBorder: "rgba(0,194,255,0.18)",
  cyanBg:     "rgba(0,194,255,0.08)",
  grayBg:     "#F4F8FF",
  border:     "#E2EBF5",
  subText:    "#6B849E",
  bodyText:   "#3E5A7A",
};

/* ── Scroll-reveal hook ── */
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal, .stagger-grid").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

const talentTypes = [
  { icon: TrendingUp, label: "B2B Sales Executives" },
  { icon: Zap,        label: "Tech Sales & SaaS Sales Reps" },
  { icon: Target,     label: "Closers & Account Executives" },
  { icon: Briefcase,  label: "Business Development Reps (BDRs)" },
  { icon: Users,      label: "SDRs & Lead Qualification Teams" },
  { icon: Globe,      label: "Field & External Sales Agents" },
];

const hiringModels = [
  {
    num: "01", icon: UserCheck,
    title: "Direct Hire",
    sub:   "Build your internal sales team with vetted, full-time talent.",
    points: ["End-to-end recruitment", "Role scoping & candidate screening", "Interview coordination & placement", "Ideal for long-term sales growth"],
  },
  {
    num: "02", icon: ClipboardList,
    title: "Contract Sales Teams",
    sub:   "Deploy sales talent on a flexible, short-term or project basis.",
    points: ["Fixed-term or performance-based contracts", "Great for launches, pilots, or market entry", "Scale up or down without long-term risk"],
  },
  {
    num: "03", icon: Globe,
    title: "Sales Outsourcing",
    sub:   "We deploy and manage complete sales teams for you.",
    points: ["Fully outsourced sales teams", "Performance tracking & reporting", "Ongoing management and optimization", "Best for companies that want execution"],
  },
  {
    num: "04", icon: Settings,
    title: "External Sales Force Management",
    sub:   "Already have distributed sales agents? We manage them.",
    points: ["Sales process setup", "CRM & reporting structure", "Performance management", "Optimization and scaling"],
  },
];

const whyPoints = [
  { icon: ShieldCheck, text: "Pre-vetted, sales-ready talent" },
  { icon: Briefcase,   text: "Experience across B2B, tech, and commercial sales" },
  { icon: Target,      text: "Flexible hiring and outsourcing models" },
  { icon: Clock,       text: "Faster deployment than traditional hiring" },
  { icon: Globe,       text: "Support across African and international markets" },
];

const whoFor = [
  "B2B companies",
  "Tech & SaaS businesses",
  "Marketplaces & platforms",
  "Growth-stage startups",
  "Enterprises expanding into new markets",
];

const brandLogos = [
  { src: "/sabi.png",            alt: "Sabi Microfinance Bank" },
  { src: "/ginger.png",          alt: "GingerMe" },
  { src: "/jumia.png",           alt: "Jumia" },
  { src: "/konga.png",           alt: "Konga" },
  { src: "/breet.png",           alt: "Breet" },
  { src: "/ezipay.png",          alt: "Ezipay" },
  { src: "/cardtonic.png",       alt: "Cardtonic" },
  { src: "/blakskill.png",       alt: "BlakSkill" },
  { src: "/british-council.png", alt: "British Council" },
  { src: "/hp.png",              alt: "HP" },
];

const stats = [
  { value: "500+", label: "Sales professionals placed" },
  { value: "50+",  label: "Companies served" },
  { value: "90%",  label: "Retention rate" },
  { value: "14d",  label: "Avg. time to hire" },
];

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
  fullName: string; workEmail: string; companyName: string; role: string;
  businessType: string; companyStage: string; talentTypes: string[];
  hiringModels: string[]; teamSize: string; startDate: string;
}
const blank: FormData = {
  fullName: "", workEmail: "", companyName: "", role: "",
  businessType: "", companyStage: "", talentTypes: [], hiringModels: [], teamSize: "", startDate: "",
};

function Checkbox({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(selected.includes(o) ? selected.filter(s => s !== o) : [...selected, o]);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {options.map(o => {
        const on = selected.includes(o);
        return (
          <label key={o} onClick={() => toggle(o)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            borderRadius: 10, border: `1px solid ${on ? V.cyan : V.border}`,
            background: on ? V.cyanBg : "#fff", cursor: "pointer",
            fontSize: 14, color: on ? V.navy : V.bodyText, transition: "all .2s",
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
              background: on ? V.cyan : "transparent",
              border: `1.5px solid ${on ? V.cyan : V.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {on && <CheckCircle size={11} color={V.navy} />}
            </span>
            {o}
          </label>
        );
      })}
    </div>
  );
}

export default function LandingPage() {
  const formRef   = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const [form, setForm]         = useState<FormData>(blank);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");
  useReveal();

  useEffect(() => {
    const n = document.createElement("script"); n.src = "/nav-loader.js"; n.async = true; document.body.appendChild(n);
    const f = document.createElement("script"); f.src = "/footer-loader.js"; f.async = true; document.body.appendChild(f);
    return () => { document.body.removeChild(n); document.body.removeChild(f); };
  }, []);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToServices = () => servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!form.fullName || !form.workEmail || !form.companyName || !form.role) { setError("Please fill in all required fields."); return; }
    if (!form.talentTypes.length) { setError("Please select at least one talent type."); return; }
    if (!form.hiringModels.length) { setError("Please select at least one hiring model."); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 900));
    setSubmitting(false); setSubmitted(true);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 16px", borderRadius: 10,
    border: `1px solid ${V.border}`, fontSize: 14, color: V.navy,
    background: "#fff", outline: "none", fontFamily: "CenturyGothic, sans-serif",
    transition: "border-color .2s",
  };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, color: V.bodyText, marginBottom: 6 };
  const legendStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 800,
    letterSpacing: "0.1em", textTransform: "uppercase", color: V.cyanDim, marginBottom: 16,
  };
  const legendNum: React.CSSProperties = {
    width: 22, height: 22, borderRadius: 6, background: V.cyanBg,
    border: `1px solid ${V.cyanBorder}`, color: V.cyanDim,
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
  };

  const servicesList = [
    {
      icon: Zap,
      title: "VoltSquad Campaigns",
      desc: "Launch performance-based campaigns to acquire users, boost app downloads, and drive sales through our campus & digital seller networks.",
      cta: "Launch VoltSquad Campaign",
      color: "#EAB308", 
      bg: "rgba(234,179,8,0.1)",
      border: "rgba(234,179,8,0.2)",
      link: "/signup?service=voltsquad",
      hoverBorder: "hover:border-yellow-500/40",
      hoverBg: "hover:bg-yellow-500 hover:text-white"
    },
    {
      icon: UserCheck,
      title: "Hire Full-Time Sales Talent",
      desc: "Recruit dedicated, full-time sales professionals — SDRs, BDRs, Account Executives, and B2B closers — fully pre-vetted for your industry.",
      cta: "Hire Full-Time Talent",
      color: "#00C2FF", 
      bg: "rgba(0,194,255,0.1)",
      border: "rgba(0,194,255,0.2)",
      link: "/signup?service=recruitment-fulltime",
      hoverBorder: "hover:border-cyan-500/40",
      hoverBg: "hover:bg-cyan-500 hover:text-navy"
    },
    {
      icon: Briefcase,
      title: "Hire Part-Time & Contract Sales",
      desc: "Scale your sales force flexibly with campaign-based or project-based contract professionals built for rapid market expansion.",
      cta: "Hire Contract Talent",
      color: "#10B981", 
      bg: "rgba(16,185,129,0.1)",
      border: "rgba(16,185,129,0.2)",
      link: "/signup?service=recruitment-parttime",
      hoverBorder: "hover:border-emerald-500/40",
      hoverBg: "hover:bg-emerald-500 hover:text-white"
    },
    {
      icon: ClipboardList,
      title: "Request Merchandisers & Staff",
      desc: "Access qualified merchandisers, in-store promoters, and short-term staff for retail coverage, audits, and physical distribution.",
      cta: "Request Field Staff",
      color: "#F97316", 
      bg: "rgba(249,115,22,0.1)",
      border: "rgba(249,115,22,0.2)",
      link: "/signup?service=merchandisers",
      hoverBorder: "hover:border-orange-500/40",
      hoverBg: "hover:bg-orange-500 hover:text-white"
    },
    {
      icon: Target,
      title: "Activations & Field Marketing",
      desc: "Deploy promoters and execution teams for on-ground mall activations, campus roadshows, and street-level marketing support.",
      cta: "Plan Activations",
      color: "#8B5CF6", 
      bg: "rgba(139,92,246,0.1)",
      border: "rgba(139,92,246,0.2)",
      link: "/signup?service=activations",
      hoverBorder: "hover:border-violet-500/40",
      hoverBg: "hover:bg-violet-500 hover:text-white"
    }
  ];

  return (
    <div className="brands-landing" style={{ fontFamily: "CenturyGothic, sans-serif", background: "#fff", color: V.navy, overflowX: "hidden" }}>
      <div id="nav-root" />

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section style={{ background: V.navy, padding: "160px 0 110px", position: "relative", overflow: "hidden", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,194,255,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 28px", position: "relative" }}>
          <div className="reveal">
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase",
              color: V.cyan, background: V.cyanBg,
              border: `1px solid rgba(0,194,255,0.22)`, borderRadius: 999,
              padding: "8px 16px", marginBottom: 24,
            }}>
              <Building2 size={14} /> brands.digihire.io
            </span>

            <h1 style={{
              fontFamily: "CenturyGothic, sans-serif",
              fontSize: "clamp(34px, 5.5vw, 64px)",
              color: "#fff", lineHeight: 1.08, letterSpacing: "-0.025em",
              marginBottom: 20, maxWidth: 860, marginLeft: "auto", marginRight: "auto",
            }}>
              Hire High-Performing{" "}
              <em style={{ color: V.cyan, fontStyle: "normal" }}>Sales Talent.</em>
            </h1>

            <p style={{ fontSize: "clamp(16px, 1.9vw, 19px)", color: "rgba(255,255,255,0.82)", maxWidth: 620, margin: "0 auto 16px", lineHeight: 1.55 }}>
              Close more deals faster with pre-vetted, ready-to-perform sales talent.
            </p>
            <p style={{ fontSize: "clamp(14px, 1.6vw, 16px)", color: "rgba(255,255,255,0.6)", maxWidth: 640, margin: "0 auto 44px", lineHeight: 1.75 }}>
              Hire, deploy, and manage high-performing sales talent without the headache. We help businesses recruit, outsource, and build sales teams across B2B, tech, and commercial sales roles.
            </p>

            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 64 }}>
              <button onClick={scrollToServices} className="vs-btn-cyan">
                Explore Services &amp; Hire <ArrowRight size={16} />
              </button>
              <a href="mailto:hire@digihire.io" className="vs-btn-outline-white">
                <Phone size={15} /> Talk to Our Team
              </a>
            </div>

            <div style={{ maxWidth: 900, margin: "0 auto", borderRadius: 20, overflow: "hidden", border: `1px solid rgba(0,194,255,0.18)` }}>
              <img src="https://crecerpartners.com/wp-content/uploads/2025/08/WhatsApp-Image-2025-09-08-at-08.48.44_9afe4066.jpg" alt="Sales Talent" style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ══ BRANDS STRIP ══════════════════════════════════ */}
      <section style={{ background: "#fff", borderBottom: `1px solid ${V.border}`, padding: "48px 0" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 28px", textAlign: "center" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: V.subText, marginBottom: 32 }}>
            Brands we've worked with
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", alignItems: "center" }}>
            {brandLogos.map(({ src, alt }) => (
              <div key={alt} style={{
                padding: "14px 24px", borderRadius: 12, border: `1px solid ${V.border}`,
                background: V.grayBg, display: "flex", alignItems: "center", justifyContent: "center",
                height: 64, minWidth: 100,
              }}>
                <img
                  src={src}
                  alt={alt}
                  style={{ height: 32, width: "auto", maxWidth: 120, objectFit: "contain", display: "block", filter: "grayscale(1)", opacity: 0.65, transition: "filter .2s, opacity .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.filter = "grayscale(0)"; (e.currentTarget as HTMLImageElement).style.opacity = "1"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.filter = "grayscale(1)"; (e.currentTarget as HTMLImageElement).style.opacity = "0.65"; }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SERVICES GRID ════════════════════════════════ */}
      <section ref={servicesRef} id="services" style={{ background: "#fff", padding: "110px 0 80px", borderBottom: `1px solid ${V.border}` }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 28px" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: V.cyanDim, marginBottom: 10 }}>Services Available</p>
            <h2 style={{ fontFamily: "CenturyGothic, sans-serif", fontSize: "clamp(26px,3.5vw,40px)", color: V.navy, marginBottom: 14, letterSpacing: "-0.02em" }}>
              What You Can Do on DigiHire
            </h2>
            <p style={{ fontSize: 16, color: V.subText, maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>
              Select a service below to get started. Each option opens a customized signup and onboarding flow tailored to your requirements, connecting directly to your brand dashboard.
            </p>
          </div>

          <div className="stagger-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
            {servicesList.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.title} className={`bg-card border border-border/80 rounded-[24px] p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${s.hoverBorder}`} style={{ minHeight: 320 }}>
                  <div className="flex flex-col gap-5 flex-grow">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center border" style={{ background: s.bg, borderColor: s.border, color: s.color }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground tracking-tight mb-2" style={{ fontFamily: "CenturyGothic, sans-serif" }}>{s.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-6">{s.desc}</p>
                    </div>
                  </div>
                  <Link to={s.link} className={`inline-flex items-center justify-center gap-1.5 w-full py-3 px-4 rounded-xl border font-semibold text-sm transition-all duration-200 ${s.hoverBg}`} style={{ borderColor: s.border, color: V.navy }}>
                    {s.cta} <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ STATS ══════════════════════════════════════════ */}
      <section style={{ background: V.grayBg, padding: "64px 0", borderBottom: `1px solid ${V.border}` }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 28px" }}>
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32, textAlign: "center" }}>
            {stats.map(s => (
              <div key={s.label}>
                <p style={{ fontFamily: "CenturyGothic, sans-serif", fontSize: "clamp(28px,3vw,40px)", color: V.cyan, lineHeight: 1.1 }}>{s.value}</p>
                <p style={{ fontSize: 14, color: V.subText, marginTop: 6 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHO YOU CAN HIRE ══════════════════════════════ */}
      <section style={{ background: "#fff", padding: "110px 0" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 28px" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: V.cyanDim, marginBottom: 10 }}>Talent Roster</p>
            <h2 style={{ fontFamily: "CenturyGothic, sans-serif", fontSize: "clamp(26px,3.5vw,40px)", color: V.navy, marginBottom: 14, letterSpacing: "-0.02em" }}>Who You Can Hire</h2>
            <p style={{ fontSize: 16, color: V.subText, maxWidth: 520, margin: "0 auto" }}>Sales talent built for revenue, not just resumes.</p>
          </div>
          <div className="stagger-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {talentTypes.map(({ icon: Icon, label }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "22px 24px", borderRadius: 18,
                border: `1px solid ${V.border}`, background: "#fff",
                transition: "transform .28s ease, box-shadow .28s ease, border-color .28s ease",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = V.cyanBorder; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 48px rgba(6,17,31,0.08)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = V.border; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 11, background: V.cyanBg, border: `1px solid ${V.cyanBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: V.cyanDim, flexShrink: 0 }}>
                  <Icon size={18} />
                </div>
                <span style={{ fontSize: 15, color: V.navy }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HIRING MODELS ═════════════════════════════════ */}
      <section style={{ background: V.grayBg, padding: "110px 0" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 28px" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: V.cyanDim, marginBottom: 10 }}>Hiring Models</p>
            <h2 style={{ fontFamily: "CenturyGothic, sans-serif", fontSize: "clamp(26px,3.5vw,40px)", color: V.navy, marginBottom: 14, letterSpacing: "-0.02em" }}>Flexible Hiring Models</h2>
            <p style={{ fontSize: 16, color: V.subText, maxWidth: 520, margin: "0 auto" }}>Match your growth stage with the right model.</p>
          </div>
          <div className="stagger-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 24 }}>
            {hiringModels.map(m => (
              <div key={m.num} style={{
                background: "#fff", border: `1px solid ${V.border}`, borderRadius: 28,
                overflow: "hidden", transition: "transform .28s ease, box-shadow .28s ease, border-color .28s ease",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = V.cyanBorder; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 24px 60px rgba(6,17,31,0.1)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = V.border; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
              >
                <div style={{ padding: "32px 32px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: V.cyanBg, border: `1px solid ${V.cyanBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: V.cyanDim }}>
                      <m.icon size={18} />
                    </div>
                    <span style={{ fontSize: 12, letterSpacing: "0.08em", color: V.cyanDim, background: V.cyanBg, border: `1px solid ${V.cyanBorder}`, borderRadius: 8, padding: "4px 10px" }}>{m.num}</span>
                  </div>
                  <h3 style={{ fontFamily: "CenturyGothic, sans-serif", fontSize: 20, color: V.navy, marginBottom: 10, letterSpacing: "-0.015em" }}>{m.title}</h3>
                  <p style={{ fontSize: 14, color: V.subText, lineHeight: 1.7, marginBottom: 16 }}>{m.sub}</p>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                    {m.points.map(pt => (
                      <li key={pt} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: V.bodyText }}>
                        <span style={{ width: 20, height: 20, borderRadius: "50%", background: V.cyanBg, border: `1px solid ${V.cyanBorder}`, color: V.cyanDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                          <CheckCircle size={11} />
                        </span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHY CRECER (benefits split) ═══════════════════ */}
      <section style={{ background: "#fff", padding: "110px 0" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 28px" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: V.cyanDim, marginBottom: 10 }}>Why Crecer?</p>
            <h2 style={{ fontFamily: "CenturyGothic, sans-serif", fontSize: "clamp(26px,3.5vw,40px)", color: V.navy, marginBottom: 14, letterSpacing: "-0.02em" }}>More than recruitment. We deliver sales execution.</h2>
            <p style={{ fontSize: 16, color: V.subText, maxWidth: 540, margin: "0 auto" }}>Two outcomes — structured to help you build and grow your sales team.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
            {/* Light col */}
            <div className="reveal" style={{ border: `1px solid ${V.border}`, borderRadius: 28, padding: "44px 40px", background: "linear-gradient(180deg,#FDFEFF 0%,#F7FBFF 100%)" }}>
              <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: V.cyanDim, display: "block", marginBottom: 14 }}>Why Choose Crecer</span>
              <h3 style={{ fontFamily: "CenturyGothic, sans-serif", fontSize: 26, color: V.navy, marginBottom: 28, letterSpacing: "-0.02em" }}>Built for sales performance, not just placement.</h3>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
                {whyPoints.map(({ icon: Icon, text }) => (
                  <li key={text} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 15, color: V.bodyText, lineHeight: 1.6 }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: V.cyanBg, border: `1px solid ${V.cyanBorder}`, color: V.cyanDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <Icon size={11} />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            {/* Dark col */}
            <div className="reveal" style={{ border: `1px solid rgba(0,194,255,0.16)`, borderRadius: 28, padding: "44px 40px", background: V.navy }}>
              <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: V.cyan, display: "block", marginBottom: 14 }}>Who This Is For</span>
              <h3 style={{ fontFamily: "CenturyGothic, sans-serif", fontSize: 26, color: "#fff", marginBottom: 28, letterSpacing: "-0.02em" }}>Scale your sales team without the hiring headache.</h3>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
                {whoFor.map(item => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 15, color: "rgba(255,255,255,0.78)", lineHeight: 1.6 }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(0,194,255,0.14)", border: "1px solid rgba(0,194,255,0.28)", color: V.cyan, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <CheckCircle size={11} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 32, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(0,194,255,0.15)" }}>
                <img src="/why-us.png" alt="Sales Performance" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══════════════════════════════════════ */}
      <section style={{ background: V.navy, padding: "110px 0", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(0,194,255,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 28px", position: "relative", zIndex: 1 }}>
          <div className="reveal">
            <h2 style={{ fontFamily: "CenturyGothic, sans-serif", fontSize: "clamp(28px,4.5vw,48px)", color: "#fff", letterSpacing: "-0.025em", marginBottom: 16, lineHeight: 1.1 }}>
              Ready to scale your sales team?
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
              Whether you need one closer or a full sales force, Crecer helps you hire and deploy sales talent that performs.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={scrollToServices} className="vs-btn-cyan">
                Hire Sales Talent <ArrowRight size={16} />
              </button>
              <a href="mailto:hire@digihire.io" className="vs-btn-outline-white">
                Book a Consultation
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ HIRE FORM ══════════════════════════════════════ */}
      <section ref={formRef} id="hire-form" style={{ background: V.grayBg, padding: "110px 0" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 28px" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: V.cyanDim, marginBottom: 10 }}>Get Started</p>
            <h2 style={{ fontFamily: "CenturyGothic, sans-serif", fontSize: "clamp(26px,3.5vw,40px)", color: V.navy, marginBottom: 14, letterSpacing: "-0.02em" }}>Hire Sales Talent</h2>
            <p style={{ fontSize: 16, color: V.subText }}>Tell us about your needs and we'll be in touch within 24–48 hours.</p>
          </div>

          {submitted ? (
            <div className="reveal" style={{ background: "#fff", borderRadius: 28, border: `1px solid ${V.border}`, padding: "60px 40px", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: V.cyanBg, border: `1px solid ${V.cyanBorder}`, margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", color: V.cyanDim }}>
                <CheckCircle size={28} />
              </div>
              <h3 style={{ fontFamily: "CenturyGothic, sans-serif", fontSize: 26, color: V.navy, marginBottom: 12 }}>Request Submitted!</h3>
              <p style={{ fontSize: 16, color: V.subText, marginBottom: 32 }}>Our team will review your request and get back to you within 24–48 hours.</p>
              <button onClick={() => { setForm(blank); setSubmitted(false); }} className="vs-btn-cyan" style={{ margin: "0 auto" }}>
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ background: "#fff", borderRadius: 28, border: `1px solid ${V.border}`, padding: "44px 40px", display: "flex", flexDirection: "column", gap: 32 }}>

              {/* 1 Basic */}
              <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <legend style={legendStyle}><span style={legendNum}>1</span> Basic Details</legend>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {([["Full Name *", "fullName", "text", "John Adeyemi"], ["Work Email *", "workEmail", "email", "john@company.com"], ["Company Name *", "companyName", "text", "Acme Corp"]] as const).map(([label, key, type, ph]) => (
                    <label key={key} style={{ display: "block" }}>
                      <span style={labelStyle}>{label}</span>
                      <input required type={type} placeholder={ph} value={form[key as keyof FormData] as string} onChange={set(key as keyof FormData)} style={inputStyle} />
                    </label>
                  ))}
                  <label>
                    <span style={labelStyle}>Your Role *</span>
                    <select required value={form.role} onChange={set("role")} style={inputStyle}>
                      <option value="" disabled>Select your role</option>
                      {["Founder / Co-Founder", "CEO / Managing Director", "Head of Sales / Revenue", "HR / Talent Lead", "Operations / Growth", "Other"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </label>
                </div>
              </fieldset>

              <div style={{ height: 1, background: V.border }} />

              {/* 2 Business */}
              <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <legend style={legendStyle}><span style={legendNum}>2</span> Business Context</legend>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <label>
                    <span style={labelStyle}>Business type</span>
                    <select value={form.businessType} onChange={set("businessType")} style={inputStyle}>
                      <option value="" disabled>Select type</option>
                      {["B2B company", "Tech / SaaS / Digital product", "Service-based business", "Marketplace / Platform", "Ecommerce / Product-led", "Other"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </label>
                  <label>
                    <span style={labelStyle}>Company stage</span>
                    <select value={form.companyStage} onChange={set("companyStage")} style={inputStyle}>
                      <option value="" disabled>Select stage</option>
                      {["Early-stage", "Growth-stage", "Scaling / Expansion", "Enterprise"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </label>
                </div>
              </fieldset>

              <div style={{ height: 1, background: V.border }} />

              {/* 3 Talent */}
              <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <legend style={legendStyle}><span style={legendNum}>3</span> Sales Talent You Need *</legend>
                <Checkbox options={TALENT_OPTIONS} selected={form.talentTypes} onChange={v => setForm(p => ({ ...p, talentTypes: v }))} />
              </fieldset>

              <div style={{ height: 1, background: V.border }} />

              {/* 4 Hiring model */}
              <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <legend style={legendStyle}><span style={legendNum}>4</span> Hiring Model *</legend>
                <Checkbox options={HIRING_MODEL_OPTIONS} selected={form.hiringModels} onChange={v => setForm(p => ({ ...p, hiringModels: v }))} />
              </fieldset>

              <div style={{ height: 1, background: V.border }} />

              {/* 5 Scale */}
              <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <legend style={legendStyle}><span style={legendNum}>5</span> Scale & Timeline</legend>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <label>
                    <span style={labelStyle}>How many professionals do you need?</span>
                    <select value={form.teamSize} onChange={set("teamSize")} style={inputStyle}>
                      <option value="" disabled>Select size</option>
                      {["2–5", "6–10", "10+"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </label>
                  <label>
                    <span style={labelStyle}>When do you want to start?</span>
                    <select value={form.startDate} onChange={set("startDate")} style={inputStyle}>
                      <option value="" disabled>Select timeline</option>
                      {["Immediately", "Within 30 days", "1–3 months", "Just exploring"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </label>
                </div>
              </fieldset>

              {error && (
                <p style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#DC2626", fontSize: 14 }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={submitting} className="vs-btn-cyan" style={{ width: "100%", justifyContent: "center", opacity: submitting ? 0.6 : 1 }}>
                {submitting ? "Submitting…" : <><span>Submit & Talk to Sales</span><ArrowRight size={16} /></>}
              </button>
              <p style={{ textAlign: "center", fontSize: 13, color: V.subText }}>
                Our team will review your request and get back to you within 24–48 hours.
              </p>
            </form>
          )}
        </div>
      </section>

      <div id="footer-root" />
    </div>
  );
}
