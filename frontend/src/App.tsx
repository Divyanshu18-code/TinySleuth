import { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  ChevronUp,
  Receipt,
  ShoppingBag,
  Info,
  DollarSign,
  TrendingUp,
  SlidersHorizontal,
  FileText,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { startAudit, type AuditResponse } from "./api";

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
        blocked_reason: null,
        charges: [
          {
            label: "Base Airfare",
            amount: 3499.0,
            classification: "fare",
            mandatory: true,
            preselected: false,
            disclosed_before_checkout: true,
            evidence: "Published base fare on flight search page: ₹3,499",
          },
          {
            label: "Platform Convenience Fee",
            amount: 399.0,
            classification: "convenience_fee",
            mandatory: true,
            preselected: false,
            disclosed_before_checkout: false,
            evidence: "Mandatory convenience fee added at payment gateway screen: ₹399",
          },
          {
            label: "Travel Protection Insurance",
            amount: 250.0,
            classification: "insurance",
            mandatory: false,
            preselected: true,
            disclosed_before_checkout: false,
            evidence: "Pre-ticked checkmark: 'Secure your trip for ₹250 per passenger'",
          },
          {
            label: "Passenger Aviation Security Fee",
            amount: 300.0,
            classification: "tax",
            mandatory: true,
            preselected: false,
            disclosed_before_checkout: false,
            evidence: "Regulatory security surcharge injected at review screen: ₹300",
          },
        ],
      },
      pricing_summary: {
        initial_price: 3499.0,
        final_displayed_total: 4448.0,
        mandatory_charges_total: 699.0,
        optional_selected_charges_total: 250.0,
        unknown_charges_total: 0.0,
        expected_total: 4448.0,
        price_difference: 949.0,
        percentage_increase: 27.1,
        component_discrepancy: null,
        data_completeness: "complete",
      },
      findings: [
        {
          id: "find_pre_insurance",
          category: "preselected_addon",
          title: "Pre-selected Optional Add-on: Travel Protection Insurance",
          severity: "potential_concern",
          explanation: "The optional item 'Travel Protection Insurance' (₹250.0) was pre-selected by default without explicit consumer opt-in.",
          evidence: "Pre-ticked checkmark: 'Secure your trip for ₹250 per passenger'",
          confidence: "high",
          suggested_action: "Deselect this optional add-on before final transaction if you have existing travel insurance.",
          status: "active",
        },
        {
          id: "find_undisc_convenience",
          category: "hidden_fee",
          title: "Surprise Surcharge: Platform Convenience Fee",
          severity: "needs_review",
          explanation: "The mandatory charge 'Platform Convenience Fee' (₹399.0) was not disclosed on the flight search page and only appeared at payment.",
          evidence: "Mandatory convenience fee added at payment gateway screen: ₹399",
          confidence: "high",
          suggested_action: "Factor this additional fee into your total purchasing comparison.",
          status: "active",
        },
        {
          id: "find_high_markup",
          category: "price_increase",
          title: "High Checkout Surcharge (+27.1%)",
          severity: "needs_review",
          explanation: "The final checkout price increased by 27.1% (₹949.0) over the initially advertised airfare.",
          evidence: "Base: ₹3499.0 -> Checkout: ₹4448.0",
          confidence: "high",
          suggested_action: "Compare total invoice price against airlines offering all-inclusive fares.",
          status: "active",
        },
      ],
      summary_report: "TinySleuth audited the checkout flow for 'Domestic Non-Stop Flight: DEL -> BOM'. Initial advertised price: ₹3499.0. Final displayed total: ₹4448.0. A net increase of ₹949.0 (+27.1%) was recorded across checkout steps. ⚠️ Flagged 1 pre-selected optional add-on(s) added without explicit user consent. Identified ₹699.0 in mandatory additional charges. A total of 3 item(s) require consumer review before completing checkout. Notice: TinySleuth performs non-destructive guest checkout inspection and never submits orders or card details. This audit does not guarantee the absence of all merchant fees that may require authentication or location entry.",
      message: null,
    },
  },
  {
    name: "Audio Store (Transparent Pricing)",
    badge: "🎧 Transparent",
    url: "https://demo-audiostore.com/headphones/anc-pro",
    data: {
      audit_id: "audit_demo_audio_219",
      url: "https://demo-audiostore.com/headphones/anc-pro",
      status: "completed",
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      product_title: "ANC Pro Wireless Noise-Cancelling Headphones",
      currency: "₹",
      extracted_pricing: {
        product_title: "ANC Pro Wireless Noise-Cancelling Headphones",
        currency: "₹",
        initial_price: 2999.0,
        final_displayed_total: 2999.0,
        reached_checkout: true,
        blocked_reason: null,
        charges: [
          {
            label: "Product Unit Price",
            amount: 2999.0,
            classification: "item",
            mandatory: true,
            preselected: false,
            disclosed_before_checkout: true,
            evidence: "Product detail page price: ₹2,999 (inclusive of all taxes)",
          },
          {
            label: "Standard Express Shipping",
            amount: 0.0,
            classification: "delivery",
            mandatory: true,
            preselected: false,
            disclosed_before_checkout: true,
            evidence: "Free shipping applied automatically to cart",
          },
        ],
      },
      pricing_summary: {
        initial_price: 2999.0,
        final_displayed_total: 2999.0,
        mandatory_charges_total: 0.0,
        optional_selected_charges_total: 0.0,
        unknown_charges_total: 0.0,
        expected_total: 2999.0,
        price_difference: 0.0,
        percentage_increase: 0.0,
        component_discrepancy: null,
        data_completeness: "complete",
      },
      findings: [
        {
          id: "find_trans_clean",
          category: "transparent_pricing",
          title: "Transparent Pricing Verified",
          severity: "informational",
          explanation: "The advertised price matched the final checkout total with no hidden fees or preselected items detected.",
          evidence: "Advertised ₹2999.0 == Checkout ₹2999.0",
          confidence: "high",
          suggested_action: "No concerns identified for the inspected checkout flow.",
          status: "active",
        },
      ],
      summary_report: "TinySleuth audited the checkout flow for 'ANC Pro Wireless Noise-Cancelling Headphones'. Initial advertised price: ₹2999.0. Final displayed total: ₹2999.0. The final checkout total matched the advertised price exactly. No hidden fees or misleading design patterns were detected in the observed flow. Notice: TinySleuth performs non-destructive guest checkout inspection and never submits orders or card details. This audit does not guarantee the absence of all merchant fees that may require authentication or location entry.",
      message: null,
    },
  },
  {
    name: "Luxury Resort (OTP Inconclusive)",
    badge: "🏨 OTP Blocked",
    url: "https://demo-resort.com/deluxe-villa",
    data: {
      audit_id: "audit_demo_resort_550",
      url: "https://demo-resort.com/deluxe-villa",
      status: "inconclusive",
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      product_title: "Seaside Deluxe Villa — 3 Nights",
      currency: "₹",
      extracted_pricing: {
        product_title: "Seaside Deluxe Villa — 3 Nights",
        currency: "₹",
        initial_price: 18500.0,
        final_displayed_total: null,
        reached_checkout: false,
        blocked_reason: "Site strictly enforced mandatory SMS OTP phone verification before viewing reservation fee breakdown.",
        charges: [],
      },
      pricing_summary: {
        initial_price: 18500.0,
        final_displayed_total: null,
        mandatory_charges_total: 0.0,
        optional_selected_charges_total: 0.0,
        unknown_charges_total: 0.0,
        expected_total: null,
        price_difference: null,
        percentage_increase: null,
        component_discrepancy: null,
        data_completeness: "inconclusive",
      },
      findings: [
        {
          id: "find_blocked_otp",
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
      summary_report: "Audit Inconclusive: The inspection could not be completed because the site restricted access (Site strictly enforced mandatory SMS OTP phone verification before viewing reservation fee breakdown.). TinySleuth adheres to strict consumer safety protocols and halts immediately when login credentials, OTP verifications, or payment details are mandated.",
      message: "Agent halted safely: Site enforced mandatory SMS OTP verification.",
    },
  },
];

const AUDIT_STAGES = [
  "Validating URL & applying SSRF guardrails...",
  "Initializing headless TinyFish web agent session...",
  "Loading product page & extracting advertised base price...",
  "Navigating cart and progressing through guest checkout...",
  "Dissecting invoice line items, taxes & add-on checkboxes...",
  "Running mathematical pricing comparisons & discrepancy engine...",
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
  const abortRef = useRef<AbortController | null>(null);

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
      }, 4500);
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
      }, 1500);
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
    result?.status === "inconclusive" &&
    Boolean(
      result.findings?.some(
        (f) =>
          f.title.toLowerCase().includes("sign-in") ||
          f.title.toLowerCase().includes("login") ||
          (f.evidence && (f.evidence.toLowerCase().includes("sign-in") || f.evidence.toLowerCase().includes("login")))
      ) ||
        result.summary_report?.toLowerCase().includes("login") ||
        result.summary_report?.toLowerCase().includes("sign-in")
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      {/* Top Professional SaaS Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-xs">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">TinySleuth</span>
                <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  MVP v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Checkout Truth & Price Auditor</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>TinyFish Agent Ready</span>
            </div>
            <a
              href="#how-it-works"
              className="hover:text-blue-600 transition"
            >
              How It Works
            </a>
            <a
              href="https://github.com/Divyanshu18-code/TinySleuth"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-slate-700 hover:bg-slate-50 transition"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold text-slate-600 shadow-xs mb-4">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>AI-Powered Autonomous Web Agent</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Know the Real Price <br className="hidden sm:inline" />
            <span className="text-blue-600">Before You Pay</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            TinySleuth inspects checkout flows, compares displayed prices, and helps you understand additional charges
            before you complete a purchase.
          </p>

          {/* Three Feature Pillars */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-2.5">
                <Search className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">1. Inspect</h2>
              <p className="mt-1 text-xs text-slate-500 leading-normal">
                TinyFish web agent navigates the real merchant page as a guest without touching payment details.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 mb-2.5">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">2. Compare</h2>
              <p className="mt-1 text-xs text-slate-500 leading-normal">
                Calculates mathematical discrepancy between initially listed price and final displayed checkout total.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mb-2.5">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">3. Understand</h2>
              <p className="mt-1 text-xs text-slate-500 leading-normal">
                Identifies mandatory fees, surprise surcharges, and pre-selected add-ons with direct evidence quotes.
              </p>
            </div>
          </div>
        </section>

        {/* URL Submission Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAudit(url);
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste direct store URL (e.g. https://www.amazon.in/dp/...)"
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition disabled:opacity-50"
              />
              {url && !loading && (
                <button
                  type="button"
                  onClick={() => setUrl("")}
                  className="absolute inset-y-0 right-0 pr-3.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !url}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
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

          {/* Search aggregator hint banner */}
          {(url.toLowerCase().includes("google.com/search") || url.toLowerCase().includes("google.com/shopping") || url.toLowerCase().includes("bing.com")) && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Notice:</strong> You pasted a search engine / aggregator link. Search engines block automated browsers with reCAPTCHA. Please click through to the actual merchant store (e.g. <em>Amazon</em>, <em>Croma</em>, <em>Flipkart</em>) and paste that direct store URL for a successful checkout audit.
              </div>
            </div>
          )}

          {/* Instant Evaluation Hint for Walled Marketplaces */}
          {(url.toLowerCase().includes("amazon.") || url.toLowerCase().includes("flipkart.com") || url.toLowerCase().includes("myntra.com")) && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>⚡ Instant Safety Audit:</strong> This merchant mandates user account login before displaying checkout totals. TinySleuth evaluates this in &lt;1 second under our zero-credential consumer safety guardrails.
              </div>
            </div>
          )}

          {/* Explicit Demo Data Evaluator Pills */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
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
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 font-medium hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition disabled:opacity-50"
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 mr-1.5">[DEMO DATA]</span>
                  <span>{scenario.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy & Safety Guarantee */}
          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-emerald-600" />
            <span>Strict consumer safety guardrails: TinySleuth never submits card details, never places orders, and halts before OTP or login steps.</span>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-red-900">Audit Request Error:</span> {error}
              </div>
            </div>
          )}
        </section>

        {/* AUDIT PROGRESS TRACKER (Active Loading State) */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Audit In Progress</h3>
                    <p className="text-xs text-slate-500">Autonomous web agent inspecting checkout workflow</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">
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
                          ? "bg-blue-50/70 border border-blue-200 text-blue-800"
                          : isDone
                          ? "text-slate-600"
                          : "text-slate-400 opacity-60"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : isCurrent ? (
                        <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping mx-1 shrink-0" />
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

        {/* AUDIT RESULTS REPORT */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Demo Mode Notice Banner (if triggered via demo) */}
              {isDemoData && (
                <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-amber-600 shrink-0" />
                    <span><strong>DEMO EVALUATION DATA:</strong> This report represents verified pre-recorded pricing evidence for evaluation purposes.</span>
                  </div>
                  <span className="font-semibold uppercase tracking-wider text-[10px] bg-amber-100 px-2 py-0.5 rounded">Demo Data</span>
                </div>
              )}

              {/* Top Verdict Status Banner */}
              <div
                className={`rounded-2xl border p-6 shadow-sm ${
                  result.status === "inconclusive"
                    ? "bg-amber-50/40 border-amber-200"
                    : (summary?.price_difference ?? 0) > 0 || (result.findings.some(f => f.category === "preselected_addon"))
                    ? "bg-rose-50/40 border-rose-200"
                    : "bg-emerald-50/40 border-emerald-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl shrink-0 ${
                        result.status === "inconclusive"
                          ? "bg-amber-100 text-amber-700"
                          : (summary?.price_difference ?? 0) > 0 || (result.findings.some(f => f.category === "preselected_addon"))
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {result.status === "inconclusive" ? (
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
                            result.status === "inconclusive"
                              ? "bg-amber-100 text-amber-800"
                              : (summary?.price_difference ?? 0) > 0
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {result.status === "inconclusive"
                            ? "Audit Status: Inconclusive"
                            : (summary?.price_difference ?? 0) > 0
                            ? "Verdict: Additional Surcharges Identified"
                            : "Verdict: 100% Transparent Price Match"}
                        </span>
                        {result.raw_diagnostics?.evaluation_mode === "instant_intelligence" && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            ⚡ Instant Analysis
                          </span>
                        )}
                      </div>

                      <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-slate-900">
                        {result.status === "inconclusive"
                          ? isLoginWall
                            ? "Audit Halted Safely: Merchant Requires Sign-In"
                            : "Checkout Analysis Inconclusive"
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
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6 shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <h4 className="font-bold text-amber-900 text-base">Why Did TinySleuth Stop Here? (Safety Guardrail)</h4>
                      <p className="text-amber-800 leading-relaxed">
                        <strong>Amazon</strong>, <strong>Flipkart</strong>, and similar marketplaces enforce mandatory account login (password or phone OTP) before displaying the checkout screen with taxes, delivery fees, and order totals.
                      </p>
                      <p className="text-amber-800 leading-relaxed">
                        🛡️ <strong>Zero Credential Policy:</strong> TinySleuth adheres to strict consumer safety standards. The AI agent intentionally halts immediately before requesting or entering your password, OTP, or credit card.
                      </p>
                      <div className="pt-2 border-t border-amber-200/80">
                        <span className="font-semibold text-amber-900">💡 Best websites to audit with TinySleuth:</span>
                        <p className="text-amber-800 mt-1">
                          TinySleuth delivers the best full checkout audits on stores and services that support <strong>Guest Checkout</strong> — including <strong>Shopify & D2C stores</strong> (apparel, beauty, electronics), <strong>Flight & Hotel bookings</strong>, and <strong>Food delivery</strong> platforms where hidden fees and drip charges typically appear during checkout!
                        </p>
                      </div>
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
                      {summary.initial_price !== null && summary.initial_price !== undefined
                        ? `${currency}${summary.initial_price.toLocaleString()}`
                        : "N/A"}
                    </div>
                    <span className="text-[10px] text-slate-500">Advertised base rate</span>
                  </div>

                  {/* Final Checkout Total */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Final Total</span>
                      <Receipt className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">
                      {summary.final_displayed_total !== null && summary.final_displayed_total !== undefined
                        ? `${currency}${summary.final_displayed_total.toLocaleString()}`
                        : isLoginWall
                        ? <span className="text-amber-700 text-lg sm:text-xl">Sign-in Wall</span>
                        : "N/A"}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {isLoginWall ? "Requires account login" : "At checkout screen"}
                    </span>
                  </div>

                  {/* Mandatory Additional Charges */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Mandatory Fees</span>
                      <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">
                      {summary.final_displayed_total === null && result.status === "inconclusive" ? (
                        <span className="text-slate-500 text-lg sm:text-xl">Unverified</span>
                      ) : (
                        `${currency}${summary.mandatory_charges_total.toLocaleString()}`
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {summary.final_displayed_total === null && result.status === "inconclusive"
                        ? "Locked behind sign-in"
                        : "Taxes, delivery, platform"}
                    </span>
                  </div>

                  {/* Optional Selected Add-ons */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Optional Selected</span>
                      <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">
                      {summary.final_displayed_total === null && result.status === "inconclusive" ? (
                        <span className="text-slate-500 text-lg sm:text-xl">Unverified</span>
                      ) : (
                        `${currency}${summary.optional_selected_charges_total.toLocaleString()}`
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {summary.final_displayed_total === null && result.status === "inconclusive"
                        ? "Locked behind sign-in"
                        : "Pre-ticked add-ons"}
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
                        summary.final_displayed_total === null && result.status === "inconclusive"
                          ? "text-slate-500"
                          : (summary.price_difference ?? 0) > 0
                          ? "text-rose-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {summary.final_displayed_total === null && result.status === "inconclusive" ? (
                        "—"
                      ) : (summary.price_difference ?? 0) > 0 ? (
                        `+${currency}${summary.price_difference?.toLocaleString()}`
                      ) : (
                        `${currency}0`
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {summary.final_displayed_total === null && result.status === "inconclusive"
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
                        <Receipt className="h-4 w-4 text-blue-600" />
                        <span>Itemized Checkout Fee Breakdown</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Line items, surcharges, and add-ons verified by TinyFish web agent during guest checkout.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                      {pricing.charges.length} Line Items
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                          <th className="py-2.5 px-3">Line Item</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Classification</th>
                          <th className="py-2.5 px-3">Requirement</th>
                          <th className="py-2.5 px-3">Disclosure</th>
                          <th className="py-2.5 px-3">Evidence Quote</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {pricing.charges.map((charge, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-3 font-semibold text-slate-900">
                              {charge.label}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900">
                              {charge.amount === 0 ? "FREE" : `${currency}${charge.amount.toLocaleString()}`}
                            </td>
                            <td className="py-3 px-3">
                              <span className="capitalize text-slate-600">{charge.classification || "other"}</span>
                            </td>
                            <td className="py-3 px-3">
                              {charge.mandatory === true ? (
                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                  Mandatory
                                </span>
                              ) : charge.mandatory === false ? (
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                  Optional
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                  Unknown
                                </span>
                              )}
                              {charge.preselected && (
                                <span className="ml-1 inline-flex items-center rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                  Pre-ticked
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {charge.disclosed_before_checkout === true ? (
                                <span className="text-emerald-700 font-medium">Disclosed Upfront</span>
                              ) : charge.disclosed_before_checkout === false ? (
                                <span className="text-rose-700 font-medium">Surprise at Checkout</span>
                              ) : (
                                <span className="text-slate-400">Unspecified</span>
                              )}
                            </td>
                            <td className="py-3 px-3 max-w-xs text-slate-500 italic text-[11px] truncate" title={charge.evidence || ""}>
                              {charge.evidence ? `"${charge.evidence}"` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Evidence-Based Findings Cards */}
              {result.findings && result.findings.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>Evidence-Based Findings & Pattern Analysis</span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Findings identified through deterministic pricing rules and DOM inspection evidence.
                  </p>

                  <div className="space-y-3">
                    {result.findings.map((finding) => (
                      <div
                        key={finding.id}
                        className={`rounded-xl border p-4 transition ${
                          finding.severity === "potential_concern"
                            ? "border-rose-200 bg-rose-50/30"
                            : finding.severity === "needs_review"
                            ? "border-amber-200 bg-amber-50/30"
                            : finding.severity === "inconclusive"
                            ? "border-amber-200 bg-amber-50/30"
                            : "border-slate-200 bg-slate-50/30"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                finding.severity === "potential_concern"
                                  ? "bg-rose-100 text-rose-800"
                                  : finding.severity === "needs_review"
                                  ? "bg-amber-100 text-amber-800"
                                  : finding.severity === "inconclusive"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {finding.severity.replace("_", " ")}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{finding.title}</h4>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Confidence: <strong className="text-slate-700 capitalize">{finding.confidence}</strong>
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                          {finding.explanation}
                        </p>

                        {finding.evidence && (
                          <div className="mt-2 text-xs text-slate-500 bg-white/70 border border-slate-200/60 rounded-md p-2 font-mono text-[11px]">
                            <strong>Observed Evidence:</strong> {finding.evidence}
                          </div>
                        )}

                        <div className="mt-2 text-xs text-slate-700 font-medium flex items-center gap-1.5 pt-1">
                          <ArrowRight className="h-3 w-3 text-blue-600" />
                          <span><strong>Recommended Action:</strong> {finding.suggested_action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plain-Language Audit Summary & Official Disclaimer */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Executive Audit Summary</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                  {result.summary_report}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Transparency Disclaimer:</strong> TinySleuth inspects online checkout flows as an independent diagnostic assistant. It does not complete purchases, enter financial credentials, or guarantee absence of all unobserved merchant fees that may require account authentication.
                  </p>
                </div>
              </div>

              {/* Collapsible Sanitized Diagnostics (For Auditors / Developers) */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="w-full flex items-center justify-between p-4 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
                >
                  <span className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span>View Raw Audit JSON Payload & Diagnostics</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    {showRawJson ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>

                <AnimatePresence>
                  {showRawJson && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="p-4 border-t border-slate-200 bg-slate-900 text-slate-200"
                    >
                      <div className="flex items-center justify-between pb-2">
                        <span className="text-[11px] font-mono text-slate-400">Sanitized Response Object</span>
                        <button
                          type="button"
                          onClick={copyJson}
                          className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 transition"
                        >
                          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>{copied ? "Copied" : "Copy JSON"}</span>
                        </button>
                      </div>
                      <pre className="max-h-80 overflow-auto rounded-lg bg-slate-950 p-3 text-xs font-mono text-emerald-400 border border-slate-800">
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
        <section id="how-it-works" className="mt-16 pt-10 border-t border-slate-200 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Architecture & Transparency</span>
          <h2 className="mt-1.5 text-2xl font-bold text-slate-900">How TinySleuth Works</h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Combining TinyFish autonomous web agents, SSRF-hardened FastAPI backend, and deterministic pricing math.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-3">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Headless Browser Agent</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                TinyFish autonomous agent opens the destination page in a cloud container, captures the base price, and adds the product to cart as a guest.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mb-3">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Zero Payment Risk</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                The agent adheres to safety rules: It halts immediately if OTP, payment card, or login is demanded. Incomplete flows are marked Inconclusive.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600 mb-3">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Evidence Rule Engine</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Our backend calculates mathematical price differences ($F - I$), cataloging surprise surcharges and pre-selected add-ons with verbatim DOM proof.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">TinySleuth</span>
            <span>— Know the Real Price Before You Pay</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Powered by TinyFish Web Agents</span>
            <span>•</span>
            <span>FastAPI & React</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
