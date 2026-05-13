import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Users, Target, TrendingUp, CheckCircle2, Mic2, Package, Globe } from "lucide-react";
import GradientBarsBackground from "@digihire/shared/components/ui/gradient-bars-background";

const CYAN = "rgb(0, 194, 255)";
const NAVY = "rgb(6, 17, 31)";

const brandLogos = [
  "9mobile", "BetKing", "Breet", "British Council", "Cardtonic",
  "Cloudmylab", "Ezipay", "Ginger", "HP", "Jumia", "Konga", "Nett", "Sabi", "Westgate"
];

const services = [
  {
    icon: MapPin,
    title: "Mall Activations",
    desc: "Take your product into high-footfall retail environments where visibility, demonstrations, and live engagement can drive awareness and conversions.",
  },
  {
    icon: Users,
    title: "Campus Activations",
    desc: "Reach student communities directly through on-ground campaigns designed for discovery, signups, trials, and product spread.",
  },
  {
    icon: Target,
    title: "High-Traffic Area Campaigns",
    desc: "Launch in neighborhoods, transport corridors, urban hotspots, and busy public spaces where real audience attention can be captured.",
  },
  {
    icon: Mic2,
    title: "Merchandiser & Field Team Deployment",
    desc: "Deploy trained merchandisers, promoters, and field marketers to support activations, product visibility, and campaign execution.",
  },
  {
    icon: Package,
    title: "Product Launch Support",
    desc: "Use field teams and structured activation plans to introduce new products into target markets with stronger presence and reach.",
  },
  {
    icon: Globe,
    title: "City-by-City Rollout",
    desc: "Execute structured campaigns across selected cities with localized teams and on-ground support built for market entry and traction.",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "We define the campaign goal",
    desc: "Awareness, lead generation, signups, product launch, retail push, or direct sales.",
  },
  {
    step: "2",
    title: "We plan the activation",
    desc: "We map the right locations, audience, staffing, and execution model.",
  },
  {
    step: "3",
    title: "We deploy the team",
    desc: "Field marketers, merchandisers, and activation staff go live across target locations.",
  },
  {
    step: "4",
    title: "We track execution",
    desc: "You get updates on coverage, activity, turnout, and campaign progress.",
  },
];

const whyChooseUs = [
  "Stronger physical market presence",
  "More direct engagement than passive advertising",
  "Flexible deployment across cities and locations",
  "Trained merchandisers and field marketers",
  "Better support for product launches and local campaigns",
  "Built for visibility, traction, and measurable activity",
];

const useCases = [
  "Product launches",
  "New city rollouts",
  "Campus awareness campaigns",
  "Retail and mall presence",
  "Lead generation drives",
  "Sampling and demo campaigns",
  "Neighborhood market coverage",
  "Temporary merchandising support",
];

const galleryImages = [
  { id: 1, alt: "Mall activation booth setup" },
  { id: 2, alt: "Field team in action" },
  { id: 3, alt: "Campus activation event" },
  { id: 4, alt: "Product demonstration" },
  { id: 5, alt: "Branded booth display" },
  { id: 6, alt: "Audience engagement" },
];

