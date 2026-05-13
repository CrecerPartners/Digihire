import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { LandingNavbar } from "@/components/LandingNavbar";
import { BrandsContent } from "@/components/landing/BrandsContent";
import { Button } from "@digihire/shared";
import {
  Zap,
  TrendingUp,
  Users,
  ShoppingBag,
  BarChart3,
  GraduationCap,
  Building2,
  ArrowRight,
  Star,
  BookOpen,
  Smartphone,
  Wifi,
  Landmark,
  Ticket,
  Shirt,
  CheckCircle2,
} from "lucide-react";

import heroStudent from "@/assets/hero-student.png";
import heroBrands from "@/assets/hero-brands.png";

const audiences = {
  students: {
    badge: "For Sellers",
    headline: "Promote Products. Earn Commission.",
    subtitle:
      "Work with real brands. Share products, apps, and offers with your network. Earn every time someone buys or signs up through you.",
    cta: "Start Earning",
    ctaLink: "/join-now",
    icon: GraduationCap,
    image: heroStudent,
  },
  brands: {
    badge: "For Brands",
    headline: "Only Pay for Real Sales. Not Ads.",
    subtitle:
      "Get customers through a network of active sellers across campuses, communities, and online audiences. No upfront ad spend. You only pay when results happen.",
    cta: "Start Selling",
    ctaLink: "https://brands.digihire.io/signup",
    icon: Building2,
    image: heroBrands,
  },
};

const sellerTypes = [
  "Students",
  "NYSC members",
  "Fresh grads",
  "Micro-influencers",
  "Content creators",
  "Young urban youth sellers",
];

const howItWorks = [
  { title: "Pick a product", desc: "Choose from fintech apps, gadgets, fashion items, events and more" },
  { title: "Promote it", desc: "Share with your friends, audience, or community" },
  { title: "Earn commission", desc: "Get paid when people buy or sign up through you" },
];

const whyJoin = [
  { icon: ShoppingBag, title: "Work with Real Brands", desc: "Promote products people already use — fintech apps, fashion, gadgets, subscriptions, events." },
  { icon: TrendingUp, title: "Multiple Ways to Earn", desc: "Earn from product sales, app signups, referrals, and bonuses." },
  { icon: BarChart3, title: "Everything in One Place", desc: "Track your sales, commissions, referrals, and payouts inside your wallet." },
  { icon: Star, title: "Use Ready-Made Content", desc: "Get captions, images, and media kits you can use to promote instantly." },
  { icon: Users, title: "Create Your Own Shop", desc: "Build your page, add products, and share your link to start selling." },
  { icon: GraduationCap, title: "Plan Your Earnings", desc: "Set a target and see how many sales you need to hit your income goal." },
];

const stats = [
  { value: 20, suffix: "+", label: "Locations Covered" },
  { value: 5, suffix: "K+", label: "Gen Z Sellers" },
  { value: 500, prefix: "₦", suffix: "K+", label: "Paid Out" },
  { value: 100, suffix: "+", label: "Brands & Products" },
];

const earnings = [
  { title: "Signup Bonus", desc: "Receive ₦500 when you activate your seller account." },
  { title: "Direct Sales Commission", desc: "Earn up to 30% on every product you sell." },
  { title: "Referral Commission", desc: "Earn ₦1,000 for every seller you bring who activates and completes 5 sales." },
  { title: "Performance Bonus", desc: "Unlock extra cash rewards when you hit weekly sales targets." },
  { title: "Leadership Earnings", desc: "Top-performing sellers can qualify for monthly leadership payouts." },
];

