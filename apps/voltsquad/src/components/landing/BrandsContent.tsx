import { Link } from "react-router-dom";
import { Button } from "@digihire/shared";
import { Card, CardContent } from "@digihire/shared";
import {
  ArrowRight,
  Package,
  Target,
  Share2,
  Rocket,
  RefreshCw,
  ShieldCheck,
  Handshake,
  BarChart3,
  Cpu,
  Phone,
  Landmark,
  Ticket,
  Shirt,
  BookOpen,
  CheckCircle2,
  X,
} from "lucide-react";

const brandStats = [
  { value: "2M+", label: "active Gen Z buyers nationwide" },
  { value: "20+", label: "cities & campuses covered" },
  { value: "5K+", label: "Gen Z sellers across Nigeria" },
  { value: "1000+", label: "peer-driven interactions per campaign" },
  { value: "≤10", label: "days to launch sales" },
];

const benefits = [
  {
    icon: Package,
    title: "Zero-Stress Logistics",
    desc: "We handle recruitment, coordination, tracking, and weekly payouts to sellers. You focus on your product. We focus on distribution and movement.",
  },
  {
    icon: Target,
    title: "Sales Density, Not Surface Reach",
    desc: "DigiHire deploys Gen Z sellers across campuses, cities, and communities, ensuring saturation through peer networks — not one-off visibility from a few creators.",
  },
  {
    icon: Share2,
    title: "Social-First Sales Content",
    desc: "Gen Z buys on WhatsApp, Telegram & TikTok. DigiHire converts your product assets into high-conversion flyers, stickers, and status-ready content designed for social sharing.",
  },
  {
    icon: Rocket,
    title: "Faster Time-to-Market",
    desc: "Campaigns can go live in days, not months. DigiHire eliminates the long setup cycles of traditional field marketing and influencer campaigns.",
  },
  {
    icon: RefreshCw,
    title: "Repeat Buying & Community-Led Adoption",
    desc: "Gen Z communities are tight-knit. Once a product gains traction, repeat purchases and organic referrals follow, turning single campaigns into ongoing demand.",
  },
  {
    icon: ShieldCheck,
    title: "Vetted Seller Network",
    desc: "DigiHire recruits and manages trusted sellers — students, NYSC members, micro-influencers, and content creators who already influence real buying decisions.",
  },
  {
    icon: Handshake,
    title: "Direct Peer-to-Peer Trust & Selling",
    desc: "Gen Z doesn't buy from ads; they buy from people they know. DigiHire leverages peer-to-peer recommendation, demos, and everyday conversations to drive faster adoption.",
  },
  {
    icon: BarChart3,
    title: "Performance Tracking, Not Guesswork",
    desc: "Track exactly which cities, products, and sellers are driving sales in real time.",
  },
];

const comparisonRows = [
  { dim: "Reach", trad: "Passive Scrolling", volt: "Direct Peer-To-Peer Trust" },
  { dim: "Cost", trad: "Pay-Per-Impression (High Risk)", volt: "Pay-Per-Sale (ROI Focused)" },
  { dim: "Engagement", trad: "One-off Clicks", volt: "Community-Led Adoption" },
  { dim: "Tracking", trad: "Vanity Metrics", volt: "City & Seller-Level Data" },
  { dim: "Sales", trad: "Uncertain", volt: "Performance Based" },
];

const verticals = [
  { icon: Cpu, label: "Electronics & Gadgets" },
  { icon: Phone, label: "Telco & Utility Services" },
  { icon: Landmark, label: "Fintech & Financial Services" },
  { icon: Ticket, label: "Events & Access" },
  { icon: Shirt, label: "Fashion & Lifestyle" },
  { icon: BookOpen, label: "Academic & Professional Tools" },
];

const processSteps = [
  { step: 1, title: "List your product", desc: "Add your product to DigiHire" },
  { step: 2, title: "Sellers promote it", desc: "Our sellers push your product across their networks" },
  { step: 3, title: "You get customers", desc: "Sales and signups are tracked" },
  { step: 4, title: "You pay only for results", desc: "No sales, no cost" },
];

export function BrandsContent() {
  return (
    <>
      {/* Brand Stats */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
            {brandStats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-bold text-primary md:text-4xl">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground md:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Turn Distribution Into Sales */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Turn Distribution Into Sales</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Stop paying for impressions. Start paying for results. Reach new customers through sellers who already have access to your target market.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {benefits.map((b) => (
            <Card key={b.title} className="border-border/60 bg-card/80 transition-all hover:border-primary/30 hover:shadow-md">
              <CardContent className="flex flex-col gap-3 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{b.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* The DigiHire Advantage */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">The DigiHire Advantage</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground" />
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Traditional Ads</th>
                  <th className="px-4 py-3 text-left font-semibold text-primary">The DigiHire Way</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((r) => (
                  <tr key={r.dim} className="border-b border-border last:border-0">
                    <td className="px-4 py-3.5 font-medium">{r.dim}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <X className="h-4 w-4 shrink-0 text-destructive" />
                        {r.trad}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-2 text-primary">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {r.volt}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Product Verticals */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="mb-4 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Product Verticals We Distribute</h2>
          <p className="mt-3 text-muted-foreground">
            DigiHire focuses on fast-moving, high-demand products that Gen Z already buys.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {verticals.map((v) => (
            <div
              key={v.label}
              className="flex items-center gap-3 rounded-xl border border-border bg-card/80 p-4 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <v.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{v.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* The DigiHire Process */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">How DigiHire Drives Sales</h2>
          </div>
          <div className="flex flex-col gap-6">
            {processSteps.map((s) => (
              <div key={s.step} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full volt-gradient text-base font-bold text-primary-foreground">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand CTA */}
      <section className="volt-gradient">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center md:py-20">
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
            Partner with DigiHire
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
            Gen Z doesn't buy from ads — they buy from people they trust. DigiHire turns communities into structured sales environments powered by peer influence and real incentives.
          </p>
          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="bg-background text-foreground px-8 text-base font-semibold hover:bg-background/90"
            >
              <a href="https://brands.digihire.io/signup" target="_blank" rel="noopener noreferrer">
                Start Selling
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
          <p className="mt-8 text-sm font-semibold text-primary-foreground/60 uppercase tracking-wider">Built for People Who Want Results</p>
          <p className="mt-1 text-primary-foreground/80">For brands: Get customers, not just traffic</p>
        </div>
      </section>
    </>
  );
}


