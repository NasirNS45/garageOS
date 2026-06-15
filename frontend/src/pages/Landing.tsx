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
  Menu,
  X,
  Package,
  Download,
  ListChecks,
} from "lucide-react";
import AuthPhoneMockup from "../components/auth/AuthPhoneMockup";
import AuthLanguageToggle from "../components/AuthLanguageToggle";
import Logo from "../components/Logo";
import {
  LandingCard,
  LandingContainer,
  LandingDarkStrip,
  LandingHeroBackdrop,
  LandingSection,
  LandingSectionHeader,
} from "../components/landing/LandingShell";
import LandingProductPreview from "../components/landing/LandingProductPreview";
import LandingStickyCta from "../components/landing/LandingStickyCta";
import { Button } from "../components/ui";
import { usePublicLanguage } from "../i18n/usePublicLanguage";
import { useT } from "../i18n/useT";
import type { TKey } from "../i18n/translations";

// ── Layout metadata (icons / styling only) ───────────────────────────────────

const FEATURE_META: ReadonlyArray<{
  id: string;
  icon: typeof ClipboardList;
  accent: string;
  titleKey: TKey;
  descKey: TKey;
  featured?: boolean;
  tier: "daily" | "customer" | "business";
}> = [
  { id: "jobCards", icon: ClipboardList, accent: "bg-[var(--brand-bg)] text-[var(--brand)]", titleKey: "landing.feature.jobCards.title", descKey: "landing.feature.jobCards.desc", featured: true, tier: "daily" },
  { id: "whatsapp", icon: MessageCircle, accent: "bg-[var(--success-bg)] text-[var(--success-fg)]", titleKey: "landing.feature.whatsapp.title", descKey: "landing.feature.whatsapp.desc", featured: true, tier: "customer" },
  { id: "mechanic", icon: Wrench, accent: "bg-[var(--warning-bg)] text-[var(--warning-fg)]", titleKey: "landing.feature.mechanic.title", descKey: "landing.feature.mechanic.desc", tier: "daily" },
  { id: "invoices", icon: FileText, accent: "bg-[var(--info-bg)] text-[var(--info-fg)]", titleKey: "landing.feature.invoices.title", descKey: "landing.feature.invoices.desc", tier: "customer" },
  { id: "revenue", icon: BarChart3, accent: "bg-[var(--danger-bg)] text-[var(--danger-fg)]", titleKey: "landing.feature.revenue.title", descKey: "landing.feature.revenue.desc", tier: "business" },
  { id: "history", icon: Clock, accent: "bg-[var(--success-bg)] text-[var(--success-fg)]", titleKey: "landing.feature.history.title", descKey: "landing.feature.history.desc", tier: "customer" },
  { id: "presets", icon: ListChecks, accent: "bg-[var(--brand-bg)] text-[var(--brand)]", titleKey: "landing.feature.presets.title", descKey: "landing.feature.presets.desc", tier: "daily" },
  { id: "catalog", icon: Package, accent: "bg-[var(--info-bg)] text-[var(--info-fg)]", titleKey: "landing.feature.catalog.title", descKey: "landing.feature.catalog.desc", tier: "business" },
  { id: "csv", icon: Download, accent: "bg-[var(--neutral-bg)] text-[var(--text-muted)]", titleKey: "landing.feature.csv.title", descKey: "landing.feature.csv.desc", tier: "business" },
];

const FEATURE_TIERS: ReadonlyArray<{ tier: "daily" | "customer" | "business"; labelKey: TKey }> = [
  { tier: "daily", labelKey: "landing.features.tierDaily" },
  { tier: "customer", labelKey: "landing.features.tierCustomer" },
  { tier: "business", labelKey: "landing.features.tierBusiness" },
];

const STEP_META: ReadonlyArray<{ number: string; titleKey: TKey; descKey: TKey }> = [
  { number: "01", titleKey: "landing.step1.title", descKey: "landing.step1.desc" },
  { number: "02", titleKey: "landing.step2.title", descKey: "landing.step2.desc" },
  { number: "03", titleKey: "landing.step3.title", descKey: "landing.step3.desc" },
];

