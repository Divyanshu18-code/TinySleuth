import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException

from app.core.security import clean_tracking_url, detect_login_walled_merchant, extract_title_from_url_slug, validate_target_url
from app.models.schemas import AuditRequest, AuditResponse, ExtractedPricing
from app.services.detection_service import generate_findings
from app.services.parser import parse_pricing
from app.services.pricing_service import calculate_pricing_summary
from app.services.tinyfish_client import TinyFishError, run_audit

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "app": "TinySleuth",
        "service": "checkout_truth_auditor",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/audit", response_model=AuditResponse)
async def audit(req: AuditRequest):
    # 1. URL Validation & SSRF Guardrail
    try:
        validated_url = validate_target_url(str(req.url))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    audit_id = f"audit_{uuid.uuid4().hex[:12]}"
    created_at = datetime.now(timezone.utc).isoformat()

    # 2. Check for Known Login-Walled Marketplaces (Instant Sub-Second Evaluation)
    is_walled, merchant_name, wall_explanation = detect_login_walled_merchant(validated_url)
    if is_walled:
        completed_at = datetime.now(timezone.utc).isoformat()
        product_title = extract_title_from_url_slug(validated_url) or f"{merchant_name} Product"
        currency = "₹" if ".in" in validated_url or "flipkart" in validated_url.lower() else "$"

        pricing = ExtractedPricing(
            product_title=product_title,
            currency=currency,
            initial_price=None,
            final_displayed_total=None,
            charges=[],
            reached_checkout=False,
            blocked_reason=f"{merchant_name} mandates personal account login/sign-in to access checkout totals. Halted safely without credentials.",
            source_url=validated_url,
        )
        pricing_summary = calculate_pricing_summary(pricing)
        findings, summary_report = generate_findings(pricing, pricing_summary)

        return AuditResponse(
            audit_id=audit_id,
            url=validated_url,
            status="inconclusive",
            created_at=created_at,
            completed_at=completed_at,
            product_title=product_title,
            currency=currency,
            extracted_pricing=pricing,
            pricing_summary=pricing_summary,
            findings=findings,
            summary_report=summary_report,
            message=pricing.blocked_reason,
            raw_diagnostics={"merchant": merchant_name, "login_walled": True, "evaluation_mode": "instant_intelligence"},
        )

    # 3. Invoke TinyFish Autonomous Web Agent (Clean tracking bloat for faster performance)
    target_url = clean_tracking_url(validated_url)
    try:
        run = await run_audit(target_url)
    except TinyFishError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    completed_at = datetime.now(timezone.utc).isoformat()

    # 3. Parse and Validate Extracted Pricing
    pricing = parse_pricing(run.result, original_url=validated_url)

    # 4. Handle Execution Interruptions / Inconclusive States
    if run.status != "COMPLETED":
        summary = calculate_pricing_summary(None)
        findings, summary_report = generate_findings(None, summary)
        return AuditResponse(
            audit_id=audit_id,
            url=validated_url,
            status="inconclusive",
            created_at=created_at,
            completed_at=completed_at,
            pricing_summary=summary,
            findings=findings,
            summary_report=summary_report,
            message=f"Agent workflow concluded with status '{run.status}'. {run.error or ''}".strip(),
            raw_diagnostics={"run_id": run.run_id, "status": run.status},
        )

    if pricing is None:
        summary = calculate_pricing_summary(None)
        findings, summary_report = generate_findings(None, summary)
        return AuditResponse(
            audit_id=audit_id,
            url=validated_url,
            status="inconclusive",
            created_at=created_at,
            completed_at=completed_at,
            pricing_summary=summary,
            findings=findings,
            summary_report=summary_report,
            message="Agent finished navigation but extracted data could not be validated against pricing schema.",
            raw_diagnostics={"run_id": run.run_id, "result": run.result},
        )

    # 5. Calculate Mathematical Totals & Discrepancies
    pricing_summary = calculate_pricing_summary(pricing)

    # 6. Run Deterministic Detection Engine
    findings, summary_report = generate_findings(pricing, pricing_summary)

    if not pricing.reached_checkout or pricing.blocked_reason or pricing_summary.data_completeness != "complete":
        status_str = "inconclusive"
    else:
        status_str = "completed"

    return AuditResponse(
        audit_id=audit_id,
        url=validated_url,
        status=status_str,
        created_at=created_at,
        completed_at=completed_at,
        product_title=pricing.product_title,
        currency=pricing.currency,
        extracted_pricing=pricing,
        pricing_summary=pricing_summary,
        findings=findings,
        summary_report=summary_report,
        message=pricing.blocked_reason,
        raw_diagnostics={"run_id": run.run_id, "status": run.status},
    )
