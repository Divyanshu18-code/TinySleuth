import json
import re
from typing import Any, Optional
from pydantic import ValidationError

from app.models.schemas import ExtractedCharge, ExtractedPricing


def clean_number(val: Any) -> Optional[float]:
    """Extract clean float from numbers or currency strings (e.g. '₹2,499.50' -> 2499.50)."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        # Remove common currency symbols and commas
        cleaned = re.sub(r"[^\d.-]", "", val.strip())
        try:
            return float(cleaned)
        except (ValueError, TypeError):
            return None
    return None


def parse_pricing(result: Any, original_url: Optional[str] = None) -> Optional[ExtractedPricing]:
    """Turn the agent's raw output into validated ExtractedPricing data, or None if unusable."""
    if result is None:
        return None

    # If result is inside a wrapper like {"result": {...}}
    if isinstance(result, dict) and "result" in result and isinstance(result["result"], (dict, str)):
        result = result["result"]

    if isinstance(result, str):
        text = result.strip()
        # Strip markdown fences if present
        if "```" in text:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
            if match:
                text = match.group(1).strip()
            else:
                text = text.replace("```", "").strip()

        # Try to locate the main JSON object if extra commentary surrounds it
        start_idx = text.find("{")
        end_idx = text.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            text = text[start_idx : end_idx + 1]

        try:
            result = json.loads(text)
        except json.JSONDecodeError:
            return None

    if not isinstance(result, dict):
        return None

    # Unpack charges and sanitize numerical amounts
    raw_charges = result.get("charges")
    sanitized_charges: list[ExtractedCharge] = []

    if isinstance(raw_charges, list):
        for item in raw_charges:
            if isinstance(item, dict):
                label = str(item.get("label") or "Unlabeled Charge").strip()
                amount = clean_number(item.get("amount")) or 0.0
                sanitized_charges.append(
                    ExtractedCharge(
                        label=label,
                        amount=round(amount, 2),
                        currency=item.get("currency"),
                        classification=str(item.get("classification") or "other").lower(),
                        mandatory=item.get("mandatory"),
                        preselected=bool(item.get("preselected", False)),
                        disclosed_before_checkout=item.get("disclosed_before_checkout"),
                        evidence=item.get("evidence"),
                        source_url=item.get("source_url"),
                    )
                )

    product_title = result.get("product_title")
    if not product_title and original_url:
        from app.core.security import extract_title_from_url_slug
        product_title = extract_title_from_url_slug(original_url)

    currency = result.get("currency")
    if not currency and original_url:
        from urllib.parse import urlparse
        host = (urlparse(original_url).hostname or "").lower()
        if host.endswith(".in") or "amazon.in" in host or "flipkart.com" in host:
            currency = "₹"
        elif host.endswith(".uk") or "co.uk" in host:
            currency = "£"
        elif any(host.endswith(tld) for tld in (".de", ".fr", ".es", ".it", ".eu")):
            currency = "€"
        else:
            currency = "$"

    try:
        return ExtractedPricing(
            product_title=product_title,
            currency=currency,
            initial_price=clean_number(result.get("initial_price")),
            final_displayed_total=clean_number(result.get("final_displayed_total")),
            charges=sanitized_charges,
            reached_checkout=bool(result.get("reached_checkout", False)),
            blocked_reason=result.get("blocked_reason"),
            source_url=result.get("source_url") or original_url,
        )
    except ValidationError:
        return None