const TESTIMONIAL_KEYS: ReadonlyArray<{
  nameKey: TKey;
  roleKey: TKey;
  bodyKey: TKey;
  cityKey: TKey;
  baysKey: TKey;
  painKey: TKey;
  trustKey: TKey;
}> = [
  { nameKey: "landing.testimonial1.name", roleKey: "landing.testimonial1.role", bodyKey: "landing.testimonial1.body", cityKey: "landing.testimonial1.city", baysKey: "landing.testimonial1.bays", painKey: "landing.testimonial1.pain", trustKey: "landing.trust.data.title" },
  { nameKey: "landing.testimonial2.name", roleKey: "landing.testimonial2.role", bodyKey: "landing.testimonial2.body", cityKey: "landing.testimonial2.city", baysKey: "landing.testimonial2.bays", painKey: "landing.testimonial2.pain", trustKey: "landing.trust.roles.title" },
  { nameKey: "landing.testimonial3.name", roleKey: "landing.testimonial3.role", bodyKey: "landing.testimonial3.body", cityKey: "landing.testimonial3.city", baysKey: "landing.testimonial3.bays", painKey: "landing.testimonial3.pain", trustKey: "landing.trust.phone.title" },
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
  { valueKey: "landing.stat.whatsapp.value", labelKey: "landing.stat.whatsapp.label" },
];

const PRICING_FREE_BULLETS: readonly TKey[] = [
  "landing.pricing.free.bullet1",
  "landing.pricing.free.bullet2",
  "landing.pricing.free.bullet3",
  "landing.pricing.free.bullet4",
];

