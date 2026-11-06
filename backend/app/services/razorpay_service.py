import hashlib
import hmac
import httpx
from app.core.config import get_settings

settings = get_settings()
RAZORPAY_API_URL = "https://api.razorpay.com/v1"


async def create_razorpay_order(amount_inr: float) -> dict:
    """Create a new order in Razorpay using HTTP basic authentication."""
    # Convert INR to paise (e.g. ₹25 -> 2500 paise)
    amount_paise = int(round(amount_inr * 100))
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"{RAZORPAY_API_URL}/orders",
            auth=(settings.razorpay_key_id, settings.razorpay_key_secret),
            json={
                "amount": amount_paise,
                "currency": "INR",
                "payment_capture": 1,
            },
        )
        if resp.status_code != 200:
            raise RuntimeError(f"Razorpay order creation failed ({resp.status_code}): {resp.text}")
        data = resp.json()
        return {
            "order_id": data["id"],
            "amount": data["amount"],
            "currency": data["currency"],
            "key_id": settings.razorpay_key_id,
        }


def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify cryptographic HMAC-SHA256 signature returned by Razorpay checkout."""
    if not settings.razorpay_key_secret:
        return False
    message = f"{order_id}|{payment_id}".encode("utf-8")
    expected_signature = hmac.new(
        settings.razorpay_key_secret.encode("utf-8"),
        message,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected_signature, signature)
