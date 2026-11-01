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
You are a fast, evidence-based checkout pricing auditor.

CRITICAL FIRST REQUIREMENT (IMMEDIATELY UPON PAGE LOAD):
1. BEFORE clicking any button, link, or cart icon, inspect the current product landing page:
   - Extract `product_title`: The full title/name of the item.
   - Extract `currency`: Currency code or symbol (e.g. INR, ₹, USD, $, EUR).
   - Extract `initial_price`: The primary advertised base price visible right now on this product page (number only).
2. You MUST record product_title and initial_price before taking ANY navigation or click action!

FAST-FAIL ON LOGIN / SIGN-IN SCREENS:
- Many major e-commerce platforms (e.g. Amazon, Flipkart) do not allow guest checkout and force account sign-in/login.
- If clicking 'Add to Cart' or 'Buy Now' redirects to a sign-in or login page (e.g. /ap/signin, /login, OTP verification), or if guest checkout is unavailable:
  - DO NOT try to log in, do not enter credentials, and do not wander around.
  - Set `reached_checkout`: false
  - Set `blocked_reason`: "Merchant mandates account login/sign-in to access checkout. Halted safely without credentials."
  - Return your response immediately with the product_title and initial_price you extracted in Step 1.

GUEST CHECKOUT FLOW (IF GUEST CHECKOUT IS ALLOWED):
- Proceed through guest checkout to reach the order summary screen showing taxes, shipping, and line items.
- Set `reached_checkout`: true
- Extract `final_displayed_total` and list all line item charges (taxes, shipping, fees, protection plans, donations):
  - label: Exact name of the charge
  - amount: Numerical charge amount
  - mandatory: true if required, false if optional add-on
  - preselected: true if an optional checkmark or add-on was already pre-selected by default
  - disclosed_before_checkout: true if disclosed on the initial page, false if it first appeared at checkout
  - evidence: Exact quote or text snippet seen in the webpage
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