const PRICING_FUTURE_BULLETS: readonly TKey[] = [
  "landing.pricing.future.bullet1",
  "landing.pricing.future.bullet2",
  "landing.pricing.future.bullet3",
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

function FeatureCard({
  icon: Icon,
  accent,
  titleKey,
  descKey,
  featured,
  delay,
  expanded,
  onToggle,
}: {
  icon: typeof ClipboardList;
  accent: string;
  titleKey: TKey;
  descKey: TKey;
  featured?: boolean;
  delay: number;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const t = useT();
  const collapsible = !featured && onToggle;
  const showFull = featured || expanded;

  return (
    <LandingCard
      className={`lp-reveal group p-6 transition-all duration-300 ${
        featured ? "lg:p-8 hover:shadow-[var(--shadow-md)]" : "hover:shadow-[var(--shadow-sm)]"
      } ${featured ? "lg:hover:-translate-y-1" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`w-12 h-12 rounded-[var(--r-card)] flex items-center justify-center mb-4 ${accent} ${featured ? "lg:w-14 lg:h-14" : ""} group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={featured ? 24 : 22} />
      </div>
      <h3 className={`font-bold text-[var(--text-strong)] mb-2 ${featured ? "text-lg lg:text-xl" : "text-base"}`}>
        {t(titleKey)}
      </h3>
      <p
        className={`text-sm text-[var(--text-muted)] leading-relaxed ${
          collapsible && !showFull ? "line-clamp-2 sm:line-clamp-none" : ""
        }`}
      >
        {t(descKey)}
      </p>
      {collapsible && (
        <button
          type="button"
          onClick={onToggle}
          className="sm:hidden mt-3 text-xs font-semibold text-[var(--brand)]"
        >
          {showFull ? t("landing.feature.showLess") : t("landing.feature.learnMore")}
        </button>
      )}
    </LandingCard>
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
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});

  const toggleFeature = (id: string) =>
    setExpandedFeatures((prev) => ({ ...prev, [id]: !prev[id] }));

  const navLinks = [
    { label: t("landing.nav.preview"), href: "#preview" },
    { label: t("landing.nav.features"), href: "#features" },
    { label: t("landing.nav.howItWorks"), href: "#how-it-works" },
    { label: t("landing.nav.reviews"), href: "#testimonials" },
    { label: t("landing.nav.pricing"), href: "#pricing" },
    { label: t("landing.nav.faq"), href: "#faq" },
  ];

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
    <div className="min-h-screen bg-[var(--page)] text-[var(--text-strong)] antialiased pb-20 md:pb-0">
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
        className={`sticky top-0 z-50 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)] transition-shadow duration-300 ${
          scrolled ? "shadow-[var(--shadow-md)]" : ""
        }`}
      >
        <LandingContainer
          className={`flex items-center justify-between transition-all duration-300 ${
            scrolled ? "h-14" : "h-16"
          }`}
        >
          <Logo variant="full" size="sm" to="/" />
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[var(--text-muted)]">
            {navLinks.map(({ label, href }) => (
              <a key={href} href={href} className="hover:text-[var(--text-strong)] transition">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <AuthLanguageToggle />
            <Link
              to="/login"
              className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-strong)] transition hidden sm:block"
            >
              {t("landing.signIn")}
            </Link>
            <Button size="sm" asChild>
              <Link to="/signup">{t("landing.startFree")}</Link>
            </Button>
            <button
              className="md:hidden p-2 -me-2 text-[var(--text-faint)] hover:text-[var(--text-strong)] transition"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label={t("landing.toggleNav")}
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </LandingContainer>

        {mobileNavOpen && (
          <div className="md:hidden bg-[var(--surface)] border-t border-[var(--border)]">
            <LandingContainer className="py-4 space-y-1">
              {navLinks.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileNavOpen(false)}
                  className="block py-2.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-strong)] border-b border-[var(--border)] last:border-b-0 transition"
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
            </LandingContainer>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <LandingHeroBackdrop className="lg:min-h-[calc(100dvh-3.5rem)] lg:flex lg:flex-col">
        <LandingContainer className="relative flex-1 flex flex-col justify-center pt-12 pb-12 lg:pt-16 lg:pb-16">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* Left: copy */}
            <div>
              <div className="lp-fade-in inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium backdrop-blur-sm mb-8" style={{ color: "color-mix(in srgb, white 80%, transparent)" }}>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                {t("landing.heroBadge")}
              </div>

              <h1 className="urdu-display text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6 text-white">
                <span className="block lp-fade-up" style={{ animationDelay: "80ms" }}>{t("landing.heroTitle1")}</span>
                <span className="block lp-fade-up" style={{ animationDelay: "180ms" }}>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-300">
                    {t("landing.heroTitle2")}
                  </span>
                </span>
              </h1>

              <p className="lp-fade-up text-lg leading-relaxed mb-6 max-w-lg" style={{ animationDelay: "280ms", color: "color-mix(in srgb, white 85%, transparent)" }}>
                {t("landing.heroSub")}
              </p>

              <div className="lp-fade-up flex items-start gap-3 mb-8 p-3.5 rounded-[var(--r-card)] bg-white/8 ring-1 ring-white/15 backdrop-blur-sm max-w-lg" style={{ animationDelay: "320ms" }}>
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <MessageCircle size={18} className="text-emerald-300" />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "color-mix(in srgb, white 88%, transparent)" }}>
                  {t("landing.heroWhatsapp")}
                </p>
              </div>

              <div className="lp-fade-up flex flex-col sm:flex-row gap-3" style={{ animationDelay: "380ms" }}>
                <Button size="lg" asChild className="lp-glow-cta !bg-[#F59E0B] hover:!bg-amber-400 !text-slate-900">
                  <Link to="/signup">
                    {t("landing.heroCtaStart")}
                    <ChevronRight size={18} className="rtl:rotate-180" />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild className="!bg-white/10 hover:!bg-white/20 !text-white !ring-white/20 backdrop-blur-sm">
                  <a href="#preview">{t("landing.heroSeeAction")}</a>
                </Button>
              </div>

              <p className="lp-fade-in text-sm mt-5 flex items-center gap-1.5" style={{ animationDelay: "500ms", color: "color-mix(in srgb, white 65%, transparent)" }}>
                <CheckCircle2 size={14} className="text-emerald-400" />
                {t("landing.heroNote")}
              </p>
            </div>

            {/* Mobile: phone mockup below copy */}
            <div className="lp-fade-in flex justify-center lg:hidden mt-6" data-keep-ltr>
              <AuthPhoneMockup variant="compact" />
            </div>

            {/* Desktop: phone + mechanic photo */}
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
          <div className="hidden lg:flex absolute bottom-5 left-1/2 -translate-x-1/2 flex-col items-center gap-2" style={{ color: "color-mix(in srgb, white 55%, transparent)" }}>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">{t("landing.scrollExplore")}</span>
            <div className="w-5 h-8 rounded-full border-2 border-white/30 flex justify-center pt-1.5">
              <div className="lp-scroll-dot w-1 h-1.5 rounded-full bg-white/70" />
            </div>
          </div>
        </LandingContainer>
      </LandingHeroBackdrop>

      <LandingStickyCta />

      {/* ── Marquee + stats (merged dark band) ── */}
      <LandingDarkStrip>
        <div className="py-4 overflow-hidden border-b border-white/5" aria-label="Services workshops manage with GarageOS">
          <div className="lp-marquee flex w-max items-center gap-10">
            {[...MARQUEE_KEYS, ...MARQUEE_KEYS].map((key, i) => (
              <span key={`${key}-${i}`} className="flex items-center gap-10 shrink-0">
                <span className="text-sm font-semibold text-white/50 whitespace-nowrap">{t(key)}</span>
                <Wrench size={13} className="text-amber-500/60 shrink-0" />
              </span>
            ))}
          </div>
        </div>
        <LandingContainer className="py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STAT_KEYS.map((s, i) => (
              <div
                key={s.valueKey}
                className="lp-reveal text-center"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <p className="text-2xl font-extrabold text-white leading-tight">{t(s.valueKey)}</p>
                <p className="text-xs text-white/60 mt-2 leading-snug">{t(s.labelKey)}</p>
              </div>
            ))}
          </div>
        </LandingContainer>
      </LandingDarkStrip>

      {/* ── Product preview ── */}
      <LandingSection id="preview">
        <LandingContainer>
          <LandingSectionHeader
            badge={t("landing.preview.badge")}
            title={t("landing.preview.title")}
            subtitle={t("landing.preview.sub")}
          />
          <div className="lp-reveal" style={{ transitionDelay: "100ms" }}>
            <LandingProductPreview />
            <p className="text-center text-sm text-[var(--text-faint)] mt-4">{t("landing.preview.caption")}</p>
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ── Workshop Floor Visual ── */}
      <LandingSection variant="muted">
        <LandingContainer>
          <LandingSectionHeader
            badge={t("landing.workshop.badge")}
            title={t("landing.workshop.title")}
            subtitle={t("landing.workshop.sub")}
          />
          <div className="lp-reveal relative rounded-[var(--r-card)] overflow-hidden ring-1 ring-[var(--border)] shadow-[var(--shadow-md)]" style={{ transitionDelay: "120ms" }}>
            <div className="absolute top-3 start-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--brand-panel)]/90 text-white text-xs font-semibold ring-1 ring-white/15 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t("landing.workshop.liveLabel")}
            </div>
            <WorkshopFloorIllustration />
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ── Features ── */}
      <LandingSection id="features">
        <LandingContainer>
          <LandingSectionHeader
            badge={t("landing.features.badge")}
            title={t("landing.features.title")}
            subtitle={t("landing.features.sub")}
          />

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {FEATURE_META.filter((f) => f.featured).map((feature, i) => (
              <FeatureCard
                key={feature.id}
                icon={feature.icon}
                accent={feature.accent}
                titleKey={feature.titleKey}
                descKey={feature.descKey}
                featured
                delay={i * 80}
              />
            ))}
          </div>

          {FEATURE_TIERS.map(({ tier, labelKey }) => {
            const tierFeatures = FEATURE_META.filter((f) => !f.featured && f.tier === tier);
            if (tierFeatures.length === 0) return null;
            return (
              <div key={tier} className="mb-8 last:mb-0">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-faint)] mb-4">
                  {t(labelKey)}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tierFeatures.map((feature, i) => (
                    <FeatureCard
                      key={feature.id}
                      icon={feature.icon}
                      accent={feature.accent}
                      titleKey={feature.titleKey}
                      descKey={feature.descKey}
                      delay={i * 60}
                      expanded={expandedFeatures[feature.id]}
                      onToggle={() => toggleFeature(feature.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </LandingContainer>
      </LandingSection>

      {/* ── How it works ── */}
      <LandingSection id="how-it-works" variant="muted">
        <LandingContainer>
          <LandingSectionHeader badge={t("landing.steps.badge")} title={t("landing.steps.title")} />

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.666%+1rem)] right-[calc(16.666%+1rem)] h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

            {STEP_META.map(({ number, titleKey, descKey }, i) => (
              <div
                key={number}
                className="lp-reveal relative text-center"
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="w-16 h-16 rounded-[var(--r-card)] bg-[var(--brand)] text-white font-extrabold text-2xl flex items-center justify-center mx-auto mb-6 shadow-[var(--shadow-md)] relative z-10">
                  {number}
                </div>
                <h3 className="text-lg font-bold text-[var(--text-strong)] mb-3">{t(titleKey)}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ── Testimonials ── */}
      <LandingSection id="testimonials">
        <LandingContainer>
          <LandingSectionHeader badge={t("landing.testimonials.badge")} title={t("landing.testimonials.title")} />

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIAL_KEYS.map(({ nameKey, roleKey, bodyKey, cityKey, baysKey, painKey, trustKey }, i) => {
              const name = t(nameKey);
              return (
              <LandingCard
                key={nameKey}
                className="lp-reveal relative p-6 bg-[var(--surface-2)] flex flex-col"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <svg className="absolute top-5 end-6 w-8 h-8 text-[var(--border)]" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-[var(--r-pill)] bg-[var(--brand-bg)] text-[var(--brand)]">
                    {t(cityKey)}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-[var(--r-pill)] bg-[var(--surface)] ring-1 ring-[var(--border)] text-[var(--text-muted)]">
                    {t(baysKey)}
                  </span>
                </div>
                <StarRating count={5} />
                <p className="urdu-display text-[var(--text-strong)] text-sm leading-relaxed mt-4 flex-1">
                  &ldquo;{t(bodyKey)}&rdquo;
                </p>
                <p className="text-xs text-[var(--text-faint)] mt-3 italic">{t(painKey)}</p>
                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-panel)] flex items-center justify-center text-white font-bold text-sm shrink-0 ring-2 ring-[var(--brand-bg)]">
                    {name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--text-strong)] leading-none">{name}</p>
                    <p className="text-xs text-[var(--text-faint)] mt-0.5 truncate">{t(roleKey)}</p>
                  </div>
                </div>
                <p className="mt-3 text-[10px] font-semibold text-[var(--brand)]">{t(trustKey)}</p>
              </LandingCard>
            );})}
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ── Pricing ── */}
      <LandingSection id="pricing" variant="muted">
        <LandingContainer>
          <LandingSectionHeader
            badge={t("landing.pricing.badge")}
            title={t("landing.pricing.title")}
            subtitle={t("landing.pricing.sub")}
          />

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <LandingCard className="lp-reveal p-8 ring-[var(--brand)]/30 shadow-[var(--shadow-md)]" style={{ transitionDelay: "80ms" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand)] mb-2">
                {t("landing.pricing.free.title")}
              </p>
              <p className="text-4xl font-extrabold text-[var(--text-strong)]">{t("landing.pricing.free.price")}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1 mb-6">{t("landing.pricing.free.period")}</p>
              <ul className="space-y-2.5 mb-8">
                {PRICING_FREE_BULLETS.map((key) => (
                  <li key={key} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <CheckCircle2 size={15} className="text-[var(--success-fg)] shrink-0" />
                    {t(key)}
                  </li>
                ))}
              </ul>
              <Button size="lg" fullWidth asChild>
                <Link to="/signup">{t("landing.pricing.free.cta")}</Link>
              </Button>
            </LandingCard>

            <LandingCard className="lp-reveal p-8 bg-[var(--surface)]/80" style={{ transitionDelay: "160ms" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-faint)] mb-2">
                {t("landing.pricing.future.title")}
              </p>
              <p className="text-4xl font-extrabold text-[var(--text-strong)]">{t("landing.pricing.future.price")}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1 mb-6">{t("landing.pricing.future.period")}</p>
              <ul className="space-y-2.5 mb-6">
                {PRICING_FUTURE_BULLETS.map((key) => (
                  <li key={key} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <CheckCircle2 size={15} className="text-[var(--text-faint)] shrink-0" />
                    {t(key)}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[var(--text-faint)] leading-relaxed">{t("landing.pricing.future.note")}</p>
            </LandingCard>
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ── FAQ ── */}
      <LandingSection id="faq">
        <LandingContainer narrow>
          <LandingSectionHeader badge={t("landing.faq.badge")} title={t("landing.faq.title")} />

          <div className="space-y-3">
            {FAQ_KEYS.map(({ qKey, aKey }, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={qKey} className="lp-reveal">
                  <LandingCard
                    className={isOpen ? "ring-[var(--brand)]/30 bg-[var(--brand-bg)]/30" : "hover:ring-[var(--border-strong)]"}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-start"
                    >
                      <span className="text-sm font-bold text-[var(--text-strong)]">{t(qKey)}</span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-[var(--text-faint)] transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-[var(--brand)]" : ""
                        }`}
                      />
                    </button>
                    <div className={`lp-faq-body ${isOpen ? "open" : ""}`}>
                      <div>
                        <p className="px-5 pb-4 text-sm text-[var(--text-muted)] leading-relaxed">{t(aKey)}</p>
                      </div>
                    </div>
                  </LandingCard>
                </div>
              );
            })}
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ── Final CTA ── */}
      <LandingHeroBackdrop>
        <LandingContainer narrow className="py-16 text-center">
          <h2 className="urdu-display text-3xl lg:text-4xl font-extrabold mb-4">
            {t("landing.cta.title")}
          </h2>
          <p className="text-white/75 text-lg mb-8 leading-relaxed">
            {t("landing.cta.sub")}
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-10">
            {CTA_BULLET_KEYS.map((key) => (
              <span key={key} className="flex items-center gap-1.5 text-sm text-white/80">
                <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
                {t(key)}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="!bg-[#F59E0B] hover:!bg-amber-400 !text-slate-900">
              <Link to="/signup">
                {t("landing.cta.create")}
                <ChevronRight size={18} className="rtl:rotate-180" />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild className="!bg-white/10 hover:!bg-white/20 !text-white !ring-white/20 backdrop-blur-sm">
              <Link to="/login">{t("landing.signIn")}</Link>
            </Button>
          </div>
        </LandingContainer>
      </LandingHeroBackdrop>

      {/* ── Footer ── */}
      <footer className="bg-[var(--brand-panel)] text-white/60 py-16 border-t border-white/10">
        <LandingContainer>
          <p className="text-center text-xs text-white/50 mb-8 tracking-wide">
            {t("landing.footer.credibility")}
          </p>
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            <div>
              <Logo variant="full" size="sm" light to="/" />
              <p className="text-sm text-white/50 mt-3 leading-relaxed max-w-xs">
                {t("landing.footer.tagline")}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">{t("landing.footer.product")}</p>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#preview" className="hover:text-white transition">{t("landing.nav.preview")}</a></li>
                <li><a href="#features" className="hover:text-white transition">{t("landing.nav.features")}</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">{t("landing.nav.howItWorks")}</a></li>
                <li><a href="#pricing" className="hover:text-white transition">{t("landing.nav.pricing")}</a></li>
                <li><a href="#faq" className="hover:text-white transition">{t("landing.nav.faq")}</a></li>
                <li><Link to="/signup" className="hover:text-white transition">{t("landing.footer.createAccount")}</Link></li>
                <li><Link to="/login" className="hover:text-white transition">{t("landing.signIn")}</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">{t("landing.footer.support")}</p>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href="mailto:support@garageOS.pk" className="hover:text-white transition">
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

          <div className="border-t border-white/10 pt-6">
            <p className="text-xs text-white/40 text-center">
              &copy; {new Date().getFullYear()} GarageOS. {t("landing.footer.copyright")}
            </p>
          </div>
        </LandingContainer>
      </footer>
    </div>
  );
}
