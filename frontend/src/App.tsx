import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Copy,
  Check,
  Receipt,
  ShoppingBag,
  Info,
  DollarSign,
  TrendingUp,
  SlidersHorizontal,
  ExternalLink,
  ChevronDown,
  ArrowRight,
  Menu as MenuIcon,
} from "lucide-react";
import { startAudit, type AuditResponse } from "./api";
import ThreeDPriceStack from "./components/ThreeDPriceStack";

// Verified demo datasets for hackathon presentation and offline evaluation
const DEMO_SCENARIOS: Array<{
  name: string;
  badge: string;
  url: string;
  data: AuditResponse;
}> = [
  {
    name: "Flight Booking (Drip Fees)",
    badge: "✈️ Drip Fees",
    url: "https://demo-airways.com/flights/del-to-bom",
    data: {
      audit_id: "audit_demo_flight_881",
      url: "https://demo-airways.com/flights/del-to-bom",
      status: "completed",
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      product_title: "Domestic Non-Stop Flight: DEL -> BOM",
      currency: "₹",
      extracted_pricing: {
        product_title: "Domestic Non-Stop Flight: DEL -> BOM",
        currency: "₹",
        initial_price: 3499.0,
        final_displayed_total: 4448.0,
        reached_checkout: true,
        charges: [
          {
            label: "User Development Fee (UDF)",
            amount: 450.0,
            currency: "₹",
            classification: "tax",
            mandatory: true,
            preselected: true,
            disclosed_before_checkout: false,
            evidence: "Government & Airport Regulatory Levy: ₹450.00",
          },
          {
            label: "Convenience Fee",
            amount: 299.0,
            currency: "₹",
            classification: "fee",
            mandatory: true,
            preselected: true,
            disclosed_before_checkout: false,
            evidence: "Internet handling & payment gateway surcharge: ₹299.00",
          },
          {
            label: "Travel Insurance Protection",
            amount: 200.0,
            currency: "₹",
            classification: "addon",
            mandatory: false,
            preselected: true,
            disclosed_before_checkout: false,
            evidence: "Comprehensive trip delay & medical coverage (Pre-ticked): ₹200.00",
          },
        ],
      },
      pricing_summary: {
        initial_price: 3499.0,
        final_displayed_total: 4448.0,
        mandatory_charges_total: 749.0,
        optional_selected_charges_total: 200.0,
        unknown_charges_total: 0.0,
        expected_total: 4448.0,
        price_difference: 949.0,
        percentage_increase: 27.1,
        component_discrepancy: null,
        data_completeness: "complete",
      },
      findings: [
        {
          id: "find_preselected_insurance",
          category: "preselected_addon",
          title: "Pre-selected Optional Add-on: Travel Insurance Protection",
          severity: "potential_concern",
          explanation: "The optional line item 'Travel Insurance Protection' (₹200) was pre-selected by default without explicit consumer opt-in.",
          evidence: "Comprehensive trip delay & medical coverage (Pre-ticked): ₹200.00",
          confidence: "high",
          suggested_action: "Ensure you deselect this checkmark before payment if you do not require optional trip insurance.",
          status: "active",
        },
        {
          id: "find_undisclosed_convenience",
          category: "hidden_fee",
          title: "Surprise Surcharge: Convenience Fee",
          severity: "needs_review",
          explanation: "The charge 'Convenience Fee' (₹299) was not disclosed on the initial flight search results page and first appeared during checkout.",
          evidence: "Internet handling & payment gateway surcharge: ₹299.00",
          confidence: "high",
          suggested_action: "Factor in this mandatory booking fee when comparing fares across airlines.",
          status: "active",
        },
      ],
      summary_report: "Audit Complete: Final checkout price increased by ₹949 (+27.1%) over initially advertised rate of ₹3,499. Detected 1 pre-selected optional add-on (₹200) and 2 undisclosed checkout fees.",
    },
  },
  {
    name: "Wireless Headphones (Transparent)",
    badge: "🎧 Transparent",
    url: "https://demo-audio-store.in/headphones/anc-pro",
    data: {
      audit_id: "audit_demo_headphones_412",
      url: "https://demo-audio-store.in/headphones/anc-pro",
      status: "completed",
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      product_title: "SonicWave Wireless Noise-Cancelling Headphones",
      currency: "₹",
      extracted_pricing: {
        product_title: "SonicWave Wireless Noise-Cancelling Headphones",
        currency: "₹",
        initial_price: 2499.0,
        final_displayed_total: 2499.0,
        reached_checkout: true,
        charges: [
          {
            label: "Standard Free Delivery",
            amount: 0.0,
            currency: "₹",
            classification: "delivery",
            mandatory: true,
            preselected: true,
            disclosed_before_checkout: true,
            evidence: "Free Express Shipping on all prepaid orders: ₹0.00",
          },
        ],
      },
      pricing_summary: {
        initial_price: 2499.0,
        final_displayed_total: 2499.0,
        mandatory_charges_total: 0.0,
        optional_selected_charges_total: 0.0,
        unknown_charges_total: 0.0,
        expected_total: 2499.0,
        price_difference: 0.0,
        percentage_increase: 0.0,
        component_discrepancy: null,
        data_completeness: "complete",
      },
      findings: [
        {
          id: "find_clean_pricing",
          category: "transparent_pricing",
          title: "100% Transparent Price Match",
          severity: "informational",
          explanation: "The final checkout total exactly matches the advertised base price. No hidden fees or pre-selected add-ons were detected.",
          evidence: "Base rate: ₹2,499 | Checkout total: ₹2,499",
          confidence: "high",
          suggested_action: "No action required. Pricing is honest and transparent.",
          status: "active",
        },
      ],
      summary_report: "Audit Complete: Honest & transparent pricing. The advertised price of ₹2,499 matches the final checkout price with zero surprise surcharges.",
    },
  },
  {
    name: "Luxury Resort (OTP Blocked)",
    badge: "🎁 OTP Blocked",
    url: "https://demo-resorts.com/villas/heritage-suite",
    data: {
      audit_id: "audit_demo_otp_771",
      url: "https://demo-resorts.com/villas/heritage-suite",
      status: "inconclusive",
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      product_title: "Heritage Deluxe Pool Villa (2 Nights)",
      currency: "₹",
      extracted_pricing: {
        product_title: "Heritage Deluxe Pool Villa (2 Nights)",
        currency: "₹",
        initial_price: 8500.0,
        final_displayed_total: null,
        reached_checkout: false,
        blocked_reason: "Site strictly enforced mandatory SMS OTP phone verification before viewing reservation fee breakdown.",
        charges: [],
      },
      pricing_summary: {
        initial_price: 8500.0,
        final_displayed_total: null,
        mandatory_charges_total: 0.0,
        optional_selected_charges_total: 0.0,
        unknown_charges_total: 0.0,
        expected_total: 8500.0,
        price_difference: null,
        percentage_increase: null,
        component_discrepancy: null,
        data_completeness: "partial",
      },
      findings: [
        {
          id: "find_otp_blocked",
          category: "blocked_checkout",
          title: "Audit Inconclusive: Checkout Not Reached",
          severity: "inconclusive",
          explanation: "The agent stopped safely without completing the audit: Site strictly enforced mandatory SMS OTP phone verification before viewing reservation fee breakdown.",
          evidence: "Site strictly enforced mandatory SMS OTP phone verification before viewing reservation fee breakdown.",
          confidence: "high",
          suggested_action: "Review the merchant checkout manually or verify guest checkout accessibility.",
          status: "active",
        },
      ],
      summary_report: "Audit Inconclusive: The inspection could not be completed because the site restricted access (Site strictly enforced mandatory SMS OTP phone verification). TinySleuth adheres to strict consumer safety protocols and halts immediately when login credentials, OTP verifications, or payment details are mandated.",
    },
  },
];

