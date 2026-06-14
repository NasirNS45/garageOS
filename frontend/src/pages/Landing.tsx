import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardList,
  BarChart3,
  Wrench,
  MessageCircle,
  FileText,
  Clock,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Star,
  Users,
  TrendingUp,
  Shield,
  Menu,
  X,
  Package,
  Download,
  ListChecks,
  Car,
} from "lucide-react";
import AuthPhoneMockup from "../components/auth/AuthPhoneMockup";
import AuthLanguageToggle from "../components/AuthLanguageToggle";
import Logo from "../components/Logo";
import { usePublicLanguage } from "../i18n/usePublicLanguage";
import { useT } from "../i18n/useT";
import type { TKey } from "../i18n/translations";

// ── Layout metadata (icons / styling only) ───────────────────────────────────

const FEATURE_META: ReadonlyArray<{
  icon: typeof ClipboardList;
  accent: string;
  titleKey: TKey;
  descKey: TKey;
}> = [
  { icon: ClipboardList, accent: "bg-blue-50 text-blue-600", titleKey: "landing.feature.jobCards.title", descKey: "landing.feature.jobCards.desc" },
  { icon: Wrench, accent: "bg-amber-50 text-amber-600", titleKey: "landing.feature.mechanic.title", descKey: "landing.feature.mechanic.desc" },
  { icon: MessageCircle, accent: "bg-emerald-50 text-emerald-600", titleKey: "landing.feature.whatsapp.title", descKey: "landing.feature.whatsapp.desc" },
  { icon: FileText, accent: "bg-purple-50 text-purple-600", titleKey: "landing.feature.invoices.title", descKey: "landing.feature.invoices.desc" },
  { icon: BarChart3, accent: "bg-rose-50 text-rose-600", titleKey: "landing.feature.revenue.title", descKey: "landing.feature.revenue.desc" },
  { icon: Clock, accent: "bg-teal-50 text-teal-600", titleKey: "landing.feature.history.title", descKey: "landing.feature.history.desc" },
  { icon: ListChecks, accent: "bg-sky-50 text-sky-600", titleKey: "landing.feature.presets.title", descKey: "landing.feature.presets.desc" },
  { icon: Package, accent: "bg-indigo-50 text-indigo-600", titleKey: "landing.feature.catalog.title", descKey: "landing.feature.catalog.desc" },
  { icon: Download, accent: "bg-slate-100 text-slate-600", titleKey: "landing.feature.csv.title", descKey: "landing.feature.csv.desc" },
];

const STEP_META: ReadonlyArray<{ number: string; icon: typeof Car; titleKey: TKey; descKey: TKey }> = [
  { number: "01", icon: Car, titleKey: "landing.step1.title", descKey: "landing.step1.desc" },
  { number: "02", icon: Wrench, titleKey: "landing.step2.title", descKey: "landing.step2.desc" },
  { number: "03", icon: CheckCircle2, titleKey: "landing.step3.title", descKey: "landing.step3.desc" },
];

const TESTIMONIAL_KEYS: ReadonlyArray<{ nameKey: TKey; roleKey: TKey; bodyKey: TKey }> = [
  { nameKey: "landing.testimonial1.name", roleKey: "landing.testimonial1.role", bodyKey: "landing.testimonial1.body" },
  { nameKey: "landing.testimonial2.name", roleKey: "landing.testimonial2.role", bodyKey: "landing.testimonial2.body" },
  { nameKey: "landing.testimonial3.name", roleKey: "landing.testimonial3.role", bodyKey: "landing.testimonial3.body" },
];

const FAQ_KEYS: ReadonlyArray<{ qKey: TKey; aKey: TKey }> = [
  { qKey: "landing.faq.cost.q", aKey: "landing.faq.cost.a" },
  { qKey: "landing.faq.phone.q", aKey: "landing.faq.phone.a" },
  { qKey: "landing.faq.whatsapp.q", aKey: "landing.faq.whatsapp.a" },
  { qKey: "landing.faq.safe.q", aKey: "landing.faq.safe.a" },
  { qKey: "landing.faq.mechanics.q", aKey: "landing.faq.mechanics.a" },
];

const MARQUEE_KEYS: readonly TKey[] = [
  "landing.marquee.oilChange",
  "landing.marquee.brakeService",
  "landing.marquee.acRegas",
  "landing.marquee.engineDiagnostics",
  "landing.marquee.wheelAlignment",
  "landing.marquee.batteryReplacement",
  "landing.marquee.suspensionWork",
  "landing.marquee.tuning",
  "landing.marquee.dentingPainting",
  "landing.marquee.carWash",
];

