export interface ExtractedCharge {
  label: string;
  amount: number;
  mandatory: boolean;
  preselected: boolean;
  disclosed_before_checkout: boolean | null;
  evidence: string | null;
}

export interface ExtractedPricing {
  currency: string | null;
  initial_price: number | null;
  final_displayed_total: number | null;
  charges: ExtractedCharge[];
  reached_checkout: boolean;
  blocked_reason: string | null;
}

export interface AuditResponse {
  url: string;
  status: "completed" | "inconclusive";
  pricing: ExtractedPricing | null;
  message: string | null;
  raw_agent_result: unknown;
}

export async function startAudit(url: string): Promise<AuditResponse> {
  const res = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed (${res.status})`);
  }
  return res.json();
}