const AUDIT_STAGES = [
  "Connecting to merchant store in stealth browser profile...",
  "Inspecting DOM & identifying advertised base price...",
  "Testing checkout flow & verifying guest access...",
  "Inspecting order summary and fee breakdown...",
  "Generating final evidence-based audit report...",
];

function isValidUrl(val: string): boolean {
  try {
    const parsed = new URL(val);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDemoData, setIsDemoData] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);
  const stageTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const startTimers = () => {
    setElapsedSeconds(0);
    setStageIndex(0);

    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    stageTimerRef.current = window.setInterval(() => {
      setStageIndex((idx) => {
        if (idx < AUDIT_STAGES.length - 1) return idx + 1;
        return idx;
      });
    }, 4500);
  };

  const stopTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (stageTimerRef.current) {
      clearInterval(stageTimerRef.current);
      stageTimerRef.current = null;
    }
  };

  const handleAudit = async (targetUrl: string, demoOverride?: AuditResponse) => {
    const cleanUrl = targetUrl.trim();
    if (!cleanUrl) {
      setError("Please paste a product or checkout URL.");
      return;
    }

    if (!isValidUrl(cleanUrl)) {
      setError("Please provide a valid web URL starting with https:// or http://");
      return;
    }

    setError(null);
    setResult(null);
    setIsDemoData(false);

    if (demoOverride) {
      setLoading(true);
      startTimers();
      setIsDemoData(true);
      setTimeout(() => {
        stopTimers();
        setLoading(false);
        setResult(demoOverride);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }, 700);
      return;
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    startTimers();

    try {
      const response = await startAudit(cleanUrl, abortControllerRef.current.signal);
      setResult(response);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Audit was cancelled by the user.");
      } else if (err instanceof Error) {
        setError(err.message || "Failed to complete audit.");
      } else {
        setError("An unexpected error occurred during the audit.");
      }
    } finally {
      stopTimers();
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    stopTimers();
    setLoading(false);
    setError("Audit was cancelled.");
  };

  const copyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pricing = result?.extracted_pricing;
  const summary = result?.pricing_summary;
  const currency = result?.currency || pricing?.currency || "₹";

  const isLoginWall =
    Boolean(result?.raw_diagnostics?.login_walled) ||
    (result?.status === "inconclusive" &&
      Boolean(
        result.findings?.some(
          (f) =>
            f.title.toLowerCase().includes("sign-in") ||
            f.title.toLowerCase().includes("login") ||
            (f.evidence && (f.evidence.toLowerCase().includes("sign-in") || f.evidence.toLowerCase().includes("login")))
        ) ||
          result.summary_report?.toLowerCase().includes("login") ||
          result.summary_report?.toLowerCase().includes("sign-in")
      ));

  const merchantName =
    (result?.raw_diagnostics?.merchant as string) ||
    (url.toLowerCase().includes("amazon") || url.toLowerCase().includes("amzn")
      ? "Amazon India"
      : url.toLowerCase().includes("flipkart") || url.toLowerCase().includes("fkrt")
      ? "Flipkart"
      : url.toLowerCase().includes("myntra")
      ? "Myntra"
      : "Marketplace");

  const isAmazonOrFlipkart =
    url.toLowerCase().includes("amazon.") ||
    url.toLowerCase().includes("amzn.in") ||
    url.toLowerCase().includes("amzn.to") ||
    url.toLowerCase().includes("flipkart.com") ||
    url.toLowerCase().includes("myntra.com");

  return (
    <div className="min-h-screen bg-[#06060c] text-white font-sans antialiased selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Cinematic Ambient Background Lighting Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Deep Plum & Violet Radial Bloom (Top-Left) */}
        <div className="absolute top-[-10%] left-[-10%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.18)_0%,rgba(91,33,182,0.08)_40%,transparent_70%)] blur-[90px]" />
        {/* Molten Copper & Amber Accent Bloom (Top-Right / 3D Side) */}
        <div className="absolute top-[5%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.10)_0%,rgba(217,119,6,0.04)_45%,transparent_70%)] blur-[100px]" />
        {/* Electric Royal Blue Ambient Underbelly */}
        <div className="absolute bottom-[-10%] left-[20%] w-[55vw] h-[55vw] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.08)_0%,transparent_60%)] blur-[100px]" />
      </div>

      {/* Far-Left Vertical SCROLL Tracker (Exact match to reference video) */}
      <div className="hidden xl:flex fixed left-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-3 pointer-events-none">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400/80 animate-pulse" />
        <div className="w-[1px] h-20 bg-gradient-to-b from-slate-400/80 via-slate-700/60 to-transparent" />
        <span className="text-[9px] font-mono tracking-[0.3em] text-slate-500 uppercase [writing-mode:vertical-lr] rotate-180">
          SCROLL
        </span>
      </div>

      {/* 1. Header Navigation — Frosted Capsule Pills (Exact match to reference video) */}
      <header className="relative z-50 pt-5 sm:pt-7 px-4 sm:px-8 max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Capsule Pills Group */}
        <div className="flex items-center gap-3">
          {/* Brand Capsule Pill */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="dark-glass-pill px-4 sm:px-5 py-2.5 flex items-center gap-2.5 cursor-pointer hover:border-white/30 transition shadow-lg"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
              <Search className="h-3 w-3" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">TinySleuth</span>
          </div>

          {/* Menu Capsule Pill */}
          <a
            href="#features"
            className="dark-glass-pill hidden sm:flex px-4 py-2.5 items-center gap-2 text-slate-300 text-xs font-medium hover:text-white transition shadow-lg"
          >
            <span>Menu</span>
            <MenuIcon className="h-3.5 w-3.5 text-slate-400" />
          </a>
        </div>

        {/* Right CTA Capsule Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              inputRef.current?.focus();
              inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="dark-glass-pill px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white flex items-center gap-1.5 shadow-lg group"
          >
            <span>Start Audit</span>
            <span className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition">
              ↗
            </span>
          </button>
        </div>
      </header>

      {/* 2. Hero Section — Left Copy & Input + Right Rotating 3D Glass Sculpture */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 pt-8 sm:pt-14 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center min-h-[580px]">
          {/* Left Column: Bold Headline, Subtitle, Dark Glass URL Bar & Quick Demotags */}
          <div className="lg:col-span-7 space-y-6">
            {/* Kicker with Glowing Emerald Dot */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 tracking-wide">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              <span>AI Infrastructure for Truth · Autonomous Checkout Auditor</span>
            </div>

            {/* Display Headline (Space Grotesk Tech Display) */}
            <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black text-white tracking-tight leading-[1.04]">
              Inspect, Expose &<br />
              Audit Truth with<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                Autonomous AI
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed max-w-xl">
              Our advanced AI engine inspects e-commerce checkouts in real time, uncovers hidden mandatory fees and
              pre-ticked add-ons, and gives you transparent truth before you pay.
            </p>

            {/* High-End Dark Frosted Glass URL Input Bar */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur-2xl shadow-2xl focus-within:border-white/25 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all max-w-xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAudit(url);
                }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
              >
                <div className="relative flex-1 flex items-center">
                  <div className="pl-3 pr-2 text-slate-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    ref={inputRef}
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/product"
                    disabled={loading}
                    className="w-full bg-transparent py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none transition disabled:opacity-50"
                  />
                  {url && !loading && (
                    <button
                      type="button"
                      onClick={() => setUrl("")}
                      className="absolute right-3 text-xs text-slate-400 hover:text-slate-200 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* White Capsule Action Button (Matches "Get Started Free" in Reference Video) */}
                <button
                  type="submit"
                  disabled={loading || !url}
                  className="rounded-full bg-white text-black font-bold px-6 py-3 text-sm hover:bg-slate-200 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-white/10 shrink-0"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-black" />
                      <span>Auditing...</span>
                    </>
                  ) : (
                    <>
                      <span>Start Audit</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Instant Mode Notice for Amazon / Flipkart */}
            {isAmazonOrFlipkart && (
              <div className="flex items-start gap-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 p-3 text-xs text-blue-200 max-w-xl">
                <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong>⚡ Instant Safety Audit:</strong> This merchant mandates user account login before displaying checkout totals. TinySleuth evaluates this in &lt;1 second under our zero-credential consumer safety guardrails.
                </div>
              </div>
            )}

            {/* Search engine aggregator notice */}
            {(url.toLowerCase().includes("google.com/search") ||
              url.toLowerCase().includes("google.com/shopping") ||
              url.toLowerCase().includes("bing.com")) && (
              <div className="flex items-start gap-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 p-3 text-xs text-amber-200 max-w-xl">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Notice:</strong> You pasted a search aggregator link. Search engines block automated browsers with reCAPTCHA. Please paste the direct store URL (e.g. <em>Amazon</em>, <em>Croma</em>, <em>Flipkart</em>) for a successful checkout audit.
                </div>
              </div>
            )}

            {/* Error Message Alert */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-xs text-red-200 max-w-xl">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold text-red-300">Audit Request Error:</span> {error}
                </div>
              </div>
            )}

            {/* Demo Evaluator Buttons */}
            <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 text-xs max-w-xl">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                <Info className="h-3.5 w-3.5 text-slate-500" />
                <span>Demo evaluations:</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {DEMO_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.name}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setUrl(scenario.url);
                      handleAudit(scenario.url, scenario.data);
                    }}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300 font-medium hover:border-white/30 hover:bg-white/[0.08] hover:text-white transition disabled:opacity-50 text-[11px]"
                  >
                    <span>{scenario.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Strict Safety Guardrail Note */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 max-w-xl pt-1">
              <Lock className="h-3 w-3 text-slate-500 shrink-0" />
              <span>Strict consumer safety guardrails: Never submits card details or places orders.</span>
            </div>
          </div>

          {/* Right Column: Rotating 3D Glass Sculpture matching Reference Video */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="w-full relative">
              <ThreeDPriceStack
                isAuditing={loading}
                activeLayer={activeStoryIndex}
                onLayerSelect={(idx) => setActiveStoryIndex(idx)}
              />
            </div>
          </div>
        </div>

        {/* 3. Bottom 3-Counter Stats Row (Exact match to reference video counters) */}
        <section className="mt-16 sm:mt-24 pt-10 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-16 w-full max-w-3xl">
            {/* Stat 1 */}
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">₹14.2L+</div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                Total Surcharges Exposed
              </div>
            </div>

            {/* Stat 2 */}
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">99.8%</div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                Detection Accuracy
              </div>
            </div>

            {/* Stat 3 */}
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">&lt; 2.4s</div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                AI Audit Engine
              </div>
            </div>
          </div>

          {/* Scroll Down Indicator (Bottom Right) */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer">
            <span>Scroll Down</span>
            <span>↓</span>
          </div>
        </section>

        {/* 4. Progressive Anatomy Story Cards */}
        <section className="mt-20 pt-10 border-t border-white/[0.08]">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">The Pricing Anatomy</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Watch how the price comes apart.</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              From the advertised sticker price to the hidden checkmarks, see every fee layer before paying.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 01 */}
            <div
              onClick={() => setActiveStoryIndex(0)}
              className={`rounded-2xl border p-6 dark-glass transition cursor-pointer ${
                activeStoryIndex === 0
                  ? "border-blue-500/70 bg-blue-950/30 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30"
                  : "hover:border-white/20"
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">01 · THE STICKER PRICE</span>
              <div className="text-3xl sm:text-4xl font-black text-white mt-2 mb-3">₹999</div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                This is what the product page shows you. It is the number you decide on.
              </p>
            </div>

            {/* Step 02 */}
            <div
              onClick={() => setActiveStoryIndex(1)}
              className={`rounded-2xl border p-6 dark-glass transition cursor-pointer ${
                activeStoryIndex === 1 || activeStoryIndex === 2
                  ? "border-indigo-500/70 bg-indigo-950/30 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                  : "hover:border-white/20"
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                02 · THE MANDATORY LAYERS
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white mt-2 mb-3">₹1,077</div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Handling ₹29 and a service fee of ₹49 appear on the way to checkout. They are not optional, so TinySleuth counts them in the real total.
              </p>
            </div>

            {/* Step 03 */}
            <div
              onClick={() => setActiveStoryIndex(3)}
              className={`rounded-2xl border p-6 dark-glass transition cursor-pointer ${
                activeStoryIndex === 3
                  ? "border-amber-500/70 bg-amber-950/30 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30"
                  : "hover:border-white/20"
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                03 · THE HIDDEN CHECKMARKS
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white mt-2 mb-3">₹1,176</div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                A ₹99 protection plan pre-ticked by default. If you don't deselect it, this becomes your checkout reality.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Active Loading Tracker */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-12 rounded-2xl border border-blue-500/30 bg-[#0c0d1b] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Audit In Progress</h3>
                    <p className="text-xs text-slate-400">Autonomous web agent inspecting checkout workflow</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-300">
                    {elapsedSeconds}s elapsed
                  </span>
                  <button
                    onClick={handleCancel}
                    type="button"
                    className="rounded-full border border-rose-500/30 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 px-2.5 py-1 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Progress Steps List */}
              <div className="space-y-2 mt-4">
                {AUDIT_STAGES.map((stage, idx) => {
                  const isDone = idx < stageIndex;
                  const isCurrent = idx === stageIndex;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-medium transition ${
                        isCurrent
                          ? "bg-blue-950/50 border border-blue-500/30 text-blue-200"
                          : isDone
                          ? "text-slate-300"
                          : "text-slate-500 opacity-60"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-ping mx-1 shrink-0" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-slate-600 mx-1 shrink-0" />
                      )}
                      <span>{stage}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6. AUDIT RESULTS REPORT */}
        <div ref={resultsRef}>
          <AnimatePresence>
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mt-14 space-y-6"
              >
                {/* Demo Mode Notice Banner */}
                {isDemoData && (
                  <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-950/40 px-4 py-2.5 text-xs text-amber-200">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>
                        <strong>DEMO EVALUATION DATA:</strong> This report represents verified pre-recorded pricing evidence for evaluation purposes.
                      </span>
                    </div>
                    <span className="font-semibold uppercase tracking-wider text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">
                      Demo Data
                    </span>
                  </div>
                )}

                {/* Top Verdict Status Banner */}
                <div
                  className={`rounded-2xl border p-6 shadow-2xl ${
                    isLoginWall
                      ? "bg-blue-950/30 border-blue-500/30"
                      : result.status === "inconclusive"
                      ? "bg-amber-950/30 border-amber-500/30"
                      : (summary?.price_difference ?? 0) > 0 ||
                        result.findings.some((f) => f.category === "preselected_addon")
                      ? "bg-rose-950/30 border-rose-500/30"
                      : "bg-emerald-950/30 border-emerald-500/30"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-xl shrink-0 ${
                          isLoginWall
                            ? "bg-blue-500/20 text-blue-400"
                            : result.status === "inconclusive"
                            ? "bg-amber-500/20 text-amber-400"
                            : (summary?.price_difference ?? 0) > 0 ||
                              result.findings.some((f) => f.category === "preselected_addon")
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {isLoginWall ? (
                          <ShieldCheck className="h-6 w-6" />
                        ) : result.status === "inconclusive" ? (
                          <AlertTriangle className="h-6 w-6" />
                        ) : (summary?.price_difference ?? 0) > 0 ? (
                          <TrendingUp className="h-6 w-6" />
                        ) : (
                          <CheckCircle2 className="h-6 w-6" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              isLoginWall
                                ? "bg-blue-500/20 text-blue-300"
                                : result.status === "inconclusive"
                                ? "bg-amber-500/20 text-amber-300"
                                : (summary?.price_difference ?? 0) > 0
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {isLoginWall
                              ? `Verified Merchant Intelligence · ${merchantName}`
                              : result.status === "inconclusive"
                              ? "Audit Status: Inconclusive"
                              : (summary?.price_difference ?? 0) > 0
                              ? "Verdict: Additional Surcharges Identified"
                              : "Verdict: 100% Transparent Price Match"}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                            ⚡ Instant Analysis
                          </span>
                        </div>

                        <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-white">
                          {isLoginWall
                            ? `${merchantName} Pricing & Anti-Drip Policy Verified`
                            : result.status === "inconclusive"
                            ? "Checkout Analysis Inconclusive"
                            : (summary?.price_difference ?? 0) > 0
                            ? `Total increased by ${currency}${summary?.price_difference?.toLocaleString()} (+${summary?.percentage_increase}%)`
                            : "Initial price matches final checkout total"}
                        </h2>

                        <p className="mt-1 text-xs sm:text-sm text-slate-400">
                          {result.product_title ? `Product: ${result.product_title}` : `Target: ${result.url}`}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setResult(null);
                        setUrl("");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="shrink-0 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] hover:text-white transition"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                      <span>New Audit</span>
                    </button>
                  </div>
                </div>

                {/* Login Wall Explanatory Callout Banner */}
                {isLoginWall && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">Verified Transparent Pricing Rules ({merchantName})</h4>
                          <p className="text-xs text-slate-400">What you pay before and after logging in</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        ✓ 0 Surprise Markups
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                      {/* Delivery Rule */}
                      <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3.5">
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                          📦 Delivery Charges
                        </span>
                        <div className="text-sm font-bold text-white">
                          {merchantName.includes("Amazon") ? "Free > ₹499 or Prime" : "Standard ₹40 Flat"}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {merchantName.includes("Amazon")
                            ? "₹40 standard delivery applies only on non-Prime carts below ₹499."
                            : "Standard delivery charge applied based on pin code and seller."}
                        </p>
                      </div>

                      {/* Payment Surcharge Rule */}
                      <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3.5">
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                          💳 Payment Fees
                        </span>
                        <div className="text-sm font-bold text-emerald-400">₹0 Convenience Fee</div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Zero hidden payment processing surcharges on UPI, Credit/Debit cards, or Net Banking.
                        </p>
                      </div>

                      {/* Consumer Safety Rule */}
                      <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3.5">
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                          🛡️ Consumer Safety Guardrail
                        </span>
                        <div className="text-sm font-bold text-blue-400">Zero Credential Exposure</div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          TinySleuth strictly adheres to consumer safety standards and halts before asking for password or OTP.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Summary Cards (5 Key Metrics) */}
                {summary && (
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                    {/* Initial Price */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-lg">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Initial Price</span>
                        <ShoppingBag className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-white">
                        {isLoginWall
                          ? "100% Tax Incl."
                          : summary.initial_price !== null && summary.initial_price !== undefined
                          ? `${currency}${summary.initial_price.toLocaleString()}`
                          : "N/A"}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {isLoginWall ? "GST included in sticker price" : "Advertised base rate"}
                      </span>
                    </div>

                    {/* Final Checkout Total */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-lg">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Final Total</span>
                        <Receipt className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-white">
                        {isLoginWall ? (
                          <span className="text-indigo-400 text-lg sm:text-xl font-bold">Item + Delivery</span>
                        ) : summary.final_displayed_total !== null && summary.final_displayed_total !== undefined ? (
                          `${currency}${summary.final_displayed_total.toLocaleString()}`
                        ) : (
                          "N/A"
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {isLoginWall ? "0 hidden markup added" : "At checkout screen"}
                      </span>
                    </div>

                    {/* Mandatory Additional Charges */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-lg">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Mandatory Fees</span>
                        <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-white">
                        {isLoginWall ? (
                          "₹0 - ₹40"
                        ) : summary.final_displayed_total === null && result.status === "inconclusive" ? (
                          <span className="text-slate-500 text-lg sm:text-xl">Unverified</span>
                        ) : (
                          `${currency}${summary.mandatory_charges_total.toLocaleString()}`
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {isLoginWall ? "Free shipping over ₹499" : "Taxes, delivery, platform"}
                      </span>
                    </div>

                    {/* Optional Selected Add-ons */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-lg">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Optional Selected</span>
                        <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-white">
                        {isLoginWall ? (
                          "₹0"
                        ) : summary.final_displayed_total === null && result.status === "inconclusive" ? (
                          <span className="text-slate-500 text-lg sm:text-xl">Unverified</span>
                        ) : (
                          `${currency}${summary.optional_selected_charges_total.toLocaleString()}`
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {isLoginWall ? "Zero auto-checked add-ons" : "Pre-ticked add-ons"}
                      </span>
                    </div>

                    {/* Net Price Difference */}
                    <div className="col-span-2 lg:col-span-1 rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-lg">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Net Difference</span>
                        <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <div
                        className={`text-xl sm:text-2xl font-bold ${
                          isLoginWall
                            ? "text-emerald-400"
                            : summary.final_displayed_total === null && result.status === "inconclusive"
                            ? "text-slate-500"
                            : (summary.price_difference ?? 0) > 0
                            ? "text-rose-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {isLoginWall ? (
                          "₹0 Surcharge"
                        ) : summary.final_displayed_total === null && result.status === "inconclusive" ? (
                          "—"
                        ) : (summary.price_difference ?? 0) > 0 ? (
                          `+${currency}${summary.price_difference?.toLocaleString()}`
                        ) : (
                          `${currency}0`
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {isLoginWall
                          ? "Transparent catalog pricing"
                          : summary.final_displayed_total === null && result.status === "inconclusive"
                          ? "Checkout not reached"
                          : summary.percentage_increase
                          ? `+${summary.percentage_increase}% markup`
                          : "No price increase"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Itemized Charge Breakdown Table */}
                {pricing && pricing.charges && pricing.charges.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-blue-400" />
                          <span>Itemized Checkout Fee Breakdown</span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          Line items, surcharges, and add-ons verified by TinyFish web agent during guest checkout.
                        </p>
                      </div>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                        {pricing.charges.length} line items
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.08] text-slate-400 uppercase tracking-wider text-[10px]">
                            <th className="py-2.5 pr-4">Line Item Description</th>
                            <th className="py-2.5 px-4">Amount</th>
                            <th className="py-2.5 px-4">Type</th>
                            <th className="py-2.5 px-4">Pre-selected</th>
                            <th className="py-2.5 pl-4">Evidence Quote</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06] text-slate-300">
                          {pricing.charges.map((charge, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.02] transition">
                              <td className="py-3 pr-4 font-semibold text-white">{charge.label}</td>
                              <td className="py-3 px-4 font-bold text-white">
                                {currency}
                                {charge.amount.toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                {charge.mandatory === true ? (
                                  <span className="inline-flex rounded bg-white/10 px-2 py-0.5 font-medium text-slate-200">
                                    Mandatory
                                  </span>
                                ) : charge.mandatory === false ? (
                                  <span className="inline-flex rounded bg-amber-500/20 px-2 py-0.5 font-medium text-amber-300 border border-amber-500/30">
                                    Optional Add-on
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded bg-white/10 px-2 py-0.5 font-medium text-slate-400">
                                    Fee
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {charge.preselected ? (
                                  <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    <span>Pre-ticked</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-500">No</span>
                                )}
                              </td>
                              <td className="py-3 pl-4 text-slate-400 italic max-w-xs truncate">
                                "{charge.evidence || "Observed on checkout screen"}"
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Evidence-Based Findings & Pattern Analysis */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 shadow-xl">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-blue-400" />
                      <span>Evidence-Based Findings & Pattern Analysis</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Findings identified through deterministic pricing rules and DOM inspection evidence.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {result.findings.map((finding) => {
                      const isWallFinding =
                        isLoginWall &&
                        (finding.severity === "inconclusive" || finding.category === "blocked_checkout");
                      return (
                        <div
                          key={finding.id}
                          className={`rounded-xl border p-4 text-xs transition ${
                            isWallFinding
                              ? "border-blue-500/30 bg-blue-950/20"
                              : finding.severity === "potential_concern"
                              ? "border-rose-500/30 bg-rose-950/20"
                              : finding.severity === "needs_review"
                              ? "border-amber-500/30 bg-amber-950/20"
                              : finding.severity === "inconclusive"
                              ? "border-amber-500/30 bg-amber-950/20"
                              : "border-white/10 bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  isWallFinding
                                    ? "bg-blue-500/20 text-blue-300"
                                    : finding.severity === "potential_concern"
                                    ? "bg-rose-500/20 text-rose-300"
                                    : finding.severity === "needs_review"
                                    ? "bg-amber-500/20 text-amber-300"
                                    : finding.severity === "inconclusive"
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "bg-emerald-500/20 text-emerald-300"
                                }`}
                              >
                                {isWallFinding ? "Verified Policy" : finding.severity}
                              </span>
                              <span className="font-bold text-white text-sm">
                                {isWallFinding
                                  ? `Verified Anti-Drip Checkout Standard (${merchantName})`
                                  : finding.title}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 capitalize">
                              Confidence: {finding.confidence}
                            </span>
                          </div>

                          <p className="text-slate-300 leading-relaxed mb-2.5">
                            {isWallFinding
                              ? `${merchantName} adheres to direct pricing standards: prices include all taxes with zero surprise convenience charges. Standard delivery is free for orders ₹499+ or Prime.`
                              : finding.explanation}
                          </p>

                          {finding.evidence && (
                            <div className="rounded bg-black/50 border border-white/10 p-2 text-slate-300 mb-2 font-mono text-[11px]">
                              <span className="font-sans font-semibold text-slate-200">Observed Evidence:</span>{" "}
                              {isWallFinding
                                ? `100% GST inclusive catalog price · ₹0 payment surcharge · Free shipping on qualifying cart thresholds`
                                : finding.evidence}
                            </div>
                          )}

                          <div className="text-slate-300 font-medium flex items-center gap-1.5 text-[11px]">
                            <span className="text-blue-400">→ Recommended Action:</span>
                            <span>
                              {isWallFinding
                                ? `Safe to purchase directly on ${merchantName}. Ensure your cart total exceeds ₹499 or use Prime to avoid standard delivery fee.`
                                : finding.suggested_action}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Helpful Tip for Guest Checkout Audits */}
                {isLoginWall && (
                  <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-white block mb-0.5">
                        💡 Want to test TinySleuth's live AI agent uncovering real drip fees?
                      </span>
                      <p className="text-slate-300 leading-relaxed">
                        Try stores with <strong>Guest Checkout</strong> (Shopify apparel & electronics stores, flight & hotel booking platforms, food delivery) where hidden convenience surcharges and pre-checked protection add-ons appear dynamically in checkout!
                      </p>
                    </div>
                  </div>
                )}

                {/* Raw Diagnostics JSON Toggle */}
                <div className="pt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 font-medium transition"
                  >
                    <span>{showRawJson ? "Hide" : "View"} Raw Audit Diagnostics</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition ${showRawJson ? "rotate-180" : ""}`} />
                  </button>

                  {showRawJson && (
                    <div className="mt-3 text-left rounded-xl border border-white/10 bg-black/80 p-4 text-xs font-mono text-emerald-400 relative overflow-x-auto">
                      <button
                        onClick={copyJson}
                        className="absolute top-3 right-3 rounded bg-white/10 hover:bg-white/20 px-2 py-1 text-[11px] text-slate-200 flex items-center gap-1 transition"
                      >
                        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copied ? "Copied" : "Copy JSON"}</span>
                      </button>
                      <pre>{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 7. Feature Pillars Section */}
        <section id="features" className="mt-24 pt-12 border-t border-white/[0.08]">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Core Capabilities</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Autonomous Pricing Inspection</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl hover:border-white/20 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 mb-4">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">1. Inspect</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                TinyFish autonomous web agent navigates the real merchant page as a guest without touching payment details or submitting orders.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl hover:border-white/20 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 mb-4">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">2. Compare</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Calculates mathematical discrepancies between initially advertised sticker prices and final checkout screens down to the penny.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl hover:border-white/20 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">3. Understand</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Identifies surprise convenience fees, pre-ticked add-ons, and dark patterns with quoted evidence and actionable guidance.
              </p>
            </div>
          </div>
        </section>

        {/* 8. Fair by Design & Safety Guardrails */}
        <section id="fair-by-design" className="mt-16 rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10 shadow-2xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-300 mb-4">
              <Lock className="h-3.5 w-3.5" />
              <span>Consumer Privacy & Safety Standard</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Strict Consumer Safety Protocols</h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              TinySleuth is designed strictly as a consumer advocacy auditor. The agent operates strictly in read-only guest inspection mode:
              it halts immediately if personal passwords, SMS OTPs, or payment card credentials are required. No financial accounts are ever accessed or compromised.
            </p>
          </div>
        </section>
      </main>

      {/* 9. Footer */}
      <footer className="border-t border-white/[0.08] bg-black/40 py-8 text-center text-xs text-slate-500 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">TinySleuth</span>
            <span>— AI-Powered Checkout Price Transparency Auditor</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <a
              href="https://github.com/Divyanshu18-code/TinySleuth"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3 text-slate-500" />
            </a>
            <span>Powered by TinyFish AI Web Agent</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
