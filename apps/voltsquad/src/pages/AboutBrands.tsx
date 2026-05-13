import { Link } from "react-router-dom";
import { LandingNavbar } from "@/components/LandingNavbar";
import { Button } from "@digihire/shared";
import { Card, CardContent } from "@digihire/shared";
import {
  Target,
  BarChart3,
  Megaphone,
  ShieldCheck,
  Rocket,
  ArrowRight,
  Zap,
  Users,
} from "lucide-react";
import heroBrands from "@/assets/hero-brands.png";

const steps = [
  { icon: Rocket, title: "List Your Products", desc: "Upload your catalog and set commission rates for Volt sellers." },
  { icon: Users, title: "Sellers Promote", desc: "Thousands of Gen Z sellers share your products across their networks and communities." },
  { icon: BarChart3, title: "Track & Scale", desc: "Monitor sales in real time. Pay commissions only on results." },
];

const benefits = [
  { icon: Target, title: "Hyper-Local Reach", desc: "Get your products in front of Gen Z buyers across 20+ cities and campuses in Nigeria." },
  { icon: Megaphone, title: "Word-of-Mouth at Scale", desc: "Sellers promote through trust and community — no ad fatigue, no bots." },
  { icon: ShieldCheck, title: "Pay for Performance", desc: "Commission-based model means you only pay when a sale is made." },
];

export default function AboutBrands() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
            For Brands
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Built for Brands Targeting Young Digital Consumers
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Reach millions of socially connected young buyers through Volt’s trusted seller network across campuses, communities, and creator audiences.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-muted-foreground">
            <span>Fintech</span>
            <span className="text-primary">·</span>
            <span>Fashion</span>
            <span className="text-primary">·</span>
            <span>Apps</span>
            <span className="text-primary">·</span>
            <span>Subscriptions</span>
            <span className="text-primary">·</span>
            <span>Events</span>
            <span className="text-primary">·</span>
            <span>Lifestyle</span>
          </div>
          <div className="mt-10">
            <Button
              asChild
              size="lg"
              className="bg-primary px-8 text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <a href="https://brands.digihire.io/signup" target="_blank" rel="noopener noreferrer">
                Partner with Volt <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Promo Image */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="overflow-hidden rounded-2xl border border-border">
          <img src={heroBrands} alt="Volt brand partnerships" className="w-full h-auto object-cover" />
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <h2 className="mb-12 text-center font-display text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl volt-gradient text-primary-foreground shadow-lg">
                  <s.icon className="h-6 w-6" />
                </div>
                <span className="mb-1 text-xs font-bold text-primary">Step {i + 1}</span>
                <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-20">
        <h2 className="mb-12 text-center font-display text-3xl font-bold">Why Brands Choose Volt</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {benefits.map((b) => (
            <Card key={b.title} className="border-border/60 bg-card/80 transition-all hover:shadow-lg hover:-translate-y-1">
              <CardContent className="flex flex-col gap-3 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="volt-gradient">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground">
            Ready to Reach Gen Z?
          </h2>
          <p className="mt-3 text-primary-foreground/80">
            Join 200+ brands already selling through Volt's Gen Z seller network.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-background text-foreground px-8 font-semibold hover:bg-background/90"
          >
            <a href="https://brands.digihire.io/signup" target="_blank" rel="noopener noreferrer">
              Partner with Volt <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 md:flex-row md:justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg volt-gradient">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            Volt
          </Link>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Volt Africa</p>
        </div>
      </footer>
    </div>
  );
}