function CountUpStat({ value, prefix, suffix, label }: { value: number; prefix?: string; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const duration = 2000;
          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-3xl font-bold text-primary md:text-4xl">
        {prefix}{count.toLocaleString()}{suffix}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default function LandingPage() {
  const [tab, setTab] = useState<"students" | "brands">("students");
  const active = audiences[tab];
  const Icon = active.icon;

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-16 text-center md:pb-28 md:pt-24">
          <div className="mx-auto mb-10 inline-flex rounded-full border border-border bg-muted/60 p-1 backdrop-blur-sm">
            <button
              onClick={() => setTab("students")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                tab === "students"
                  ? "volt-gradient text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sellers
            </button>
            <button
              onClick={() => setTab("brands")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                tab === "brands"
                  ? "volt-gradient text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Brands
            </button>
          </div>

          <div key={tab} className="animate-fade-in">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl volt-gradient shadow-lg">
              <Icon className="h-7 w-7 text-primary-foreground" />
            </div>

            <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {active.badge}
            </span>

            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
              {active.headline}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
              {active.subtitle}
            </p>

            {tab === "brands" && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-muted-foreground">
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
            )}

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="volt-gradient border-0 px-8 text-base font-semibold shadow-xl hover:opacity-90"
              >
                {active.ctaLink.startsWith("http") ? (
                  <a href={active.ctaLink} target="_blank" rel="noopener noreferrer">
                    {active.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                ) : (
                  <Link to={active.ctaLink}>
                    {active.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                )}
              </Button>
              <Button variant="outline" size="lg" asChild className="px-8 text-base">
                <Link to={tab === "students" ? "/about/sellers" : "/about/brands"}>
                  Learn More
                </Link>
              </Button>
            </div>

            <div className="mt-10 overflow-hidden rounded-2xl border border-border max-w-3xl mx-auto">
              <img src={active.image} alt={active.badge} className="w-full h-auto object-cover" />
            </div>
          </div>
        </div>
      </section>

      {tab === "students" && (
        <>
          {/* Stats with count-up */}
          <section className="border-y border-border bg-muted/30">
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-12 md:grid-cols-4 md:py-16">
              {stats.map((s) => (
                <CountUpStat key={s.label} value={s.value} prefix={s.prefix} suffix={s.suffix} label={s.label} />
              ))}
            </div>
          </section>

          {/* How It Works */}
          <section className="border-b border-border bg-muted/30">
            <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
              <h2 className="mb-12 text-center font-display text-3xl font-bold md:text-4xl">How You Earn on Volt</h2>
              <div className="grid gap-8 md:grid-cols-3">
                {howItWorks.map((s, i) => (
                  <div key={s.title} className="flex flex-col items-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full volt-gradient text-xl font-bold text-primary-foreground shadow-lg">
                      {i + 1}
                    </div>
                    <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Who can sell */}
          <section className="border-b border-border bg-muted/30">
            <div className="mx-auto max-w-4xl px-4 py-12 md:py-16">
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-bold md:text-3xl">Who Can Sell on Volt?</h2>
                <p className="mt-2 text-muted-foreground">Join 1K+ Gen Z Sellers Across Nigeria</p>
              </div>
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

          {/* Earnings */}
          <section className="border-b border-border bg-muted/30">
            <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
              <div className="mb-12 text-center">
                <h2 className="font-display text-3xl font-bold md:text-4xl">Multiple Ways to Earn on Volt</h2>
                <p className="mt-3 text-muted-foreground">Start earning from day one — here's how.</p>
              </div>
              <div className="flex flex-col gap-4">
                {earnings.map((item, i) => (
                  <div key={item.title} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg volt-gradient text-sm font-bold text-primary-foreground">{i + 1}</div>
                    <div>
                      <h3 className="font-display text-base font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 text-center">
                <Button asChild size="lg" className="volt-gradient border-0 px-8 text-base font-semibold shadow-xl hover:opacity-90">
                  <Link to="/join-now">Become a Volt Seller<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Why Join */}
          <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
            <div className="mb-12 text-center">
              <h2 className="font-display text-3xl font-bold md:text-4xl">Why Join the VoltSquad?</h2>
              <p className="mt-3 text-muted-foreground">Everything you need to start earning.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {whyJoin.map((f) => (
                <div key={f.title} className="group flex items-start gap-4 rounded-xl border border-border/60 bg-card/80 p-5 transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:volt-gradient group-hover:text-primary-foreground">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Categories */}
          <section className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-0 left-1/4 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl" />
              <div className="absolute bottom-0 right-1/4 h-[250px] w-[250px] rounded-full bg-primary/5 blur-3xl" />
            </div>
            <div className="relative mx-auto max-w-5xl px-4 py-16 md:py-24">
              <div className="mb-12 text-center">
                <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Marketplace</span>
                <h2 className="font-display text-3xl font-bold md:text-4xl">Find Products That Already Sell</h2>
                <p className="mt-3 text-muted-foreground">Browse high-demand products across:</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: Smartphone, title: "Gadgets", examples: ["Power banks", "Bluetooth devices", "Fast chargers", "AirPods"], gradient: "from-blue-500/20 to-cyan-500/20" },
                  { icon: Wifi, title: "Telco Services", examples: ["Discounted data bundles", "Airtime deals"], gradient: "from-green-500/20 to-emerald-500/20" },
                  { icon: Landmark, title: "Banking & Fintech", examples: ["App signups", "Account referrals", "Fintech tools"], gradient: "from-amber-500/20 to-orange-500/20" },
                  { icon: Ticket, title: "Events", examples: ["Concert tickets", "Party passes", "Career fair registration", "Cinema tickets"], gradient: "from-purple-500/20 to-pink-500/20" },
                  { icon: Shirt, title: "Fashion & Lifestyle", examples: ["Hoodies", "Tote bags", "Shoes", "Skincare essentials"], gradient: "from-rose-500/20 to-red-500/20" },
                  { icon: BookOpen, title: "Courses", examples: ["Tech courses", "Fashion courses", "Skill-building programs"], gradient: "from-indigo-500/20 to-violet-500/20" },
                ].map((cat) => (
                  <div key={cat.title} className="group relative rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1">
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cat.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                    <div className="relative">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl volt-gradient shadow-lg">
                        <cat.icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <h3 className="font-display text-lg font-bold mb-3">{cat.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        {cat.examples.map((ex) => (
                          <span key={ex} className="rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-10 text-center text-muted-foreground">
                Pick what fits your audience and start selling immediately.
              </p>
            </div>
          </section>
        </>
      )}

      {tab === "brands" && <BrandsContent />}

      {tab === "students" && (
        <section className="volt-gradient">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center md:py-20">
            <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
              Start Earning From Your Network
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              If you can recommend products, you can earn on Volt.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="bg-background text-foreground px-8 text-base font-semibold hover:bg-background/90"
              >
                <Link to="/join-now">Join Volt Today</Link>
              </Button>
            </div>
            <p className="mt-8 text-sm font-semibold text-primary-foreground/60 uppercase tracking-wider">Built for People Who Want Results</p>
            <p className="mt-1 text-primary-foreground/80">For sellers: Earn from products you promote</p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 md:flex-row md:justify-between">
          <div className="flex flex-col items-start gap-1">
            <img src="/Volt1.png" alt="Volt Logo" className="h-7 w-auto object-contain" />
            <p className="text-xs text-muted-foreground">A performance-driven sales network</p>
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
          </nav>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Volt Africa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}


