"""Standalone TinyFish proof of concept.

Usage:
    cd backend
    pip install -r requirements.txt
    cp .env.example .env   # then put your real key in .env
    python ../scripts/tinyfish_poc.py https://example-shop.com/product

It sends the audit goal to TinyFish and prints the raw response, so you can
check whether price and checkout data is extracted reliably before we build more.
"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.parser import parse_pricing  # noqa: E402
from app.services.tinyfish_client import TinyFishError, run_audit  # noqa: E402


async def main(url: str) -> None:
    print(f"Running audit on: {url}\n(this can take a minute or more)\n")
    try:
        run = await run_audit(url)
    except TinyFishError as exc:
        print(f"ERROR: {exc}")
        return

    print("STATUS:", run.status)
    print("RAW RESPONSE:")
    print(json.dumps(run.raw, indent=2, ensure_ascii=False)[:6000])

    pricing = parse_pricing(run.result)
    print("\nVALIDATED PRICING:")
    print(pricing.model_dump_json(indent=2) if pricing else "Could not validate -> would be 'Inconclusive'")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python tinyfish_poc.py <product_url>")
        sys.exit(1)
    asyncio.run(main(sys.argv[1]))
