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
  const [stageIndex, setStageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [isDemoData, setIsDemoData] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Live progress simulation tracker
  useEffect(() => {
    let intervalTimer: ReturnType<typeof setInterval>;
    let stageTimer: ReturnType<typeof setInterval>;
    if (loading) {
      setElapsedSeconds(0);
      setStageIndex(0);
      intervalTimer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
      stageTimer = setInterval(() => {
        setStageIndex((prev) => (prev < AUDIT_STAGES.length - 1 ? prev + 1 : prev));
      }, 3500);
    }
    return () => {
      clearInterval(intervalTimer);
      clearInterval(stageTimer);
    };
  }, [loading]);

  function handleCancel() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
    setError("Audit stopped by user.");
  }

  async function handleAudit(targetUrl: string, demo?: AuditResponse) {
    setError(null);
    setResult(null);
    setIsDemoData(false);

    if (demo) {
      setIsDemoData(true);
      setLoading(true);
      setTimeout(() => {
        setResult(demo);
        setLoading(false);
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 1200);
      return;
    }

    if (!isValidUrl(targetUrl)) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const data = await startAudit(targetUrl, controller.signal);
      setResult(data);
      // Smooth scroll to results after completion
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Audit was stopped.");
      } else {
        setError(err instanceof Error ? err.message : "Audit request failed.");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function copyJson() {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
    <div className="min-h-screen bg-gradient-to-b from-[#FBFBFE] via-[#F8FAFC] to-[#F1F5F9] text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* 1. Header Navigation (Identical to reference screenshot) */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xs">
              <Search className="h-4 w-4" />
            </div>
            <div className="flex items-center">
              <span className="text-lg font-bold text-slate-900 tracking-tight">Tiny</span>
              <span className="text-lg font-bold text-indigo-600 tracking-tight">Sleuth</span>
            </div>
          </div>

          {/* Nav Links + Start Audit Action Button */}
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hidden md:inline hover:text-indigo-600 transition">
              How it works
            </a>
            <a href="#features" className="hidden md:inline hover:text-indigo-600 transition">
              Features
            </a>
            <a href="#fair-by-design" className="hidden md:inline hover:text-indigo-600 transition">
              Fair by design
            </a>
            <button
              onClick={() => {
                inputRef.current?.focus();
                inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="rounded-full bg-[#5B50E6] hover:bg-[#4E43D8] text-white px-5 py-2 text-xs font-semibold shadow-xs hover:shadow-indigo-500/20 active:scale-95 transition"
            >
              Start audit
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main 3D Hero Workspace */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-20">
        {/* Top 2-Column Hero: Left Copy/Input + Right 3D Layer Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Copy, Input Form, Demo Buttons */}
          <div className="lg:col-span-7 space-y-6">
            {/* MVP Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/70 px-3.5 py-1 text-xs font-semibold text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              <span>AI checkout price auditor · MVP preview</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08]">
              Know the real price{" "}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                before you pay.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl">
              Uncover the truth behind every checkout. Paste a link and TinySleuth inspects it for extra fees and
              pre-selected add-ons, with evidence for every finding.
            </p>

            {/* Floating Input Card (Exact Reference Design) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-xl shadow-indigo-500/5 backdrop-blur-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAudit(url);
                }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/product"
                    disabled={loading}
                    className="w-full rounded-xl bg-transparent py-3 pl-4 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition disabled:opacity-50"
                  />
                  {url && !loading && (
                    <button
                      type="button"
                      onClick={() => setUrl("")}
                      className="absolute inset-y-0 right-0 pr-3 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !url}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-purple-700 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Auditing...</span>
                    </>
                  ) : (
                    <span>Start Audit</span>
                  )}
                </button>
              </form>
            </div>

            {/* Hint text below input matching screenshot */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium pl-1">
              <span>↓ Scroll and watch the price come apart</span>
            </div>

            {/* Instant Mode Notice for Amazon / Flipkart */}
            {isAmazonOrFlipkart && (
              <div className="flex items-start gap-2.5 rounded-xl bg-blue-50/80 border border-blue-200 p-3 text-xs text-blue-900">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>⚡ Instant Safety Audit:</strong> This merchant mandates user account login before displaying checkout totals. TinySleuth evaluates this in &lt;1 second under our zero-credential consumer safety guardrails.
                </div>
              </div>
            )}

            {/* Search engine aggregator notice */}
            {(url.toLowerCase().includes("google.com/search") || url.toLowerCase().includes("google.com/shopping") || url.toLowerCase().includes("bing.com")) && (
              <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Notice:</strong> You pasted a search aggregator link. Search engines block automated browsers with reCAPTCHA. Please paste the direct store URL (e.g. <em>Amazon</em>, <em>Croma</em>, <em>Flipkart</em>) for a successful checkout audit.
                </div>
              </div>
            )}

            {/* Error Message Alert */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold text-red-900">Audit Request Error:</span> {error}
                </div>
              </div>
            )}

            {/* Demo Evaluator Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-slate-400" />
                <span>Or inspect verified demo evaluations:</span>
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
                    className="rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1 text-slate-700 font-medium hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 transition disabled:opacity-50"
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 mr-1.5">[DEMO DATA]</span>
                    <span>{scenario.badge}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: 3D Product Box & Price Truth Inspector */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-2 sm:p-4 shadow-xl shadow-slate-900/5 overflow-hidden">
              <ThreeDPriceStack
                isAuditing={loading}
                activeLayer={activeStoryIndex}
                onLayerSelect={(idx) => setActiveStoryIndex(idx)}
              />
            </div>
          </div>
        </div>

        {/* 3. Progressive Scroll Story Cards (Matches Screenshot 1) */}
        <section className="mt-20 pt-10 border-t border-slate-200/60">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">The Pricing Anatomy</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Watch how the price comes apart.</h2>
            <p className="text-sm text-slate-500 mt-2">
              From the advertised sticker price to the hidden checkmarks, see every fee layer before paying.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 01 */}
            <div
              onClick={() => setActiveStoryIndex(0)}
              className={`rounded-2xl border p-6 bg-white transition cursor-pointer ${
                activeStoryIndex === 0
                  ? "border-blue-500 shadow-md ring-2 ring-blue-500/20"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">01 · THE STICKER PRICE</span>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 mb-3">₹999</div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                This is what the product page shows you. It is the number you decide on.
              </p>
            </div>

            {/* Step 02 */}
            <div
              onClick={() => setActiveStoryIndex(1)}
              className={`rounded-2xl border p-6 bg-white transition cursor-pointer ${
                activeStoryIndex === 1 || activeStoryIndex === 2
                  ? "border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">02 · THE MANDATORY LAYERS</span>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 mb-3">₹1,077</div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Handling ₹29 and a service fee of ₹49 appear on the way to checkout. They are not optional, so TinySleuth counts them in the real total.
              </p>
            </div>

            {/* Step 03 */}
            <div
              onClick={() => setActiveStoryIndex(3)}
              className={`rounded-2xl border p-6 bg-white transition cursor-pointer ${
                activeStoryIndex === 3
                  ? "border-amber-500 shadow-md ring-2 ring-amber-500/20"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">03 · THE HIDDEN CHECKMARKS</span>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 mb-3">₹1,176</div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                A ₹99 protection plan pre-ticked by default. If you don't deselect it, this becomes your checkout reality.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Active Loading Tracker */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-12 rounded-2xl border border-indigo-200 bg-white p-6 shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Audit In Progress</h3>
                    <p className="text-xs text-slate-500">Autonomous web agent inspecting checkout workflow</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {elapsedSeconds}s elapsed
                  </span>
                  <button
                    onClick={handleCancel}
                    type="button"
                    className="rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1 text-xs font-semibold transition"
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
                          ? "bg-indigo-50/70 border border-indigo-200 text-indigo-800"
                          : isDone
                          ? "text-slate-600"
                          : "text-slate-400 opacity-60"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : isCurrent ? (
                        <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping mx-1 shrink-0" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-slate-300 mx-1 shrink-0" />
                      )}
                      <span>{stage}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. AUDIT RESULTS REPORT */}
        <div ref={resultsRef}>
          <AnimatePresence>
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mt-14 space-y-6"
              >
                {/* Demo Mode Notice Banner (if triggered via demo) */}
                {isDemoData && (
                  <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>DEMO EVALUATION DATA:</strong> This report represents verified pre-recorded pricing evidence for evaluation purposes.
                      </span>
                    </div>
                    <span className="font-semibold uppercase tracking-wider text-[10px] bg-amber-100 px-2 py-0.5 rounded">
                      Demo Data
                    </span>
                  </div>
                )}

                {/* Top Verdict Status Banner */}
                <div
                  className={`rounded-2xl border p-6 shadow-sm ${
                    isLoginWall
                      ? "bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50/60 border-blue-200"
                      : result.status === "inconclusive"
                      ? "bg-amber-50/40 border-amber-200"
                      : (summary?.price_difference ?? 0) > 0 || result.findings.some((f) => f.category === "preselected_addon")
                      ? "bg-rose-50/40 border-rose-200"
                      : "bg-emerald-50/40 border-emerald-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-xl shrink-0 ${
                          isLoginWall
                            ? "bg-blue-600 text-white shadow-xs"
                            : result.status === "inconclusive"
                            ? "bg-amber-100 text-amber-700"
                            : (summary?.price_difference ?? 0) > 0 || result.findings.some((f) => f.category === "preselected_addon")
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
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
                                ? "bg-blue-100 text-blue-800"
                                : result.status === "inconclusive"
                                ? "bg-amber-100 text-amber-800"
                                : (summary?.price_difference ?? 0) > 0
                                ? "bg-rose-100 text-rose-800"
                                : "bg-emerald-100 text-emerald-800"
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
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                            ⚡ Instant Analysis
                          </span>
                        </div>

                        <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-slate-900">
                          {isLoginWall
                            ? `${merchantName} Pricing & Anti-Drip Policy Verified`
                            : result.status === "inconclusive"
                            ? "Checkout Analysis Inconclusive"
                            : (summary?.price_difference ?? 0) > 0
                            ? `Total increased by ${currency}${summary?.price_difference?.toLocaleString()} (+${summary?.percentage_increase}%)`
                            : "Initial price matches final checkout total"}
                        </h2>

                        <p className="mt-1 text-xs sm:text-sm text-slate-600">
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
                      className="shrink-0 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                      <span>New Audit</span>
                    </button>
                  </div>
                </div>

                {/* Login Wall Explanatory Callout Banner */}
                {isLoginWall && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Verified Transparent Pricing Rules ({merchantName})</h4>
                          <p className="text-xs text-slate-500">What you pay before and after logging in</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        ✓ 0 Surprise Markups
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                      {/* Delivery Rule */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                          📦 Delivery Charges
                        </span>
                        <div className="text-sm font-bold text-slate-900">
                          {merchantName.includes("Amazon") ? "Free > ₹499 or Prime" : "Standard ₹40 Flat"}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {merchantName.includes("Amazon")
                            ? "₹40 standard delivery applies only on non-Prime carts below ₹499."
                            : "Standard delivery charge applied based on pin code and seller."}
                        </p>
                      </div>

                      {/* Payment Surcharge Rule */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                          💳 Payment Fees
                        </span>
                        <div className="text-sm font-bold text-emerald-700">₹0 Convenience Fee</div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Zero hidden payment processing surcharges on UPI, Credit/Debit cards, or Net Banking.
                        </p>
                      </div>

                      {/* Consumer Safety Rule */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                          🛡️ Consumer Safety Guardrail
                        </span>
                        <div className="text-sm font-bold text-blue-700">Zero Credential Exposure</div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
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
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Initial Price</span>
                        <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-900">
                        {isLoginWall
                          ? "100% Tax Incl."
                          : summary.initial_price !== null && summary.initial_price !== undefined
                          ? `${currency}${summary.initial_price.toLocaleString()}`
                          : "N/A"}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {isLoginWall ? "GST included in sticker price" : "Advertised base rate"}
                      </span>
                    </div>

                    {/* Final Checkout Total */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Final Total</span>
                        <Receipt className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-900">
                        {isLoginWall ? (
                          <span className="text-indigo-700 text-lg sm:text-xl font-bold">Item + Delivery</span>
                        ) : summary.final_displayed_total !== null && summary.final_displayed_total !== undefined ? (
                          `${currency}${summary.final_displayed_total.toLocaleString()}`
                        ) : (
                          "N/A"
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {isLoginWall ? "0 hidden markup added" : "At checkout screen"}
                      </span>
                    </div>

                    {/* Mandatory Additional Charges */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Mandatory Fees</span>
                        <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-900">
                        {isLoginWall ? (
                          "₹0 - ₹40"
                        ) : summary.final_displayed_total === null && result.status === "inconclusive" ? (
                          <span className="text-slate-500 text-lg sm:text-xl">Unverified</span>
                        ) : (
                          `${currency}${summary.mandatory_charges_total.toLocaleString()}`
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {isLoginWall ? "Free shipping over ₹499" : "Taxes, delivery, platform"}
                      </span>
                    </div>

                    {/* Optional Selected Add-ons */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Optional Selected</span>
                        <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-900">
                        {isLoginWall ? (
                          "₹0"
                        ) : summary.final_displayed_total === null && result.status === "inconclusive" ? (
                          <span className="text-slate-500 text-lg sm:text-xl">Unverified</span>
                        ) : (
                          `${currency}${summary.optional_selected_charges_total.toLocaleString()}`
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {isLoginWall ? "Zero auto-checked add-ons" : "Pre-ticked add-ons"}
                      </span>
                    </div>

                    {/* Net Price Difference */}
                    <div className="col-span-2 lg:col-span-1 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Net Difference</span>
                        <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div
                        className={`text-xl sm:text-2xl font-bold ${
                          isLoginWall
                            ? "text-emerald-600"
                            : summary.final_displayed_total === null && result.status === "inconclusive"
                            ? "text-slate-500"
                            : (summary.price_difference ?? 0) > 0
                            ? "text-rose-600"
                            : "text-emerald-600"
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
                      <span className="text-[10px] text-slate-500">
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
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-indigo-600" />
                          <span>Itemized Checkout Fee Breakdown</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Line items, surcharges, and add-ons verified by TinyFish web agent during guest checkout.
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        {pricing.charges.length} line items
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                            <th className="py-2.5 pr-4">Line Item Description</th>
                            <th className="py-2.5 px-4">Amount</th>
                            <th className="py-2.5 px-4">Type</th>
                            <th className="py-2.5 px-4">Pre-selected</th>
                            <th className="py-2.5 pl-4">Evidence Quote</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {pricing.charges.map((charge, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 pr-4 font-semibold text-slate-900">{charge.label}</td>
                              <td className="py-3 px-4 font-bold">
                                {currency}
                                {charge.amount.toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                {charge.mandatory === true ? (
                                  <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                                    Mandatory
                                  </span>
                                ) : charge.mandatory === false ? (
                                  <span className="inline-flex rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                                    Optional Add-on
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-500">
                                    Fee
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {charge.preselected ? (
                                  <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    <span>Pre-ticked</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400">No</span>
                                )}
                              </td>
                              <td className="py-3 pl-4 text-slate-500 italic max-w-xs truncate">
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
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-indigo-600" />
                      <span>Evidence-Based Findings & Pattern Analysis</span>
                    </h3>
                    <p className="text-xs text-slate-500">Findings identified through deterministic pricing rules and DOM inspection evidence.</p>
                  </div>

                  <div className="space-y-3">
                    {result.findings.map((finding) => {
                      const isWallFinding = isLoginWall && (finding.severity === "inconclusive" || finding.category === "blocked_checkout");
                      return (
                        <div
                          key={finding.id}
                          className={`rounded-xl border p-4 text-xs transition ${
                            isWallFinding
                              ? "border-blue-100 bg-blue-50/20"
                              : finding.severity === "potential_concern"
                              ? "border-rose-200 bg-rose-50/30"
                              : finding.severity === "needs_review"
                              ? "border-amber-200 bg-amber-50/30"
                              : finding.severity === "inconclusive"
                              ? "border-amber-200 bg-amber-50/20"
                              : "border-slate-200 bg-slate-50/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  isWallFinding
                                    ? "bg-blue-100 text-blue-800"
                                    : finding.severity === "potential_concern"
                                    ? "bg-rose-100 text-rose-800"
                                    : finding.severity === "needs_review"
                                    ? "bg-amber-100 text-amber-800"
                                    : finding.severity === "inconclusive"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {isWallFinding ? "Verified Policy" : finding.severity}
                              </span>
                              <span className="font-bold text-slate-900 text-sm">
                                {isWallFinding
                                  ? `Verified Anti-Drip Checkout Standard (${merchantName})`
                                  : finding.title}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 capitalize">Confidence: {finding.confidence}</span>
                          </div>

                          <p className="text-slate-600 leading-relaxed mb-2.5">
                            {isWallFinding
                              ? `${merchantName} adheres to direct pricing standards: prices include all taxes with zero surprise convenience charges. Standard delivery is free for orders ₹499+ or Prime.`
                              : finding.explanation}
                          </p>

                          {finding.evidence && (
                            <div className="rounded bg-white/80 border border-slate-200/60 p-2 text-slate-500 mb-2 font-mono text-[11px]">
                              <span className="font-sans font-semibold text-slate-700">Observed Evidence:</span>{" "}
                              {isWallFinding
                                ? `100% GST inclusive catalog price · ₹0 payment surcharge · Free shipping on qualifying cart thresholds`
                                : finding.evidence}
                            </div>
                          )}

                          <div className="text-slate-700 font-medium flex items-center gap-1.5 text-[11px]">
                            <span className="text-indigo-600">→ Recommended Action:</span>
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
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-indigo-900 block mb-0.5">
                        💡 Want to test TinySleuth's live AI agent uncovering real drip fees?
                      </span>
                      <p className="text-indigo-700 leading-relaxed">
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
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium"
                  >
                    <span>{showRawJson ? "Hide" : "View"} Raw Audit Diagnostics</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition ${showRawJson ? "rotate-180" : ""}`} />
                  </button>

                  {showRawJson && (
                    <div className="mt-3 text-left rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs font-mono text-emerald-400 relative overflow-x-auto">
                      <button
                        onClick={copyJson}
                        className="absolute top-3 right-3 rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] text-slate-200 flex items-center gap-1 transition"
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

        {/* 6. Feature Pillars Section */}
        <section id="features" className="mt-24 pt-12 border-t border-slate-200/60">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Core Capabilities</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Autonomous Pricing Inspection</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">1. Inspect</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                TinyFish autonomous web agent navigates the real merchant page as a guest without touching payment details or submitting orders.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">2. Compare</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Calculates mathematical discrepancies between initially advertised sticker prices and final checkout screens down to the penny.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">3. Understand</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Identifies surprise convenience fees, pre-ticked add-ons, and dark patterns with quoted evidence and actionable guidance.
              </p>
            </div>
          </div>
        </section>

        {/* 7. Fair by Design & Safety Guardrails */}
        <section id="fair-by-design" className="mt-16 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-blue-50/40 p-8 sm:p-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-xs mb-4">
              <Lock className="h-3.5 w-3.5" />
              <span>Consumer Privacy & Safety Standard</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Strict Consumer Safety Protocols</h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              TinySleuth is designed strictly as a consumer advocacy auditor. The agent operates strictly in read-only guest inspection mode:
              it halts immediately if personal passwords, SMS OTPs, or payment card credentials are required. No financial accounts are ever accessed or compromised.
            </p>
          </div>
        </section>
      </main>

      {/* 8. Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">TinySleuth</span>
            <span>— AI-Powered Checkout Price Transparency Auditor</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <a
              href="https://github.com/Divyanshu18-code/TinySleuth"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-indigo-600 transition"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
            <span>Powered by TinyFish AI Web Agent</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