const STAT_KEYS: ReadonlyArray<{ valueKey: TKey; labelKey: TKey }> = [
  { valueKey: "landing.stat.mobile.value", labelKey: "landing.stat.mobile.label" },
  { valueKey: "landing.stat.setup.value", labelKey: "landing.stat.setup.label" },
  { valueKey: "landing.stat.free.value", labelKey: "landing.stat.free.label" },
  { valueKey: "landing.stat.pakistan.value", labelKey: "landing.stat.pakistan.label" },
];

const TRUST_KEYS: ReadonlyArray<{ icon: typeof Shield; titleKey: TKey; bodyKey: TKey }> = [
  { icon: Shield, titleKey: "landing.trust.data.title", bodyKey: "landing.trust.data.body" },
  { icon: Users, titleKey: "landing.trust.roles.title", bodyKey: "landing.trust.roles.body" },
  { icon: TrendingUp, titleKey: "landing.trust.phone.title", bodyKey: "landing.trust.phone.body" },
];

const CTA_BULLET_KEYS: readonly TKey[] = [
  "landing.cta.bullet1",
  "landing.cta.bullet2",
  "landing.cta.bullet3",
  "landing.cta.bullet4",
];

// ── Components ────────────────────────────────────────────────────────────────

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

/** Workshop floor — 3 bays, side-view cars, live status */
function WorkshopFloorIllustration() {
  const t = useT();

  const carBody = (color: string, darkColor: string, windowTint: string) => (
    <>
      {/* Body (main slab) */}
      <rect x="0" y="50" width="200" height="45" rx="10" fill={color} />
      {/* Cabin */}
      <rect x="48" y="16" width="104" height="42" rx="9" fill={color} />
      {/* Hood shine */}
      <rect x="6" y="53" width="40" height="5" rx="2" fill="rgba(255,255,255,0.13)" />
      {/* Trunk shine */}
      <rect x="154" y="53" width="40" height="5" rx="2" fill="rgba(255,255,255,0.08)" />
      {/* Windshield */}
      <rect x="56" y="20" width="38" height="32" rx="4" fill={windowTint} fillOpacity={0.48} />
      {/* Rear window */}
      <rect x="106" y="20" width="38" height="32" rx="4" fill={windowTint} fillOpacity={0.38} />
      {/* Roof highlight */}
      <rect x="62" y="18" width="76" height="5" rx="2" fill="rgba(255,255,255,0.2)" />
      {/* Door divider */}
      <line x1="99" y1="52" x2="99" y2="93" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" />
      {/* Front bumper */}
      <rect x="0" y="56" width="14" height="20" rx="5" fill={darkColor} />
      {/* Rear bumper */}
      <rect x="186" y="56" width="14" height="20" rx="5" fill={darkColor} />
      {/* Headlight */}
      <rect x="2" y="59" width="10" height="7" rx="2" fill="rgba(255,255,200,0.85)" />
      {/* Tail light */}
      <rect x="188" y="59" width="10" height="7" rx="2" fill="rgba(255,60,60,0.75)" />
      {/* Front wheel */}
      <circle cx="48" cy="95" r="22" fill="#1e293b" />
      <circle cx="48" cy="95" r="13" fill="#0f172a" />
      <circle cx="48" cy="95" r="4" fill="#475569" />
      {/* Rear wheel */}
      <circle cx="152" cy="95" r="22" fill="#1e293b" />
      <circle cx="152" cy="95" r="13" fill="#0f172a" />
      <circle cx="152" cy="95" r="4" fill="#475569" />
      {/* Ground shadow */}
      <ellipse cx="100" cy="118" rx="104" ry="5" fill="rgba(0,0,0,0.5)" />
    </>
  );

  return (
    <svg
      viewBox="0 0 960 290"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full"
      aria-label="Workshop floor with three car bays"
    >
      {/* Background */}
      <rect width="960" height="290" fill="#0F172A" />

      {/* Subtle floor grid */}
      {[50, 100, 150, 200, 250].map((y) => (
        <line key={y} x1="0" y1={y} x2="960" y2={y} stroke="white" strokeOpacity="0.03" strokeWidth="1" />
      ))}
      {[160, 320, 480, 640, 800].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="290" stroke="white" strokeOpacity="0.03" strokeWidth="1" />
      ))}

      {/* ── Bay 1: In Progress ── */}
      <rect x="20" y="15" width="280" height="232" rx="10" fill="rgba(37,99,235,0.07)" />
      <rect x="20" y="15" width="280" height="232" rx="10" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="8 5" />
      <text x="34" y="32" fill="#60A5FA" fontSize="10" fontWeight="700" fontFamily="monospace">BAY 01</text>
      {/* Car */}
      <g transform="translate(60, 48)">
        {carBody("#2563EB", "#1D4ED8", "#BAE6FD")}
        <rect x="72" y="59" width="56" height="14" rx="3" fill="#FDE047" />
        <text x="100" y="70" textAnchor="middle" fontSize="7.5" fontWeight="900" fontFamily="monospace" fill="#1e293b">LEA-4821</text>
      </g>
      {/* Status badge */}
      <rect x="90" y="186" width="140" height="26" rx="13" fill="#DBEAFE" />
      <text x="160" y="203" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1E40AF" fontFamily="Noto Naskh Arabic, system-ui, sans-serif">{t("landing.workshop.inProgress")}</text>
      <text x="160" y="222" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.38)" fontFamily="system-ui, sans-serif">Ali Raza</text>

      {/* ── Bay 2: Pending ── */}
      <rect x="340" y="15" width="280" height="232" rx="10" fill="rgba(217,119,6,0.07)" />
      <rect x="340" y="15" width="280" height="232" rx="10" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="8 5" />
      <text x="354" y="32" fill="#FCD34D" fontSize="10" fontWeight="700" fontFamily="monospace">BAY 02</text>
      {/* Car */}
      <g transform="translate(380, 48)">
        {carBody("#D97706", "#B45309", "#FDE68A")}
        <rect x="72" y="59" width="56" height="14" rx="3" fill="#FDE047" />
        <text x="100" y="70" textAnchor="middle" fontSize="7.5" fontWeight="900" fontFamily="monospace" fill="#1e293b">KHI-1155</text>
      </g>
      {/* Status badge */}
      <rect x="410" y="186" width="140" height="26" rx="13" fill="#FEF3C7" />
      <text x="480" y="203" textAnchor="middle" fontSize="11" fontWeight="700" fill="#92400E" fontFamily="Noto Naskh Arabic, system-ui, sans-serif">{t("landing.workshop.pending")}</text>
      <text x="480" y="222" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)" fontFamily="Noto Naskh Arabic, system-ui, sans-serif">{t("landing.workshop.unassigned")}</text>

      {/* ── Bay 3: Completed ── */}
      <rect x="660" y="15" width="280" height="232" rx="10" fill="rgba(5,150,105,0.07)" />
      <rect x="660" y="15" width="280" height="232" rx="10" stroke="#10B981" strokeWidth="1.5" strokeDasharray="8 5" />
      <text x="674" y="32" fill="#34D399" fontSize="10" fontWeight="700" fontFamily="monospace">BAY 03</text>
      {/* Car */}
      <g transform="translate(700, 48)">
        {carBody("#059669", "#047857", "#A7F3D0")}
        <rect x="72" y="59" width="56" height="14" rx="3" fill="#FDE047" />
        <text x="100" y="70" textAnchor="middle" fontSize="7.5" fontWeight="900" fontFamily="monospace" fill="#1e293b">ISB-7743</text>
      </g>
      {/* Status badge */}
      <rect x="730" y="186" width="140" height="26" rx="13" fill="#D1FAE5" />
      <text x="800" y="203" textAnchor="middle" fontSize="11" fontWeight="700" fill="#065F46" fontFamily="Noto Naskh Arabic, system-ui, sans-serif">{t("landing.workshop.completed")}</text>
      <text x="800" y="222" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)" fontFamily="system-ui, sans-serif">Karim Khan</text>

      {/* ── Bottom status bar ── */}
      <rect x="0" y="257" width="960" height="33" fill="rgba(0,0,0,0.25)" />
      <circle cx="280" cy="273" r="4" fill="#3B82F6" />
      <text x="290" y="277" fontSize="9.5" fill="rgba(255,255,255,0.5)" fontFamily="Noto Naskh Arabic, system-ui, sans-serif">{t("landing.workshop.jobsOpen")}</text>
      <circle cx="400" cy="273" r="4" fill="#F59E0B" />
      <text x="410" y="277" fontSize="9.5" fill="rgba(255,255,255,0.5)" fontFamily="Noto Naskh Arabic, system-ui, sans-serif">{t("landing.workshop.mechanicsOnDuty")}</text>
      <circle cx="560" cy="273" r="4" fill="#10B981" />
      <text x="570" y="277" fontSize="9.5" fill="rgba(255,255,255,0.5)" fontFamily="Noto Naskh Arabic, system-ui, sans-serif">{t("landing.workshop.billedToday")}</text>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Landing() {
  const t = useT();
  usePublicLanguage();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(max > 0 ? (window.scrollY / max) * 100 : 0);
      setScrolled(window.scrollY > 8);
      setShowTop(window.scrollY > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -32px 0px" }
    );
    document.querySelectorAll(".lp-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ── Scroll progress bar ── */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
          style={{ width: `${scrollPct}%` }}
        />
      </div>

      {/* ── Back to top ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={t("landing.backToTop")}
        className={`lp-top-btn ${showTop ? "show" : ""} fixed bottom-6 end-6 z-50 w-11 h-11 rounded-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white flex items-center justify-center shadow-lg shadow-blue-500/30`}
      >
        <ChevronUp size={20} />
      </button>

      {/* ── Navbar ── */}
      <header
        className={`sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-shadow duration-300 ${
          scrolled ? "shadow-md shadow-slate-900/5" : ""
        }`}
      >
        <div
          className={`max-w-6xl mx-auto px-6 flex items-center justify-between transition-all duration-300 ${
            scrolled ? "h-14" : "h-16"
          }`}
        >
          <Logo variant="full" size="sm" to="/" />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition">{t("landing.nav.features")}</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition">{t("landing.nav.howItWorks")}</a>
            <a href="#testimonials" className="hover:text-slate-900 transition">{t("landing.nav.reviews")}</a>
            <a href="#faq" className="hover:text-slate-900 transition">{t("landing.nav.faq")}</a>
          </nav>
          <div className="flex items-center gap-3">
            <AuthLanguageToggle />
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition hidden sm:block"
            >
              {t("landing.signIn")}
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white px-4 py-2 rounded-xl transition shadow-sm shadow-blue-500/20 active:scale-95"
            >
              {t("landing.startFree")}
            </Link>
            <button
              className="md:hidden p-2 -mr-2 text-slate-500 hover:text-slate-900 transition"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label={t("landing.toggleNav")}
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        {mobileNavOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-1">
            {[
              { label: t("landing.nav.features"), href: "#features" },
              { label: t("landing.nav.howItWorks"), href: "#how-it-works" },
              { label: t("landing.nav.reviews"), href: "#testimonials" },
              { label: t("landing.nav.faq"), href: "#faq" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileNavOpen(false)}
                className="block py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 border-b border-slate-50 last:border-b-0 transition"
              >
                {label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2.5 text-sm font-semibold text-[var(--brand)]"
            >
              {t("landing.signIn")}
            </Link>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#0f1f4a] to-[var(--brand-panel)] text-white">
        {/* Background texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0ibTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NGgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />

        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] -translate-y-1/2">
          <div className="lp-orb w-full h-full bg-blue-600/20 rounded-full blur-3xl" />
        </div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] translate-y-1/2">
          <div className="lp-orb w-full h-full bg-amber-500/10 rounded-full blur-3xl" style={{ animationDelay: "-7s" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 lg:pt-20 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div>
              <div className="lp-fade-in inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-blue-200 mb-8 backdrop-blur-sm">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                {t("landing.heroBadge")}
              </div>

              <h1 className="urdu-display text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
                <span className="block lp-fade-up" style={{ animationDelay: "80ms" }}>{t("landing.heroTitle1")}</span>
                <span className="block lp-fade-up" style={{ animationDelay: "180ms" }}>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-300">
                    {t("landing.heroTitle2")}
                  </span>
                </span>
              </h1>

              <p className="lp-fade-up text-lg text-blue-100 leading-relaxed mb-10 max-w-lg" style={{ animationDelay: "280ms" }}>
                {t("landing.heroSub")}
              </p>

              <div className="lp-fade-up flex flex-col sm:flex-row gap-3" style={{ animationDelay: "380ms" }}>
                <Link
                  to="/signup"
                  className="lp-glow-cta inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-amber-400 text-slate-900 font-bold px-7 py-3.5 rounded-2xl text-base transition active:scale-95"
                >
                  {t("landing.heroCtaStart")}
                  <ChevronRight size={18} className="rtl:rotate-180" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-7 py-3.5 rounded-2xl text-base transition backdrop-blur-sm"
                >
                  {t("landing.signIn")}
                </Link>
              </div>

              <p className="lp-fade-in text-blue-300 text-sm mt-5 flex items-center gap-1.5" style={{ animationDelay: "500ms" }}>
                <CheckCircle2 size={14} className="text-emerald-400" />
                {t("landing.heroNote")}
              </p>
            </div>

            {/* Right: phone in foreground, mechanic photo behind it */}
            <div className="lp-slide-right relative hidden lg:block min-h-[560px]" style={{ animationDelay: "200ms" }}>
              {/* Mechanic photo — right 65%, fades left to match hero bg */}
              <div className="absolute inset-y-0 right-0 left-[30%] rounded-3xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-blue-950/60">
                <img
                  src="/mechanic-hero.webp"
                  alt="Mechanic in workshop"
                  className="w-full h-full object-cover object-[center_12%]"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0d1c3e] via-[#0d1c3e]/50 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1c3e]/50 to-transparent pointer-events-none" />
              </div>

              {/* Phone mockup — left side, centered vertically, in front of photo */}
              <div className="absolute inset-y-0 left-0 flex items-center z-20 pl-8">
                <AuthPhoneMockup />
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="hidden lg:flex absolute bottom-5 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-blue-300/70">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">{t("landing.scrollExplore")}</span>
            <div className="w-5 h-8 rounded-full border-2 border-blue-300/40 flex justify-center pt-1.5">
              <div className="lp-scroll-dot w-1 h-1.5 rounded-full bg-blue-300/80" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Services marquee ── */}
      <section className="bg-slate-900 border-y border-white/5 py-4 overflow-hidden" aria-label="Services workshops manage with GarageOS">
        <div className="lp-marquee flex w-max items-center gap-10">
          {[...MARQUEE_KEYS, ...MARQUEE_KEYS].map((key, i) => (
            <span key={`${key}-${i}`} className="flex items-center gap-10 shrink-0">
              <span className="text-sm font-semibold text-slate-400 whitespace-nowrap">{t(key)}</span>
              <Wrench size={13} className="text-amber-500/60 shrink-0" />
            </span>
          ))}
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STAT_KEYS.map((s, i) => (
              <div
                key={s.valueKey}
                className="lp-reveal text-center"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <p className="text-2xl font-extrabold text-white leading-tight">{t(s.valueKey)}</p>
                <p className="text-xs text-slate-400 mt-2 leading-snug">{t(s.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workshop Floor Visual ── */}
      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lp-reveal text-center mb-10">
            <span className="inline-flex items-center bg-blue-50 text-[var(--brand)] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
              {t("landing.workshop.badge")}
            </span>
            <h2 className="urdu-display text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
              {t("landing.workshop.title")}
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              {t("landing.workshop.sub")}
            </p>
          </div>
          <div className="lp-reveal rounded-3xl overflow-hidden ring-1 ring-slate-200 shadow-2xl" style={{ transitionDelay: "120ms" }}>
            <WorkshopFloorIllustration />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lp-reveal text-center mb-16">
            <span className="inline-flex items-center bg-blue-50 text-[var(--brand)] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
              {t("landing.features.badge")}
            </span>
            <h2 className="urdu-display text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-4">
              {t("landing.features.title")}
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              {t("landing.features.sub")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURE_META.map(({ icon: Icon, titleKey, descKey, accent }, i) => (
              <div
                key={titleKey}
                className="lp-reveal group p-6 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-slate-200 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${accent} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">{t(titleKey)}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lp-reveal text-center mb-16">
            <span className="inline-flex items-center bg-blue-50 text-[var(--brand)] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
              {t("landing.steps.badge")}
            </span>
            <h2 className="urdu-display text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-4">
              {t("landing.steps.title")}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.666%+1rem)] right-[calc(16.666%+1rem)] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            {STEP_META.map(({ number, icon: Icon, titleKey, descKey }, i) => (
              <div
                key={number}
                className="lp-reveal relative text-center"
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[var(--brand)] flex items-center justify-center mx-auto mb-3">
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-[var(--brand)] text-white font-extrabold text-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25 relative z-10">
                  {number}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{t(titleKey)}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lp-reveal text-center mb-16">
            <span className="inline-flex items-center bg-blue-50 text-[var(--brand)] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
              {t("landing.testimonials.badge")}
            </span>
            <h2 className="urdu-display text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-4">
              {t("landing.testimonials.title")}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIAL_KEYS.map(({ nameKey, roleKey, bodyKey }, i) => {
              const name = t(nameKey);
              return (
              <div
                key={nameKey}
                className="lp-reveal relative p-6 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 flex flex-col"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Decorative quote mark */}
                <svg className="absolute top-5 right-6 w-8 h-8 text-slate-100" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
                <StarRating count={5} />
                <p className="urdu-display text-slate-700 text-sm leading-relaxed mt-4 flex-1">
                  &ldquo;{t(bodyKey)}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-panel)] flex items-center justify-center text-white font-bold text-sm shrink-0 ring-2 ring-blue-100">
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">{name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t(roleKey)}</p>
                  </div>
                </div>
              </div>
            );})}
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {TRUST_KEYS.map(({ icon: Icon, titleKey, bodyKey }, i) => (
              <div
                key={titleKey}
                className="lp-reveal flex flex-col items-center"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[var(--brand)] flex items-center justify-center mb-4 shadow-sm">
                  <Icon size={22} />
                </div>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{t(titleKey)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t(bodyKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="lp-reveal text-center mb-12">
            <span className="inline-flex items-center bg-blue-50 text-[var(--brand)] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
              {t("landing.faq.badge")}
            </span>
            <h2 className="urdu-display text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
              {t("landing.faq.title")}
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_KEYS.map(({ qKey, aKey }, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={qKey} className="lp-reveal">
                  <div
                    className={`rounded-2xl border ${
                      isOpen ? "border-blue-200 bg-blue-50/40" : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-bold text-slate-900">{t(qKey)}</span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-slate-400 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-[var(--brand)]" : ""
                        }`}
                      />
                    </button>
                    <div className={`lp-faq-body ${isOpen ? "open" : ""}`}>
                      <div>
                        <p className="px-5 pb-4 text-sm text-slate-500 leading-relaxed">{t(aKey)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-panel)] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0ibTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NGgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="urdu-display text-3xl lg:text-4xl font-extrabold mb-4">
            {t("landing.cta.title")}
          </h2>
          <p className="text-blue-200 text-lg mb-8 leading-relaxed">
            {t("landing.cta.sub")}
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-10">
            {CTA_BULLET_KEYS.map((key) => (
              <span key={key} className="flex items-center gap-1.5 text-sm text-blue-100">
                <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
                {t(key)}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="lp-glow-cta inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-amber-400 text-slate-900 font-bold px-8 py-4 rounded-2xl text-base transition active:scale-95"
            >
              {t("landing.cta.create")}
              <ChevronRight size={18} className="rtl:rotate-180" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center bg-white/15 hover:bg-white/25 border border-white/25 text-white font-semibold px-8 py-4 rounded-2xl text-base transition backdrop-blur-sm"
            >
              {t("landing.signIn")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-transparent" style={{ borderImage: "linear-gradient(to right, transparent, rgba(59,130,246,0.3), transparent) 1" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div>
              <Logo variant="full" size="sm" light to="/" />
              <p className="text-sm text-slate-500 mt-3 leading-relaxed max-w-xs">
                {t("landing.footer.tagline")}
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">{t("landing.footer.product")}</p>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="hover:text-white transition">{t("landing.nav.features")}</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">{t("landing.nav.howItWorks")}</a></li>
                <li><a href="#faq" className="hover:text-white transition">{t("landing.nav.faq")}</a></li>
                <li><Link to="/signup" className="hover:text-white transition">{t("landing.footer.createAccount")}</Link></li>
                <li><Link to="/login" className="hover:text-white transition">{t("landing.signIn")}</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">{t("landing.footer.support")}</p>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a
                    href="mailto:support@garageOS.pk"
                    className="hover:text-white transition"
                  >
                    support@garageOS.pk
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/923001234567"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition flex items-center gap-1.5"
                  >
                    <MessageCircle size={13} />
                    {t("landing.footer.whatsappSupport")}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <p className="text-xs text-slate-600 text-center">
              &copy; {new Date().getFullYear()} GarageOS. {t("landing.footer.copyright")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
