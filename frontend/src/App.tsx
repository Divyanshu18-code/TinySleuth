import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Lock,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Receipt,
  ShoppingBag,
  Zap,
  Globe,
  Radio,
  Clock,
  Info,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { startAudit, type AuditResponse } from "./api";

// Sample test cases so user can test the UI instantly
const SAMPLE_TESTS = [
  {
    name: "Flight Booking (Drip Fees)",
    icon: "✈️",
    url: "https://demo-travel-booking.com/flights/del-to-bom",
    mockData: {
      url: "https://demo-travel-booking.com/flights/del-to-bom",
      status: "completed" as const,
      pricing: {
        currency: "₹",
        initial_price: 3499,
        final_displayed_total: 4448,
        reached_checkout: true,
        blocked_reason: null,
        charges: [
          {
            label: "Base Airfare",
            amount: 3499,
            mandatory: true,
            preselected: false,
            disclosed_before_checkout: true,
            evidence: "Published base fare on flight search page",
          },
          {
            label: "Convenience & Platform Fee",
            amount: 399,
            mandatory: true,
            preselected: false,
            disclosed_before_checkout: false,
            evidence: "Added at step 3 payment page as mandatory convenience fee",
          },
          {
            label: "Auto-Selected Trip Insurance",
            amount: 250,
            mandatory: false,
            preselected: true,
            disclosed_before_checkout: false,
            evidence: "Pre-ticked checkbox: 'Protect my trip for ₹250'",
          },
          {
            label: "Mandatory Passenger Aviation Security Fee",
            amount: 300,
            mandatory: true,
            preselected: false,
            disclosed_before_checkout: false,
            evidence: "Regulatory fee added during traveler details confirmation",
          },
        ],
      },
      message: null,
      raw_agent_result: {
        agent: "TinyFish-v1",
        run_id: "demo_flight_run_8912",
        inspection_time_sec: 42,
      },
    },
  },
  {
    name: "Electronics Store (Honest Pricing)",
    icon: "🎧",
    url: "https://demo-audiostore.com/headphones/anc-pro",
    mockData: {
      url: "https://demo-audiostore.com/headphones/anc-pro",
      status: "completed" as const,
      pricing: {
        currency: "₹",
        initial_price: 2999,
        final_displayed_total: 2999,
        reached_checkout: true,
        blocked_reason: null,
        charges: [
          {
            label: "ANC Pro Wireless Headphones",
            amount: 2999,
            mandatory: true,
            preselected: false,
            disclosed_before_checkout: true,
            evidence: "Displayed price on product description page",
          },
          {
            label: "Standard Express Delivery",
            amount: 0,
            mandatory: true,
            preselected: false,
            disclosed_before_checkout: true,
            evidence: "Free shipping applied automatically to cart",
          },
        ],
      },
      message: null,
      raw_agent_result: {
        agent: "TinyFish-v1",
        run_id: "demo_honest_run_4120",
        inspection_time_sec: 28,
      },
    },
  },
  {
    name: "Luxury Hotel (OTP Blocked)",
    icon: "🏨",
    url: "https://demo-luxury-resort.com/deluxe-villa",
    mockData: {
      url: "https://demo-luxury-resort.com/deluxe-villa",
      status: "inconclusive" as const,
      pricing: {
        currency: "₹",
        initial_price: 12500,
        final_displayed_total: null,
        reached_checkout: false,
        blocked_reason: "Site required mandatory SMS OTP verification before proceeding to guest reservation summary.",
        charges: [],
      },
      message: "Agent stopped safely: Site strictly mandated OTP verification before showing checkout fee breakdown.",
      raw_agent_result: {
        agent: "TinyFish-v1",
        step_halted: "phone_verification_modal",
      },
    },
  },
];

