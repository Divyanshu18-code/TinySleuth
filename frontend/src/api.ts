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

export async function startAudit(url: string): Promise<AuditResponse> {
  const res = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Audit request failed (${res.status})`);
  }
  return res.json();
}
