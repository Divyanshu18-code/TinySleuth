"""Standalone TinyFish Proof of Concept & CLI Auditor.

Usage:
    cd backend
    python ../scripts/tinyfish_poc.py https://example.com/product
"""

import asyncio
import json
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

# Ensure Windows PowerShell handles unicode emojis safely
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.core.security import validate_target_url  # noqa: E402
from app.services.detection_service import generate_findings  # noqa: E402
from app.services.parser import parse_pricing  # noqa: E402
from app.services.pricing_service import calculate_pricing_summary  # noqa: E402
from app.services.tinyfish_client import TinyFishError, run_audit  # noqa: E402


async def main(url: str) -> None:
    print("=" * 60)
    print("🔍 TinySleuth — CLI Pricing & Checkout Auditor")
    print("=" * 60)

    try:
        validated_url = validate_target_url(url)
    except ValueError as exc:
        print(f"❌ URL Validation Error: {exc}")
        sys.exit(1)

    print(f"Target URL: {validated_url}")
    print("Dispatching TinyFish web agent (inspection takes ~30-60s)...\n")

    try:
        run = await run_audit(validated_url)
    except TinyFishError as exc:
        print(f"❌ TinyFish Error: {exc}")
        sys.exit(1)

    print(f"Agent Execution Status: {run.status}")

    pricing = parse_pricing(run.result)
    if not pricing:
        print("⚠️ Extracted data could not be validated against pricing schema (Status: Inconclusive)")
        print("\nRaw Result:")
        print(json.dumps(run.result, indent=2, ensure_ascii=False))
        return

    summary = calculate_pricing_summary(pricing)
    findings, report = generate_findings(pricing, summary)

    currency = pricing.currency or "$"
    print("\n" + "=" * 60)
    print("📊 PRICING SUMMARY")
    print("=" * 60)
    print(f"Product Title:        {pricing.product_title or 'N/A'}")
    print(f"Initial Price:        {currency}{summary.initial_price if summary.initial_price is not None else 'N/A'}")
    print(f"Final Total:          {currency}{summary.final_displayed_total if summary.final_displayed_total is not None else 'N/A'}")
    print(f"Mandatory Fees Total: {currency}{summary.mandatory_charges_total}")
    print(f"Optional Add-ons:     {currency}{summary.optional_selected_charges_total}")
    print(f"Net Difference:       +{currency}{summary.price_difference if summary.price_difference is not None else 'N/A'} ({summary.percentage_increase or 0}%)")
    print(f"Completeness:         {summary.data_completeness.upper()}")

    if pricing.charges:
        print("\n" + "-" * 60)
        print("🧾 ITEMIZED LINE ITEMS")
        print("-" * 60)
        for c in pricing.charges:
            req = "Mandatory" if c.mandatory else ("Optional" if c.mandatory is False else "Unknown")
            pre = " [PRESELECTED!]" if c.preselected else ""
            print(f"• {c.label:<32} {currency}{c.amount:<8} ({req}){pre}")
            if c.evidence:
                print(f"    Evidence: \"{c.evidence}\"")

    if findings:
        print("\n" + "-" * 60)
        print("⚠️ FINDINGS & DARK PATTERNS")
        print("-" * 60)
        for f in findings:
            print(f"[{f.severity.upper()}] {f.title}")
            print(f"  Explanation: {f.explanation}")
            print(f"  Action:      {f.suggested_action}\n")

    print("=" * 60)
    print("📝 EXECUTIVE SUMMARY")
    print("=" * 60)
    print(report)
    print("=" * 60)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python tinyfish_poc.py <product_url>")
        sys.exit(1)
    asyncio.run(main(sys.argv[1]))
