import { Link } from "react-router-dom";
import { LandingNavbar } from "@/components/LandingNavbar";
import { SEOMeta } from "@/components/seo/SEOMeta";
import { Button } from "@digihire/shared";
import { Card, CardContent } from "@digihire/shared";
import {
  UserPlus,
  Share2,
  Banknote,
  TrendingUp,
  Trophy,
  Users,
  ArrowRight,
  Zap,
  CheckCircle2,
} from "lucide-react";

const sellerTypes = [
  "Students",
  "NYSC members",
  "Fresh grads",
  "Micro-influencers",
  "Content creators",
  "Young urban youth sellers",
];

const steps = [
  { icon: UserPlus, title: "Sign Up", desc: "Create your free account and set up your seller profile." },
  { icon: Share2, title: "Share & Sell", desc: "Browse the marketplace, pick products you love, and share with your network." },
  { icon: Banknote, title: "Get Paid", desc: "Earn commissions on every confirmed sale. Request payouts anytime." },
];

const benefits = [
  { icon: TrendingUp, title: "Real Earnings", desc: "No MLM. No nonsense. Earn transparent, trackable commissions." },
  { icon: Trophy, title: "Climb Leaderboards", desc: "Compete with fellow sellers and unlock tier rewards." },
  { icon: Users, title: "Build Your Network", desc: "Refer sellers, earn bonuses, and grow your own sales squad." },
];

export default function AboutStudents() {
  return (
    <div className="min-h-screen bg-background">
      <SEOMeta
        title="For Students & Talents — VoltSquad"
        description="Join VoltSquad to sell top-brand products, earn commissions, and build your sales career. Free to join, flexible hours."
        canonical="https://voltsquad.digihire.io/about/students"
      />
      <LandingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
            For Gen Z Sellers
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Join 1K+ Sellers Earning from Real Brands on Volt
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Promote fintech apps, fashion products, gadgets, events and more and earn commissions for every sale or signup.
          </p>
        </div>
      </section>

      {/* Who can sell */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center">
          <h2 className="font-display text-2xl font-bold mb-6">Who Can Sell on Volt?</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {sellerTypes.map((type) => (
              <div key={type} className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                <CheckCircle2 className="h-4 w-4" />
                {type}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-border bg-muted/30">
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
        <h2 className="mb-12 text-center font-display text-3xl font-bold">Why Join Volt?</h2>
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
            Ready to Start Earning?
          </h2>
          <p className="mt-3 text-primary-foreground/80">
            Sign up in under a minute and start selling today.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-background text-foreground px-8 font-semibold hover:bg-background/90"
          >
            <Link to="/join-now">
              Join Volt <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
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


