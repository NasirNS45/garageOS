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
import Logo from "../components/Logo";

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Digital Job Cards",
    description:
      "Create job cards in seconds. Track vehicle, customer, description, parts, and labour — all in one place. No more paper slipping under oil-stained hands.",
    accent: "bg-blue-50 text-blue-600",
  },
  {
    icon: Wrench,
    title: "Mechanic Assignment",
    description:
      "See which mechanics are free in real time. Assign a job and it starts automatically. Reassign or unassign with one tap — no hunting through WhatsApp groups.",
    accent: "bg-amber-50 text-amber-600",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Notifications",
    description:
      "Customer gets a check-in message when their car arrives and a completion message with the invoice link when the job is done. Zero manual follow-up.",
    accent: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: FileText,
    title: "Instant Invoices",
    description:
      "Every completed job generates a clean, shareable invoice with a public link. Send it via WhatsApp, save it as a PDF — done in one tap.",
    accent: "bg-purple-50 text-purple-600",
  },
  {
    icon: BarChart3,
    title: "Revenue Summary",
    description:
      "See daily, weekly, or monthly revenue with per-mechanic breakdowns. Track collected vs outstanding. Every number you need — no manual counting.",
    accent: "bg-rose-50 text-rose-600",
  },
  {
    icon: Clock,
    title: "Customer History",
    description:
      "Search any vehicle plate or phone number to see every past visit, what was done, and what was charged. Never ask a returning customer to repeat themselves.",
    accent: "bg-teal-50 text-teal-600",
  },
  {
    icon: ListChecks,
    title: "Service Presets",
    description:
      "Pre-define your most common jobs — oil change, AC regas, brake service. Select from a list and the name, description, and labour fill in automatically. Faster intake, consistent records.",
    accent: "bg-sky-50 text-sky-600",
  },
  {
    icon: Package,
    title: "Parts Catalog",
    description:
      "Build a catalog of commonly used parts with standard prices. When adding parts to a job, start typing and autocomplete fills the name and price — no looking up prices every time.",
    accent: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Download,
    title: "CSV Export",
    description:
      "Download a complete jobs report for any date range. One tap, one file — ready for your accountant or bookkeeper. No manual copying, no WhatsApp screenshots.",
    accent: "bg-slate-100 text-slate-600",
  },
];

const STEPS = [
  {
    number: "01",
    icon: Car,
    title: "Create a job card",
    description:
      "Car arrives — open the app, type the plate number and customer name, pick a mechanic, and tap Create. Takes under 30 seconds.",
  },
  {
    number: "02",
    icon: Wrench,
    title: "Track the work",
    description:
      "Add parts as line items while the job runs. Labour updates live. Your team sees real-time job status without calling you.",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Complete and get paid",
    description:
      "Review the final bill, confirm, and the invoice is generated instantly. Customer gets a WhatsApp message with the payment total and invoice link.",
  },
];

const TESTIMONIALS = [
  {
    name: "Arshad Malik",
    role: "Owner, Malik Motors — Lahore",
    body: "Pehle har cheez paper pe likhte the. Ab sab mobile pe hai. Customers khush hain kyunke unhe WhatsApp pe invoice milti hai.",
    rating: 5,
  },
  {
    name: "Tariq Mehmood",
    role: "Owner, T.M. Auto Works — Karachi",
    body: "Daily revenue summary ne bohot faida kiya. Roz raat ko dekhta hoon kitna aya — koi hisaab kitaab ka jhanjhat nahi.",
    rating: 5,
  },
  {
    name: "Usman Raza",
    role: "Manager, Raza Workshop — Islamabad",
    body: "Mechanics ko pata rehta hai kaunsa kaam unka hai. No confusion, no missed jobs. Best decision for our workshop.",
    rating: 5,
  },
];

