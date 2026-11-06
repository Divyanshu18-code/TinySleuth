from typing import Any, Optional
from pydantic import BaseModel, Field


class AuditRequest(BaseModel):
    url: str = Field(..., description="Target product or booking checkout URL to audit.")


class ExtractedCharge(BaseModel):
    """An individual line item or surcharge detected in cart/checkout."""
    label: str
    amount: float = 0.0
    currency: Optional[str] = None
    classification: str = Field(default="other", description="Type of charge: delivery, service_fee, tax, convenience_fee, insurance, add_on, other.")
    mandatory: Optional[bool] = Field(default=None, description="True if mandatory, False if optional, None if unknown.")
    preselected: bool = Field(default=False, description="True if optional item was preselected by default.")
    disclosed_before_checkout: Optional[bool] = Field(default=None, description="True if disclosed early, False if hidden until checkout, None if unknown.")
    evidence: Optional[str] = Field(default=None, description="Verbatim text observed in DOM supporting this item.")
    source_url: Optional[str] = Field(default=None, description="URL where charge was extracted.")


class ExtractedPricing(BaseModel):
    """Raw structured data extracted from the website inspection."""
    product_title: Optional[str] = None
    currency: Optional[str] = None
    initial_price: Optional[float] = None
    final_displayed_total: Optional[float] = None
    charges: list[ExtractedCharge] = Field(default_factory=list)
    reached_checkout: bool = False
    blocked_reason: Optional[str] = None
    source_url: Optional[str] = None


class PricingSummary(BaseModel):
    """Mathematical calculations distinguishing extracted vs derived amounts."""
    initial_price: Optional[float] = None
    final_displayed_total: Optional[float] = None
    mandatory_charges_total: float = 0.0
    optional_selected_charges_total: float = 0.0
    unknown_charges_total: float = 0.0
    expected_total: Optional[float] = None
    price_difference: Optional[float] = None
    percentage_increase: Optional[float] = None
    component_discrepancy: Optional[float] = None
    data_completeness: str = Field(default="inconclusive", description="'complete', 'partial', or 'inconclusive'")


class Finding(BaseModel):
    """Evidence-based audit finding or potential concern."""
    id: str
    category: str = Field(..., description="preselected_addon, hidden_fee, unexplained_increase, component_discrepancy, transparent_pricing, blocked_checkout, informational")
    title: str
    severity: str = Field(default="informational", description="'informational', 'needs_review', 'potential_concern', 'inconclusive'")
    explanation: str
    evidence: Optional[str] = None
    source_url: Optional[str] = None
    confidence: str = Field(default="medium", description="'high', 'medium', 'low'")
    suggested_action: str
    status: str = Field(default="active")


class TinyFishRun(BaseModel):
    """Internal model representing TinyFish API execution result."""
    run_id: Optional[str] = None
    status: str
    result: Optional[Any] = None
    error: Optional[str] = None
    raw: dict = Field(default_factory=dict)


class AuditResponse(BaseModel):
    """Public validated response returned to frontend."""
    audit_id: str
    url: str
    status: str = Field(..., description="'completed', 'inconclusive', 'failed'")
    created_at: str
    completed_at: str
    product_title: Optional[str] = None
    currency: Optional[str] = None
    extracted_pricing: Optional[ExtractedPricing] = None
    pricing_summary: Optional[PricingSummary] = None
    findings: list[Finding] = Field(default_factory=list)
    summary_report: str = ""
    message: Optional[str] = None
    raw_diagnostics: Optional[dict] = None


class CreateOrderRequest(BaseModel):
    amount: float = Field(default=25.0, ge=1.0, description="Contribution amount in INR (minimum ₹1)")


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str = "INR"
    key_id: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

