import uuid
from typing import Optional
from app.models.schemas import ExtractedPricing, Finding, PricingSummary


def generate_findings(
    extracted: Optional[ExtractedPricing],
    summary: PricingSummary,
) -> tuple[list[Finding], str]:
    """
    Deterministic, evidence-based detection rule engine.
    Produces structured findings with severity levels and plain-language summary.
    """
    findings: list[Finding] = []

    if extracted is None or summary.data_completeness == "inconclusive" or (extracted and extracted.blocked_reason):
        reason = extracted.blocked_reason if extracted and extracted.blocked_reason else "Unable to observe pricing data."
        findings.append(
            Finding(
                id=f"find_{uuid.uuid4().hex[:8]}",
                category="blocked_checkout",
                title="Audit Inconclusive: Checkout Not Reached",
                severity="inconclusive",
                explanation=f"The agent stopped safely without completing the audit: {reason}",
                evidence=reason,
                confidence="high",
                suggested_action="Review the merchant checkout manually or verify guest checkout accessibility.",
            )
        )
        report = (
            f"Audit Inconclusive: The inspection could not be completed because the site restricted "
            f"access ({reason}). TinySleuth adheres to strict consumer safety protocols and halts "
            f"immediately when login credentials, OTP verifications, or payment details are mandated."
        )
        return findings, report

    currency = extracted.currency or ""
    initial = summary.initial_price
    final = summary.final_displayed_total
    price_diff = summary.price_difference
    pct = summary.percentage_increase

    # Rule 1: Pre-selected Add-ons (Dark Pattern Check)
    for idx, charge in enumerate(extracted.charges):
        if charge.preselected and charge.mandatory is not True:
            findings.append(
                Finding(
                    id=f"find_preselected_{idx}_{uuid.uuid4().hex[:6]}",
                    category="preselected_addon",
                    title=f"Pre-selected Optional Add-on: {charge.label}",
                    severity="potential_concern",
                    explanation=(
                        f"The optional line item '{charge.label}' ({currency}{charge.amount}) was pre-selected "
                        f"by default without explicit consumer opt-in."
                    ),
                    evidence=charge.evidence or f"Observed '{charge.label}' pre-checked in cart/checkout.",
                    source_url=charge.source_url or extracted.source_url,
                    confidence="high" if charge.evidence else "medium",
                    suggested_action="Ensure you uncheck or deselect this item before final payment if you do not want it.",
                )
            )

    # Rule 2: Undisclosed / Hidden Fees before Checkout
    for idx, charge in enumerate(extracted.charges):
        if charge.disclosed_before_checkout is False and charge.amount > 0:
            findings.append(
                Finding(
                    id=f"find_undisclosed_{idx}_{uuid.uuid4().hex[:6]}",
                    category="hidden_fee",
                    title=f"Surprise Surcharge: {charge.label}",
                    severity="needs_review",
                    explanation=(
                        f"The charge '{charge.label}' ({currency}{charge.amount}) was not disclosed on the initial "
                        f"product page and only appeared during later checkout stages."
                    ),
                    evidence=charge.evidence or "Item absent from product listing page.",
                    source_url=charge.source_url or extracted.source_url,
                    confidence="medium",
                    suggested_action="Factor this additional fee into your purchasing decision.",
                )
            )

    # Rule 3: Component Discrepancy (Unexplained price hike)
    if summary.component_discrepancy is not None and summary.component_discrepancy > 0.01:
        findings.append(
            Finding(
                id=f"find_discrepancy_{uuid.uuid4().hex[:8]}",
                category="unexplained_increase",
                title="Unexplained Price Discrepancy",
                severity="potential_concern",
                explanation=(
                    f"The final displayed total ({currency}{final}) exceeds the sum of the initial price and "
                    f"all itemized charges by {currency}{summary.component_discrepancy}. An unitemized fee or tax "
                    f"may have been added."
                ),
                evidence=f"Final Total: {currency}{final}, Expected Total: {currency}{summary.expected_total}",
                confidence="high",
                suggested_action="Review your order invoice carefully before paying to inspect unlisted fees.",
            )
        )

    # Rule 4: Significant Price Increase
    if pct is not None and pct > 15.0:
        findings.append(
            Finding(
                id=f"find_high_markup_{uuid.uuid4().hex[:8]}",
                category="price_increase",
                title=f"High Checkout Surcharge (+{pct}%)",
                severity="needs_review",
                explanation=(
                    f"The final checkout price increased by {pct}% ({currency}{price_diff}) over the "
                    f"initially advertised price."
                ),
                evidence=f"Base: {currency}{initial} -> Checkout: {currency}{final}",
                confidence="high",
                suggested_action="Compare overall cost with competing retailers who may include fees upfront.",
            )
        )

    # Rule 5: Transparent / Matched Pricing
    if price_diff == 0.0 and len(findings) == 0:
        findings.append(
            Finding(
                id=f"find_transparent_{uuid.uuid4().hex[:8]}",
                category="transparent_pricing",
                title="Transparent Pricing Verified",
                severity="informational",
                explanation="The advertised price matched the final checkout total with no hidden fees or preselected items detected.",
                evidence=f"Advertised {currency}{initial} == Checkout {currency}{final}",
                confidence="high",
                suggested_action="No concerns identified for the inspected checkout flow.",
            )
        )

    # Compose plain-language executive summary report
    concerns = [f for f in findings if f.severity in ("potential_concern", "needs_review")]
    preselected = [f for f in findings if f.category == "preselected_addon"]

    report_lines = []
    product_str = f" for '{extracted.product_title}'" if extracted.product_title else ""
    report_lines.append(f"TinySleuth audited the checkout flow{product_str}.")

    if initial is not None:
        report_lines.append(f"Initial advertised price: {currency}{initial}.")
    if final is not None:
        report_lines.append(f"Final displayed total: {currency}{final}.")

    if price_diff is not None and price_diff > 0:
        report_lines.append(f"A net increase of {currency}{price_diff} (+{pct}%) was recorded across checkout steps.")
    elif price_diff == 0.0:
        report_lines.append("The final checkout total matched the advertised price exactly.")

    if preselected:
        report_lines.append(f"⚠️ Flagged {len(preselected)} pre-selected optional add-on(s) added without explicit user consent.")

    if summary.mandatory_charges_total > 0:
        report_lines.append(f"Identified {currency}{summary.mandatory_charges_total} in mandatory additional charges.")

    if concerns:
        report_lines.append(f"A total of {len(concerns)} item(s) require consumer review before completing checkout.")
    else:
        report_lines.append("No hidden fees or misleading design patterns were detected in the observed flow.")

    report_lines.append(
        "Notice: TinySleuth performs non-destructive guest checkout inspection and never submits orders or card details. "
        "This audit does not guarantee the absence of all merchant fees that may require authentication or location entry."
    )

    summary_report = " ".join(report_lines)
    return findings, summary_report