const STATS = [
  { value: "Mobile-first", label: "Works on any Android or iPhone, no app download" },
  { value: "2 minutes", label: "To set up your workshop and start tracking jobs" },
  { value: "Free to start", label: "No credit card, no commitments, no hidden fees" },
  { value: "Pakistan-first", label: "Built around PKR, WhatsApp, and local workshops" },
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

/** Simplified phone frame with a mini job-card UI inside */
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] select-none">
      {/* Glow behind phone */}
      <div className="absolute inset-0 -m-8 rounded-full bg-blue-600/20 blur-3xl" />

      {/* Phone shell */}
      <div className="relative rounded-[42px] bg-slate-900 p-[10px] shadow-2xl shadow-blue-900/40 ring-1 ring-white/10">
        {/* Screen */}
        <div className="overflow-hidden rounded-[34px] bg-[#F1F5F9]">
          {/* Status bar */}
          <div className="flex items-center justify-between bg-white px-5 pt-3 pb-2">
            <span className="text-[10px] font-semibold text-slate-600">9:41</span>
            <div className="h-4 w-20 rounded-full bg-slate-900" />
            <div className="flex gap-1">
              {[3, 2, 1].map((h) => (
                <div key={h} className={`w-1 rounded-sm bg-slate-700`} style={{ height: h * 4 }} />
              ))}
            </div>
          </div>

          {/* App header */}
          <div className="flex items-center justify-between bg-white px-4 py-2.5 shadow-sm border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[var(--brand)] flex items-center justify-center">
                <Wrench size={12} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100 leading-none">Ali Motors</p>
                <p className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">owner</p>
              </div>
            </div>
          </div>

          {/* Job cards */}
          <div className="px-3 py-3 space-y-2.5">
            {/* Card 1 */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <div className="bg-[#FDE047] border border-slate-800 rounded px-2 py-0.5">
                  <span className="text-[9px] font-black font-mono text-slate-900 dark:text-slate-100 tracking-wider">LEA-4821</span>
                </div>
                <span className="text-[9px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">In Progress</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-800">Muhammad Asif</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Oil change · Brake pads</p>
              <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 mt-1.5">PKR 4,500</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <div className="bg-[#FDE047] border border-slate-800 rounded px-2 py-0.5">
                  <span className="text-[9px] font-black font-mono text-slate-900 dark:text-slate-100 tracking-wider">KHI-1155</span>
                </div>
                <span className="text-[9px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pending</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-800">Fatima Zaidi</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">AC service · Toyota Corolla</p>
              <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 mt-1.5">PKR 8,000</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <div className="bg-[#FDE047] border border-slate-800 rounded px-2 py-0.5">
                  <span className="text-[9px] font-black font-mono text-slate-900 dark:text-slate-100 tracking-wider">ISB-7743</span>
                </div>
                <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Completed</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-800">Bilal Ahmed</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Engine flush · Honda Civic</p>
              <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 mt-1.5">PKR 3,200</p>
            </div>
          </div>

          {/* Bottom nav mockup */}
          <div className="flex bg-white border-t border-slate-100 dark:border-slate-700 px-2 py-2">
            {["Jobs", "History", "Summary", "Settings"].map((label, i) => (
              <div key={label} className={`flex-1 flex flex-col items-center gap-0.5 ${i === 0 ? "text-[var(--brand)]" : "text-slate-300"}`}>
                <div className={`w-4 h-1 rounded-full mb-0.5 ${i === 0 ? "bg-[var(--brand)]" : "bg-transparent"}`} />
                <div className={`w-4 h-4 rounded ${i === 0 ? "bg-blue-100" : "bg-slate-100"}`} />
                <span className="text-[7px] font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Jobs card */}
      <div className="lp-float absolute -left-8 top-6 bg-white rounded-2xl shadow-xl px-3 py-2.5 border border-slate-100 min-w-[148px]" style={{ animationDelay: "0s" }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Car size={11} className="text-[var(--brand)]" />
          <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wide">Today's Jobs</span>
        </div>
        <div className="space-y-1">
          {[
            { plate: "LEA-4821", label: "In Progress", color: "bg-blue-400" },
            { plate: "KHI-1155", label: "Pending", color: "bg-amber-400" },
            { plate: "ISB-7743", label: "Completed", color: "bg-emerald-400" },
          ].map(({ plate, label, color }) => (
            <div key={plate} className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${color} shrink-0`} />
              <span className="text-[8px] font-mono font-semibold text-slate-700">{plate}</span>
              <span className="text-[7px] text-slate-400 ml-auto">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating notification bubble */}
      <div className="lp-float absolute -right-4 top-20 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2 border border-slate-100 dark:border-slate-700 max-w-[160px]" style={{ animationDelay: "0.6s" }}>
        <div className="w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
          <MessageCircle size={12} className="text-white" />
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-900 dark:text-slate-100 leading-tight">WhatsApp Sent</p>
          <p className="text-[8px] text-slate-400 dark:text-slate-500 leading-tight">Invoice delivered ✓</p>
        </div>
      </div>

      {/* Revenue bubble */}
      <div className="lp-float absolute -left-6 bottom-28 bg-white rounded-2xl shadow-xl px-3 py-2 border border-slate-100" style={{ animationDelay: "1.2s" }}>
        <p className="text-[8px] text-slate-500 dark:text-slate-400 font-medium">Today's Revenue</p>
        <p className="text-sm font-extrabold text-slate-900">PKR 47,500</p>
        <div className="flex items-center gap-1 mt-0.5">
          <TrendingUp size={9} className="text-emerald-500" />
          <span className="text-[8px] text-emerald-600 font-semibold">+12% vs yesterday</span>
        </div>
      </div>
    </div>
  );
}

/** Workshop floor — 3 bays, side-view cars, live status */
function WorkshopFloorIllustration() {
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
      <text x="160" y="203" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1E40AF" fontFamily="system-ui, sans-serif">In Progress</text>
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
      <text x="480" y="203" textAnchor="middle" fontSize="11" fontWeight="700" fill="#92400E" fontFamily="system-ui, sans-serif">Pending</text>
      <text x="480" y="222" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)" fontFamily="system-ui, sans-serif">Unassigned</text>

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
      <text x="800" y="203" textAnchor="middle" fontSize="11" fontWeight="700" fill="#065F46" fontFamily="system-ui, sans-serif">Completed</text>
      <text x="800" y="222" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)" fontFamily="system-ui, sans-serif">Karim Khan</text>

      {/* ── Bottom status bar ── */}
      <rect x="0" y="257" width="960" height="33" fill="rgba(0,0,0,0.25)" />
      <circle cx="280" cy="273" r="4" fill="#3B82F6" />
      <text x="290" y="277" fontSize="9.5" fill="rgba(255,255,255,0.5)" fontFamily="system-ui, sans-serif">3 jobs open</text>
      <circle cx="400" cy="273" r="4" fill="#F59E0B" />
      <text x="410" y="277" fontSize="9.5" fill="rgba(255,255,255,0.5)" fontFamily="system-ui, sans-serif">2 mechanics on duty</text>
      <circle cx="560" cy="273" r="4" fill="#10B981" />
      <text x="570" y="277" fontSize="9.5" fill="rgba(255,255,255,0.5)" fontFamily="system-ui, sans-serif">PKR 15,700 billed today</text>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Landing() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo variant="full" size="sm" to="/" />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition">How it works</a>
            <a href="#testimonials" className="hover:text-slate-900 transition">Reviews</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition hidden sm:block"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white px-4 py-2 rounded-xl transition shadow-sm shadow-blue-500/20 active:scale-95"
            >
              Start free
            </Link>
            <button
              className="md:hidden p-2 -mr-2 text-slate-500 hover:text-slate-900 transition"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        {mobileNavOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-1">
            {[
              { label: "Features", href: "#features" },
              { label: "How it works", href: "#how-it-works" },
              { label: "Reviews", href: "#testimonials" },
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
              Sign in
            </Link>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#0f1f4a] to-[var(--brand-panel)] text-white">
        {/* Background texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0ibTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NGgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />

        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl translate-y-1/2" />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 lg:pt-20 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div>
              <div className="lp-fade-in inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-blue-200 mb-8 backdrop-blur-sm">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Built for Pakistani auto workshops
              </div>

              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
                <span className="block lp-fade-up" style={{ animationDelay: "80ms" }}>Run your workshop</span>
                <span className="block lp-fade-up" style={{ animationDelay: "180ms" }}>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-300">
                    like a pro.
                  </span>
                </span>
              </h1>

              <p className="lp-fade-up text-lg text-blue-100 leading-relaxed mb-10 max-w-lg" style={{ animationDelay: "280ms" }}>
                Digital job cards, mechanic assignment, parts tracking, WhatsApp
                notifications, and daily revenue — all on your phone.
                No more paper slips. No more lost invoices.
              </p>

              <div className="lp-fade-up flex flex-col sm:flex-row gap-3" style={{ animationDelay: "380ms" }}>
                <Link
                  to="/signup"
                  className="lp-glow-cta inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-amber-400 text-slate-900 font-bold px-7 py-3.5 rounded-2xl text-base transition active:scale-95"
                >
                  Start for free
                  <ChevronRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-7 py-3.5 rounded-2xl text-base transition backdrop-blur-sm"
                >
                  Sign in
                </Link>
              </div>

              <p className="lp-fade-in text-blue-300 text-sm mt-5 flex items-center gap-1.5" style={{ animationDelay: "500ms" }}>
                <CheckCircle2 size={14} className="text-emerald-400" />
                Free to start. No credit card required.
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
                <PhoneMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div
                key={s.value}
                className="lp-reveal text-center"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <p className="text-2xl font-extrabold text-white leading-tight">{s.value}</p>
                <p className="text-xs text-slate-400 mt-2 leading-snug">{s.label}</p>
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
              Workshop floor
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
              Every car tracked in real time
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              The moment a vehicle arrives it gets a digital job card. You see every
              car on your floor, who is working on it, and what it will cost — all
              from your phone.
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
              Everything you need
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-4">
              One app. Complete workshop control.
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Purpose-built for Pakistani auto workshops. Every feature solves a
              real problem — no bloat, no subscriptions to features you will never use.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, description, accent }, i) => (
              <div
                key={title}
                className="lp-reveal group p-6 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-slate-200 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${accent} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
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
              Simple workflow
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-4">
              From intake to invoice in 3 steps.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.666%+1rem)] right-[calc(16.666%+1rem)] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            {STEPS.map(({ number, icon: Icon, title, description }, i) => (
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
                <h3 className="text-lg font-bold text-slate-900 mb-3">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
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
              Workshop owners say
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-4">
              Trusted across Pakistan.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(({ name, role, body, rating }, i) => (
              <div
                key={name}
                className="lp-reveal relative p-6 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 flex flex-col"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Decorative quote mark */}
                <svg className="absolute top-5 right-6 w-8 h-8 text-slate-100" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
                <StarRating count={rating} />
                <p className="text-slate-700 text-sm leading-relaxed mt-4 flex-1">
                  &ldquo;{body}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-panel)] flex items-center justify-center text-white font-bold text-sm shrink-0 ring-2 ring-blue-100">
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">{name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: Shield, title: "Your data is yours", body: "Workshop data is fully isolated per account. No sharing, no leaks." },
              { icon: Users, title: "Owner and mechanic roles", body: "Owners see everything. Mechanics see what they need. Role-based access built in." },
              { icon: TrendingUp, title: "Works on any phone", body: "Mobile-first design. Runs perfectly on a PKR 15,000 Android — no app download needed." },
            ].map(({ icon: Icon, title, body }, i) => (
              <div
                key={title}
                className="lp-reveal flex flex-col items-center"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[var(--brand)] flex items-center justify-center mb-4 shadow-sm">
                  <Icon size={22} />
                </div>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-panel)] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0ibTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NGgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">
            Ready to go digital?
          </h2>
          <p className="text-blue-200 text-lg mb-8 leading-relaxed">
            Set up your workshop in under 2 minutes. Free to start,
            no credit card, no commitments.
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-10">
            {[
              "No credit card required",
              "Set up in 2 minutes",
              "Works on any phone",
              "Cancel anytime",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-sm text-blue-100">
                <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
                {item}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="lp-glow-cta inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-amber-400 text-slate-900 font-bold px-8 py-4 rounded-2xl text-base transition active:scale-95"
            >
              Create your workshop
              <ChevronRight size={18} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center bg-white/15 hover:bg-white/25 border border-white/25 text-white font-semibold px-8 py-4 rounded-2xl text-base transition backdrop-blur-sm"
            >
              Sign in
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
                Built for Pakistani auto workshops. Manage every job, mechanic, and invoice from your phone.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Product</p>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How it works</a></li>
                <li><Link to="/signup" className="hover:text-white transition">Create account</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Sign in</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Support</p>
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
                    WhatsApp support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <p className="text-xs text-slate-600 text-center">
              &copy; {new Date().getFullYear()} GarageOS. Built for Pakistani workshops.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