export default function DigiHireSalesActivations() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .btn-cyan {
          background: #00C2FF;
          color: #06111F;
          transition: all 0.22s ease;
        }
        .btn-cyan:hover {
          background: #33CFFF;
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(0,194,255,0.5);
        }
        .service-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.08);
          border-color: rgba(0,194,255,0.25);
        }
        .logo-item { color: #94a3b8; transition: color 0.2s; }
        .logo-item:hover { color: #475569; }
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .marquee-track { display: flex; width: max-content; animation: marquee 22s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>

      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between h-[68px] w-full px-10">
          <Link to="/digihire" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-[38px] h-[38px] rounded-full bg-[#06111F] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 18 18" className="w-5 h-5 fill-[#00C2FF]">
                <path d="M2 9C2 5.13 5.13 2 9 2s7 3.13 7 7-3.13 7-7 7S2 12.87 2 9zm7-4L6 9h3l-1 4 5-6h-3l1-2z"/>
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-[18px] text-[#06111F] tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                Digi<span className="text-[#00C2FF]">Hire</span>
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">...global access to verified talent</span>
            </div>
          </Link>
          <ul className="hidden md:flex items-center gap-1 list-none">
            <li>
              <Link to="/digihire" className="text-[14px] text-slate-600 font-medium px-3.5 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">
                Why DigiHire?
              </Link>
            </li>
            <li>
              <span className="text-[14px] text-[#00C2FF] font-semibold px-3.5 py-2">
                Brands
              </span>
            </li>
            <li>
              <Link to="/digihire#talent" className="text-[14px] text-slate-600 font-medium px-3.5 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">
                For Talents
              </Link>
            </li>
          </ul>
          <div className="flex items-center gap-3">
            <Link
              to="/login?role=brand"
              className="btn-cyan inline-flex items-center gap-2 text-[14px] font-extrabold rounded-lg px-5 py-2.5 transition-all duration-200"
              style={{ fontFamily: "'Syne', sans-serif", boxShadow: "0 3px 16px rgba(0,194,255,0.35)" }}
            >
              Launch a Campaign
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="mx-4">
        <GradientBarsBackground
          numBars={18}
          gradientFrom="rgba(0, 194, 255, 0.55)"
          gradientTo="transparent"
          animationDuration={2.5}
          backgroundColor={NAVY}
          overlay="linear-gradient(180deg, rgba(6,17,31,0.65) 0%, rgba(6,17,31,0.50) 50%, rgba(6,17,31,0.75) 100%)"
          className="min-h-[520px] rounded-b-2xl"
        >
          <div className="flex flex-col items-center text-center px-6 py-16 w-full">
            <h1
              className="font-display font-extrabold text-white leading-[1.07] tracking-tight mb-4 max-w-[800px]"
              style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 5vw, 52px)", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}
            >
              Launch on-ground campaigns that drive visibility, engagement, and sales
            </h1>
            <p className="text-white/75 max-w-[600px] mb-8 leading-relaxed" style={{ fontSize: "clamp(15px, 1.8vw, 17px)" }}>
              Digihire helps brands execute sales activations and field marketing campaigns across malls, campuses, neighborhoods, and high-traffic areas using trained merchandisers, field marketers, and activation teams built for real traction.
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <a
                href="#contact"
                className="btn-cyan inline-flex items-center gap-2 font-extrabold text-[#06111F] rounded-xl px-8 py-3.5 text-[15px] transition-all duration-200"
                style={{ fontFamily: "'Syne', sans-serif", boxShadow: "0 6px 32px rgba(0,194,255,0.45)" }}
              >
                Book a Strategy Call
              </a>
              <a
                href="#services"
                className="inline-flex items-center gap-2 font-bold text-white border border-white/30 rounded-xl px-8 py-3.5 text-[15px] hover:bg-white/10 transition-all"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Talk to Sales
              </a>
            </div>
          </div>
        </GradientBarsBackground>
      </div>

      {/* BRAND LOGOS */}
      <div className="py-8 px-4 -mt-6 relative z-10">
        <div className="max-w-6xl mx-auto bg-white border border-slate-100 rounded-2xl py-8 shadow-lg">
          <p className="text-center text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-6">
            Brands We've Worked With
          </p>
          <div className="overflow-hidden px-7">
            <div className="marquee-track">
              {[...brandLogos, ...brandLogos].map((name, i) => (
                <span key={i} className="logo-item font-display font-extrabold text-[16px] px-8" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* INTRO SECTION */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-7">
          <div className="text-center max-w-[700px] mx-auto">
            <h2
              className="font-display font-extrabold text-[#06111F] leading-tight mb-6 tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(26px, 4vw, 38px)" }}
            >
              Field execution built for brands that want real market presence
            </h2>
            <p className="text-[16px] text-slate-600 leading-relaxed">
              From product launches to sampling drives, roadshows, campus activations, and neighborhood outreach, Digihire helps brands take campaigns into real-world spaces where people can see, engage with, and act on them.
            </p>
            <p className="text-[16px] text-slate-600 leading-relaxed mt-4">
              We do not just place people on the ground. We plan, deploy, and support activation teams built to create awareness, drive signups, generate leads, and move products.
            </p>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="bg-slate-50 py-20" id="services">
        <div className="max-w-6xl mx-auto px-7">
          <p className="text-[11px] font-bold tracking-widest uppercase text-[#00C2FF] mb-3 text-center">What We Do</p>
          <h2
            className="font-display font-extrabold text-[#06111F] text-center mb-12 tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(24px, 3.5vw, 34px)" }}
          >
            Sales activations and field marketing built for real traction
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div
                key={s.title}
                className="service-card bg-white rounded-2xl p-6 border border-slate-100 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mb-4">
                  <s.icon className="w-6 h-6 text-[#00C2FF]" />
                </div>
                <h3
                  className="font-display font-bold text-[16px] text-[#06111F] mb-2"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {s.title}
                </h3>
                <p className="text-[14px] text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-7">
          <h2
            className="font-display font-extrabold text-[#06111F] text-center mb-12 tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(26px, 4vw, 36px)" }}
          >
            How Digihire activations work
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#00C2FF] text-[#06111F] flex items-center justify-center mx-auto mb-4">
                  <span className="font-display font-extrabold text-xl" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {item.step}
                  </span>
                </div>
                <h3
                  className="font-display font-bold text-[15px] text-[#06111F] mb-2"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {item.title}
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-[#06111F] py-20">
        <div className="max-w-5xl mx-auto px-7">
          <h2
            className="font-display font-extrabold text-white text-center mb-10 tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(26px, 4vw, 36px)" }}
          >
            Why brands choose Digihire for field activations
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {whyChooseUs.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#00C2FF] flex-shrink-0" />
                <span className="text-[15px] text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-7">
          <p className="text-[11px] font-bold tracking-widest uppercase text-[#00C2FF] mb-3 text-center">Built For</p>
          <h2
            className="font-display font-extrabold text-[#06111F] text-center mb-10 tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(24px, 3.5vw, 34px)" }}
          >
            When brands need boots on the ground
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {useCases.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-5 py-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-[#00C2FF]" />
                <span className="text-[14px] font-medium text-slate-700">{item}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* VISUAL GALLERY */}
      {false && (
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-7">
          <h2
            className="font-display font-extrabold text-[#06111F] text-center mb-10 tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(26px, 4vw, 36px)" }}
          >
            See our activations in action
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryImages.map((img) => (
              <div
                key={img.id}
                className="aspect-square rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center overflow-hidden"
              >
                <div className="text-center p-6">
                  <MapPin className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-[13px] text-slate-500 font-medium">{img.alt}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Placeholder for activation photo</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[13px] text-slate-500 mt-8">
            Replace with actual campaign photos, team shots, and branded booth visuals
          </p>
        </div>
      </section>
      )}

            {/* FINAL CTA */}
      <section className="bg-white py-20" id="contact">
        <div className="max-w-4xl mx-auto px-7 text-center">
          <h2
            className="font-display font-extrabold text-[#06111F] mb-4 tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4.5vw, 42px)" }}
          >
            Ready to take your brand to the field?
          </h2>
          <p className="text-[16px] text-slate-600 mb-8 max-w-[550px] mx-auto leading-relaxed">
            Talk to Digihire about your next activation, product launch, or field campaign and let's build the right on-ground strategy for your goals.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <a
              href="#"
              className="btn-cyan inline-flex items-center gap-2 font-extrabold text-[#06111F] rounded-xl px-10 py-4 text-[15px] transition-all duration-200"
              style={{ fontFamily: "'Syne', sans-serif", boxShadow: "0 6px 32px rgba(0,194,255,0.45)" }}
            >
              Book a Strategy Call
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 font-bold text-[#06111F] border border-slate-300 rounded-xl px-10 py-4 text-[15px] hover:bg-slate-50 transition-all"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Talk to Sales
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#06111F] border-t border-slate-800 py-12">
        <div className="max-w-6xl mx-auto px-7">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-[34px] h-[34px] rounded-full bg-[#00C2FF] flex items-center justify-center">
                <svg viewBox="0 0 18 18" className="w-4 h-4 fill-[#06111F]">
                  <path d="M2 9C2 5.13 5.13 2 9 2s7 3.13 7 7-3.13 7-7 7S2 12.87 2 9zm7-4L6 9h3l-1 4 5-6h-3l1-2z"/>
                </svg>
              </div>
              <span className="font-display font-extrabold text-[16px] text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                Digi<span className="text-[#00C2FF]">Hire</span>
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-[13px] text-slate-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-[13px] text-slate-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-[13px] text-slate-400 hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-[12px] text-slate-500">© 2026 Digihire. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

