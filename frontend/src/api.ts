export interface ExtractedCharge {
  label: string;
  amount: number;
  currency?: string | null;
  classification?: string;
  mandatory?: boolean | null;
  preselected?: boolean;
  disclosed_before_checkout?: boolean | null;
  evidence?: string | null;
  source_url?: string | null;
}

export interface ExtractedPricing {
  product_title?: string | null;
  currency?: string | null;
  initial_price?: number | null;
  final_displayed_total?: number | null;
  charges: ExtractedCharge[];
  reached_checkout: boolean;
  blocked_reason?: string | null;
  source_url?: string | null;
}

export interface PricingSummary {
  initial_price?: number | null;
  final_displayed_total?: number | null;
  mandatory_charges_total: number;
  optional_selected_charges_total: number;
  unknown_charges_total: number;
  expected_total?: number | null;
  price_difference?: number | null;
  percentage_increase?: number | null;
  component_discrepancy?: number | null;
  data_completeness: "complete" | "partial" | "inconclusive";
}

export interface Finding {
  id: string;
  category: string;
  title: string;
  severity: "informational" | "needs_review" | "potential_concern" | "inconclusive";
  explanation: string;
  evidence?: string | null;
  source_url?: string | null;
  confidence: "high" | "medium" | "low";
  suggested_action: string;
  status: string;
}

export interface AuditResponse {
  audit_id: string;
  url: string;
  status: "completed" | "inconclusive" | "failed";
  created_at: string;
  completed_at: string;
  product_title?: string | null;
  currency?: string | null;
  extracted_pricing?: ExtractedPricing | null;
  pricing_summary?: PricingSummary | null;
  findings: Finding[];
  summary_report: string;
  message?: string | null;
  raw_diagnostics?: Record<string, unknown> | null;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function startAudit(url: string, signal?: AbortSignal): Promise<AuditResponse> {
  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/audit` : "/api/audit";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
    signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Audit request failed (${res.status})`);
  }
  return res.json();
}

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}

export async function createPaymentOrder(amount: number): Promise<CreateOrderResponse> {
  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/payment/create-order` : "/api/payment/create-order";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Failed to create payment order (${res.status})`);
  }
  return res.json();
}

export async function verifyPayment(paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ status: string; message: string; payment_id: string }> {
  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/payment/verify` : "/api/payment/verify";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Payment verification failed (${res.status})`);
  }
  return res.json();
}

