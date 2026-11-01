"""Thin client for the TinyFish Agent API.

Docs: https://docs.tinyfish.ai/agent-api
Auth: X-API-Key header. Blocking endpoint: POST /v1/automation/run
"""

import httpx

from app.core.config import get_settings
from app.models.schemas import TinyFishRun

AUDIT_GOAL = """
You are auditing the checkout price of a shopping or booking website.
Do NOT submit payment. Do NOT enter login credentials, OTPs or card details.
If a step requires login, OTP or payment details, stop and report it in blocked_reason.

Steps:
1. Read the displayed product price on this page (initial_price).
2. Add the item to cart / proceed toward checkout as a guest, as far as possible without logging in.
3. Record every extra line item you can see (shipping, handling, service fee, taxes, protection plans, add-ons).
   For each: label, amount, whether it is mandatory or optional, whether it was preselected,
   whether it was disclosed before checkout, and a short evidence note (the text you saw).
4. Record the final displayed total (final_displayed_total).

Return ONLY JSON in this shape:
{
  "currency": "INR",
  "initial_price": 0,
  "final_displayed_total": 0,
  "reached_checkout": true,
  "blocked_reason": null,
  "charges": [
    {"label": "", "amount": 0, "mandatory": true, "preselected": false,
     "disclosed_before_checkout": true, "evidence": ""}
  ]
}
Use null for anything you could not observe. Never guess values.
""".strip()


class TinyFishError(Exception):
    pass


async def run_audit(url: str) -> TinyFishRun:
    settings = get_settings()
    if not settings.tinyfish_api_key:
        raise TinyFishError("TINYFISH_API_KEY is not set. Add it to backend/.env")

    endpoint = f"{settings.tinyfish_base_url}/v1/automation/run"
    headers = {"X-API-Key": settings.tinyfish_api_key, "Content-Type": "application/json"}
    payload = {"url": url, "goal": AUDIT_GOAL}

    try:
        async with httpx.AsyncClient(timeout=settings.tinyfish_timeout_seconds) as client:
            resp = await client.post(endpoint, headers=headers, json=payload)
    except httpx.TimeoutException as exc:
        raise TinyFishError("TinyFish run timed out") from exc
    except httpx.HTTPError as exc:
        raise TinyFishError(f"Could not reach TinyFish: {exc}") from exc

    if resp.status_code >= 400:
        raise TinyFishError(f"TinyFish returned {resp.status_code}: {resp.text[:300]}")

    data = resp.json()
    return TinyFishRun(
        status=str(data.get("status", "UNKNOWN")),
        result=data.get("result"),
        raw=data,
    )