const SCAN_STEPS = [
  "Dispatching secure TinyFish web agent container...",
  "Loading product page & extracting initial advertised price...",
  "Adding item to cart & progressing towards guest checkout...",
  "Bypassing upsell screens & inspecting fee breakdown...",
  "Scanning line items, taxes, convenience fees & add-ons...",
  "Verifying anti-dark-pattern compliance & calculating total...",
];

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [scanSeconds, setScanSeconds] = useState(0);

  // Scanner step rotator when loading
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    let stepTimer: ReturnType<typeof setInterval>;
    if (loading) {
      setScanSeconds(0);
      setScanStepIndex(0);
      timer = setInterval(() => setScanSeconds((s) => s + 1), 1000);
      stepTimer = setInterval(() => {
        setScanStepIndex((idx) => (idx + 1) % SCAN_STEPS.length);
      }, 5500);
    }
    return () => {
      clearInterval(timer);
      clearInterval(stepTimer);
    };
  }, [loading]);

  async function handleAudit(targetUrl: string, mock?: AuditResponse) {
    setError(null);
    setResult(null);

    if (mock) {
      setLoading(true);
      // Simulate real agent scan delay for demo
      setTimeout(() => {
        setResult(mock);
        setLoading(false);
      }, 2400);
      return;
    }

    if (!isValidUrl(targetUrl)) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setLoading(true);
    try {
      const data = await startAudit(targetUrl);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run audit.");
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleAudit(url);
  }

  function copyJson() {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Price discrepancy calculations
  const pricing = result?.pricing;
  const initial = pricing?.initial_price ?? 0;
  const final = pricing?.final_displayed_total ?? 0;
  const priceDifference = Math.max(0, final - initial);
  const priceHikePercent = initial > 0 && final > initial ? Math.round(((final - initial) / initial) * 100) : 0;
  const currency = pricing?.currency ?? "₹";
  const preselectedCharges = pricing?.charges.filter((c) => c.preselected) ?? [];
  const surpriseCharges = pricing?.charges.filter((c) => c.disclosed_before_checkout === false) ?? [];

  return (
    <div className="relative min-h-screen bg-[#060913] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Animated Ambient Lights */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="animate-ambient-1 absolute -top-40 left-1/4 h-[550px] w-[550px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="animate-ambient-2 absolute top-1/3 -right-20 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[130px]" />
        <div className="animate-ambient-1 absolute bottom-10 left-1/10 h-[450px] w-[450px] rounded-full bg-cyan-600/10 blur-[110px]" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            backgroundPosition: "0 0, 20px 20px",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Navigation Bar */}
        <header className="border-b border-white/[0.07] bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/25">
                <Search className="h-5 w-5 text-white stroke-[2.5]" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-white">
                    Tiny<span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Sleuth</span>
                  </span>
                  <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
                    AI AGENT v1.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Autonomous Checkout Price Auditor</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                <Radio className="h-3 w-3 animate-pulse" />
                <span>TinyFish Engine Active</span>
              </div>
              <a
                href="#how-it-works"
                className="text-xs font-medium text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/[0.05]"
              >
                How It Works
              </a>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 py-12">
          {/* Hero Section */}
          <section className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Unmask Drip Pricing & Stealth Checkout Surcharges</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight"
            >
              Know the Real Price <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Before You Checkout
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-slate-300/80 leading-relaxed font-normal"
            >
              Paste any product or booking URL. TinySleuth dispatches an autonomous web agent that inspects
              cart totals, unearths hidden convenience fees, and flags pre-ticked add-ons — safely stopping before payment.
            </motion.p>

            {/* Quick Guarantees Pill Badges */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-400" /> Zero Payment Risk
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" /> Safe Guest Navigation
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" /> Deep DOM Inspection
              </span>
            </div>
          </section>

          {/* Interactive URL Input Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mx-auto max-w-3xl"
          >
            <form
              onSubmit={handleFormSubmit}
              className="relative rounded-2xl p-[1.5px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 shadow-2xl shadow-indigo-950/60"
            >
              <div className="flex flex-col sm:flex-row items-center gap-2 rounded-[15px] bg-slate-950/90 p-2.5 backdrop-blur-xl">
                <div className="flex flex-1 items-center gap-3 w-full px-3 py-2 text-slate-300">
                  <Globe className="h-5 w-5 text-indigo-400 shrink-0" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste product or booking link (e.g. https://amazon.in/dp/...)"
                    disabled={loading}
                    className="w-full bg-transparent text-sm sm:text-base text-white placeholder:text-slate-500 outline-none"
                  />
                  {url && !loading && (
                    <button
                      type="button"
                      onClick={() => setUrl("")}
                      className="text-xs text-slate-500 hover:text-slate-300"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !url}
                  className="w-full sm:w-auto relative group flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-bold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      <span>Auditing Site...</span>
                    </>
                  ) : (
                    <>
                      <span>Inspect Price</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Test Demo Cases */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 px-2 text-xs">
              <span className="text-slate-400 font-medium">Or test with live demo scenarios:</span>
              <div className="flex flex-wrap items-center gap-2">
                {SAMPLE_TESTS.map((test) => (
                  <button
                    key={test.name}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setUrl(test.url);
                      handleAudit(test.url, test.mockData);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white transition active:scale-95 disabled:opacity-50"
                  >
                    <span>{test.icon}</span>
                    <span>{test.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-300 backdrop-blur-md"
              >
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-rose-200">Audit Request Error</div>
                  <div className="mt-0.5 text-xs text-rose-300/90">{error}</div>
                  {error.includes("TINYFISH_API_KEY") && (
                    <div className="mt-2 text-xs text-slate-300 bg-slate-900/60 p-2 rounded border border-white/5">
                      💡 Tip: Open <code className="text-indigo-300">backend/.env</code> and set your TinyFish key, or click one of the demo scenarios above to test the dashboard immediately!
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ACTIVE SCANNING RADAR CONSOLE (Loading State) */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-10 mx-auto max-w-2xl rounded-2xl glass-panel p-8 text-center relative overflow-hidden glow-indigo"
              >
                {/* Radar Waves Visualizer */}
                <div className="relative mx-auto my-6 flex h-40 w-40 items-center justify-center">
                  <div className="absolute h-full w-full rounded-full border border-indigo-500/40 animate-radar-pulse-1" />
                  <div className="absolute h-full w-full rounded-full border border-purple-500/40 animate-radar-pulse-2" />
                  <div className="absolute h-full w-full rounded-full border border-cyan-500/40 animate-radar-pulse-3" />
                  <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-xl shadow-indigo-500/40">
                    <Search className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  <div className="absolute inset-0 border-b-2 border-indigo-400/80 animate-scan-laser" />
                </div>

                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    <span>Inspection in progress ({scanSeconds}s elapsed)</span>
                  </div>

                  <h3 className="text-lg font-bold text-white">TinyFish Agent Crawling Checkout</h3>
                  
                  {/* Current Active Step */}
                  <div className="mx-auto max-w-md rounded-xl bg-slate-900/80 border border-white/10 p-3 text-xs text-indigo-200 flex items-center justify-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-medium">{SCAN_STEPS[scanStepIndex]}</span>
                  </div>

                  <p className="text-xs text-slate-400 max-w-md mx-auto pt-2">
                    🛡️ <strong>Safety Guarantee:</strong> TinySleuth never submits card details, never inputs credentials, and strictly stops before any payment execution.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AUDIT RESULTS DASHBOARD */}
          <AnimatePresence>
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mt-12 space-y-8"
              >
                {/* Result Top Verdict Banner */}
                <div
                  className={`relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl border ${
                    result.status === "inconclusive"
                      ? "bg-amber-950/20 border-amber-500/30 glow-amber"
                      : priceDifference > 0 || preselectedCharges.length > 0
                      ? "bg-rose-950/20 border-rose-500/30 glow-rose"
                      : "bg-emerald-950/20 border-emerald-500/30 glow-emerald"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3.5 rounded-xl ${
                          result.status === "inconclusive"
                            ? "bg-amber-500/20 text-amber-400"
                            : priceDifference > 0 || preselectedCharges.length > 0
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {result.status === "inconclusive" ? (
                          <AlertTriangle className="h-7 w-7" />
                        ) : priceDifference > 0 || preselectedCharges.length > 0 ? (
                          <TrendingUp className="h-7 w-7" />
                        ) : (
                          <CheckCircle2 className="h-7 w-7" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              result.status === "inconclusive"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : priceDifference > 0 || preselectedCharges.length > 0
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {result.status === "inconclusive"
                              ? "Status: Inconclusive"
                              : priceDifference > 0 || preselectedCharges.length > 0
                              ? "Verdict: Drip Pricing Detected"
                              : "Verdict: 100% Transparent Pricing"}
                          </span>
                        </div>

                        <h2 className="mt-2 text-2xl font-black text-white">
                          {result.status === "inconclusive"
                            ? "Audit Was Inconclusive"
                            : priceDifference > 0
                            ? `Extra ${currency}${priceDifference.toLocaleString()} added during checkout (+${priceHikePercent}%)`
                            : "Price Matched! No Hidden Charges."}
                        </h2>

                        <p className="mt-1 text-sm text-slate-300/80">
                          {result.message
                            ? result.message
                            : priceDifference > 0
                            ? "The final checkout total exceeded the listed base price through additional mandatory fees or auto-selected items."
                            : "The advertised price is identical to the final cart checkout total. No unexpected platform fees found."}
                        </p>
                      </div>
                    </div>

                    {/* Reset Button */}
                    <button
                      onClick={() => {
                        setResult(null);
                        setUrl("");
                      }}
                      className="shrink-0 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition active:scale-95"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>New Audit</span>
                    </button>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                {pricing && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Initial Price */}
                    <div className="rounded-2xl glass-card p-5">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Advertised Price</span>
                        <ShoppingBag className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div className="mt-3 text-3xl font-black text-white">
                        {initial > 0 ? `${currency}${initial.toLocaleString()}` : "N/A"}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">Listed on initial product page</div>
                    </div>

                    {/* Final Checkout Total */}
                    <div className="rounded-2xl glass-card p-5">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Final Displayed Total</span>
                        <Receipt className="h-4 w-4 text-violet-400" />
                      </div>
                      <div className="mt-3 text-3xl font-black text-white">
                        {final > 0 ? `${currency}${final.toLocaleString()}` : "N/A"}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">Observed at guest checkout review</div>
                    </div>

                    {/* Price Difference / Markup */}
                    <div className="rounded-2xl glass-card p-5">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Surprise Surcharges</span>
                        <DollarSign className="h-4 w-4 text-rose-400" />
                      </div>
                      <div className={`mt-3 text-3xl font-black ${priceDifference > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {priceDifference > 0 ? `+${currency}${priceDifference.toLocaleString()}` : "₹0"}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {priceHikePercent > 0 ? `+${priceHikePercent}% over listed price` : "Zero discrepancy"}
                      </div>
                    </div>

                    {/* Dark Pattern Alerts */}
                    <div className="rounded-2xl glass-card p-5">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Dark Pattern Flags</span>
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                      </div>
                      <div className="mt-3 text-3xl font-black text-white">
                        {preselectedCharges.length + surpriseCharges.length}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {preselectedCharges.length > 0 ? "Pre-ticked add-ons detected" : "Clean checkout pattern"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Itemized Line Items & Charges Table */}
                {pricing && pricing.charges && pricing.charges.length > 0 && (
                  <div className="rounded-2xl glass-panel p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Receipt className="h-5 w-5 text-indigo-400" />
                          <span>Itemized Checkout Fee Breakdown</span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          Detailed forensic view of all line items, surcharges, and add-ons detected by the web agent.
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-800/80 border border-white/10 px-3 py-1 text-xs font-medium text-slate-300">
                        {pricing.charges.length} Line Items
                      </span>
                    </div>

                    <div className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08] bg-slate-950/40">
                      {pricing.charges.map((charge, idx) => (
                        <div key={idx} className="p-4 transition hover:bg-white/[0.02]">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-base">{charge.label}</span>

                                {/* Badges */}
                                {charge.mandatory ? (
                                  <span className="rounded bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
                                    Mandatory
                                  </span>
                                ) : (
                                  <span className="rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                                    Optional
                                  </span>
                                )}

                                {charge.preselected && (
                                  <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300 flex items-center gap-1">
                                    ⚠️ Pre-selected Add-on
                                  </span>
                                )}

                                {charge.disclosed_before_checkout === false && (
                                  <span className="rounded bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                                    Surprise Fee
                                  </span>
                                )}
                              </div>

                              {/* Evidence Note */}
                              {charge.evidence && (
                                <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                                  <Info className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                  <span className="italic">"{charge.evidence}"</span>
                                </p>
                              )}
                            </div>

                            <div className="text-right">
                              <span className="text-lg font-black text-white">
                                {charge.amount === 0 ? "FREE" : `${currency}${charge.amount.toLocaleString()}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inconclusive Explanation (if applicable) */}
                {result.status === "inconclusive" && pricing?.blocked_reason && (
                  <div className="rounded-2xl glass-card border border-amber-500/30 p-6">
                    <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Security & Guardrail Interruption</span>
                    </h3>
                    <p className="mt-2 text-sm text-slate-300">{pricing.blocked_reason}</p>
                    <p className="mt-3 text-xs text-slate-400">
                      Why did this happen? TinySleuth enforces strict consumer privacy guardrails. The agent halts immediately whenever a site demands user credentials, OTP authentication, or payment tokens to view the cart total.
                    </p>
                  </div>
                )}

                {/* Collapsible Raw Agent Evidence (For Developers / Auditors) */}
                <div className="rounded-2xl glass-card overflow-hidden">
                  <button
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="w-full flex items-center justify-between p-4 text-xs font-semibold text-slate-400 hover:text-white transition hover:bg-white/[0.02]"
                  >
                    <span className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-indigo-400" />
                      <span>Raw Forensics & Agent JSON Payload</span>
                    </span>
                    <span className="flex items-center gap-1">
                      {showRawJson ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </button>

                  <AnimatePresence>
                    {showRawJson && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="p-4 border-t border-white/[0.06] bg-slate-950/80"
                      >
                        <div className="flex items-center justify-between pb-2">
                          <span className="text-[11px] text-slate-500 font-mono">Response Object</span>
                          <button
                            onClick={copyJson}
                            className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 transition"
                          >
                            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            <span>{copied ? "Copied" : "Copy JSON"}</span>
                          </button>
                        </div>
                        <pre className="max-h-80 overflow-auto rounded-lg bg-slate-900/90 p-3 text-xs font-mono text-indigo-300/90 border border-white/5">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* HOW IT WORKS SECTION */}
          <section id="how-it-works" className="mt-24 pt-12 border-t border-white/[0.08]">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Safe & Ethical Auditing</span>
              <h2 className="mt-2 text-3xl font-extrabold text-white">How TinySleuth Works</h2>
              <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
                Built to bring complete transparency to online purchases without ever touching your personal credentials.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl glass-card p-6 relative group hover:border-indigo-500/40 transition">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">1. Autonomous Web Agent</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  A headless browser agent powered by TinyFish navigates the real merchant page just like a customer, recording base prices and cart behaviors.
                </p>
              </div>

              <div className="rounded-2xl glass-card p-6 relative group hover:border-indigo-500/40 transition">
                <div className="h-12 w-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-110 transition">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">2. Strict Guardrails</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  The agent adheres to safety rules: It stops immediately if OTP or card details are requested. If checkout cannot be completed as a guest, it marks the run Inconclusive.
                </p>
              </div>

              <div className="rounded-2xl glass-card p-6 relative group hover:border-indigo-500/40 transition">
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">3. Drip Pricing Analytics</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Our backend compares the listed price against the final total, cataloging convenience fees, sneaky pre-selected checkmarks, and undisclosed platform taxes.
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-white/[0.07] bg-slate-950/80 py-8 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">TinySleuth</span>
              <span>— Consumer Transparency Engine</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Powered by TinyFish Web Agents</span>
              <span>•</span>
              <span>FastAPI & React</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
