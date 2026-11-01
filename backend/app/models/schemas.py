from typing import Any, Optional

from pydantic import BaseModel, Field, HttpUrl


class AuditRequest(BaseModel):
    url: HttpUrl


class ExtractedCharge(BaseModel):
    label: str
    amount: float
    mandatory: bool = True
    preselected: bool = False
    disclosed_before_checkout: Optional[bool] = None
    evidence: Optional[str] = None


class ExtractedPricing(BaseModel):
    """Structured data we ask TinyFish to return. Validated by Pydantic."""

    currency: Optional[str] = None
    initial_price: Optional[float] = None
    final_displayed_total: Optional[float] = None
    charges: list[ExtractedCharge] = Field(default_factory=list)
    reached_checkout: bool = False
    blocked_reason: Optional[str] = None


class TinyFishRun(BaseModel):
    status: str
    result: Optional[Any] = None
    raw: dict = Field(default_factory=dict)


class AuditResponse(BaseModel):
    url: str
    status: str
    pricing: Optional[ExtractedPricing] = None
    message: Optional[str] = None
    raw_agent_result: Optional[Any] = None
