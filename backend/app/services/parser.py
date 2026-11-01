import json
from typing import Any, Optional

from pydantic import ValidationError

from app.models.schemas import ExtractedPricing


def parse_pricing(result: Any) -> Optional[ExtractedPricing]:
    """Turn the agent's result into validated pricing data, or None if unusable."""
    if result is None:
        return None
    if isinstance(result, str):
        text = result.strip()
        if text.startswith("```"):
            text = text.strip("`")
            if text.lower().startswith("json"):
                text = text[4:]
        try:
            result = json.loads(text)
        except json.JSONDecodeError:
            return None
    if not isinstance(result, dict):
        return None
    try:
        return ExtractedPricing.model_validate(result)
    except ValidationError:
        return None
