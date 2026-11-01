"""Client for the TinyFish Web Agent API.

Docs: https://docs.tinyfish.ai/agent-api
Endpoint: POST /v1/automation/run
Authentication: X-API-Key header
"""

import httpx
from typing import Any
from app.core.config import get_settings
from app.models.schemas import TinyFishRun

AUDIT_GOAL = """
You are an evidence-based checkout pricing auditor. Your task is to inspect this product/booking page and proceed through guest checkout to discover all added charges and preselected add-ons.

IMPORTANT NAVIGATION RULES:
- If the page is a Google Shopping, search results, or price comparison page, click on the merchant's store button ("Visit site", "View on store", or retailer link) to navigate to the actual seller's store.
- Add the item to cart and proceed towards guest checkout as far as allowed without payment credentials or OTP.

STRICT SAFETY RULES:
1. Do NOT submit any final order or payment.
2. Do NOT enter payment card numbers, bank details, or CVVs.
3. Do NOT enter or request SMS OTPs or authenticator codes.
4. If blocked by reCAPTCHA, login, OTP, or credit card forms, STOP immediately and record the exact blocker in blocked_reason.
5. Never guess numbers. If an amount cannot be observed with certainty, set it to null.

AUDIT STEPS:
1. Extract the product/booking title (product_title) and currency (e.g. INR, USD, EUR, etc.).
2. Record the initially advertised base price (initial_price).
3. Proceed towards guest checkout as far as possible without credentials.
4. Record whether you successfully reached the checkout total screen (reached_checkout).
5. Inspect every added line item (taxes, shipping, convenience fee, platform fee, booking charge, insurance, protection plan, charity donation):
   - label: Exact name of the charge
   - amount: Numerical charge amount
   - mandatory: true if required, false if optional add-on, null if unclear
   - preselected: true if an optional checkmark or add-on was already pre-selected by default
   - disclosed_before_checkout: true if disclosed on the initial page, false if it first appeared at checkout
   - evidence: Exact quote or text snippet seen in the webpage
6. Record the final displayed checkout total (final_displayed_total).
7. If stopped by auth/OTP/payment/captcha, explain in blocked_reason.
""".strip()

OUTPUT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "product_title": {"type": "string", "nullable": True},
        "currency": {"type": "string", "nullable": True},
        "initial_price": {"type": "number", "nullable": True},
        "final_displayed_total": {"type": "number", "nullable": True},
        "reached_checkout": {"type": "boolean"},
        "blocked_reason": {"type": "string", "nullable": True},
        "charges": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "label": {"type": "string"},
                    "amount": {"type": "number"},
                    "classification": {"type": "string"},
                    "mandatory": {"type": "boolean", "nullable": True},
                    "preselected": {"type": "boolean"},
                    "disclosed_before_checkout": {"type": "boolean", "nullable": True},
                    "evidence": {"type": "string", "nullable": True},
                },
                "required": ["label", "amount"],
            },
        },
    },
    "required": ["reached_checkout"],
}


class TinyFishError(Exception):
    """Clean domain exception without secret leakage."""
    pass


async def run_audit(url: str) -> TinyFishRun:
    """Execute synchronous goal-based audit via TinyFish Agent API."""
    settings = get_settings()
    if not settings.tinyfish_api_key or settings.tinyfish_api_key == "your_tinyfish_api_key_here":
        raise TinyFishError("TINYFISH_API_KEY is not set. Please add a valid key in backend/.env")

    endpoint = f"{settings.tinyfish_base_url.rstrip('/')}/v1/automation/run"
    headers = {
        "X-API-Key": settings.tinyfish_api_key,
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "url": url,
        "goal": AUDIT_GOAL,
        "output_schema": OUTPUT_SCHEMA,
        "browser_profile": "stealth",
    }

    try:
        async with httpx.AsyncClient(timeout=settings.tinyfish_timeout_seconds) as client:
            resp = await client.post(endpoint, headers=headers, json=payload)
    except httpx.TimeoutException as exc:
        raise TinyFishError(f"TinyFish inspection timed out after {settings.tinyfish_timeout_seconds} seconds.") from exc
    except httpx.HTTPError as exc:
        raise TinyFishError(f"Network error communicating with TinyFish: {exc}") from exc

    if resp.status_code == 401:
        raise TinyFishError("TinyFish authentication failed: Invalid or expired API key. Please verify backend/.env")
    if resp.status_code == 429:
        raise TinyFishError("TinyFish rate limit or credit quota exceeded. Please check your account quota.")
    if resp.status_code >= 400:
        clean_text = resp.text[:300].replace(settings.tinyfish_api_key, "***")
        raise TinyFishError(f"TinyFish returned status {resp.status_code}: {clean_text}")

    data = resp.json()
    status_str = str(data.get("status", "UNKNOWN")).upper()

    return TinyFishRun(
        run_id=data.get("run_id"),
        status=status_str,
        result=data.get("result"),
        error=data.get("error"),
        raw=data,
    )
