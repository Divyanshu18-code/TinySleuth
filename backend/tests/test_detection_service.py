from app.models.schemas import ExtractedCharge, ExtractedPricing, PricingSummary
from app.services.detection_service import generate_findings


def test_detect_preselected_addon():
    pricing = ExtractedPricing(
        product_title="Hotel Stay",
        currency="USD",
        initial_price=200.0,
        final_displayed_total=230.0,
        reached_checkout=True,
        charges=[
            ExtractedCharge(
                label="City Tourism Tax",
                amount=15.0,
                mandatory=True,
                disclosed_before_checkout=True,
            ),
            ExtractedCharge(
                label="Pre-ticked Breakfast Buffet",
                amount=15.0,
                mandatory=False,
                preselected=True,
                evidence="Checkbox checked by default: Add Breakfast ($15)",
            ),
        ],
    )
    summary = PricingSummary(
        initial_price=200.0,
        final_displayed_total=230.0,
        mandatory_charges_total=15.0,
        optional_selected_charges_total=15.0,
        expected_total=230.0,
        price_difference=30.0,
        percentage_increase=15.0,
        data_completeness="complete",
    )

    findings, report = generate_findings(pricing, summary)
    preselected = [f for f in findings if f.category == "preselected_addon"]
    assert len(preselected) == 1
    assert "Pre-selected Optional Add-on" in preselected[0].title
    assert preselected[0].severity == "potential_concern"
    assert "Pre-ticked Breakfast Buffet" in preselected[0].title


def test_detect_undisclosed_fee():
    pricing = ExtractedPricing(
        currency="INR",
        initial_price=500.0,
        final_displayed_total=560.0,
        reached_checkout=True,
        charges=[
            ExtractedCharge(
                label="Platform Convenience Fee",
                amount=60.0,
                mandatory=True,
                disclosed_before_checkout=False,
                evidence="Fee injected at payment step",
            )
        ],
    )
    summary = PricingSummary(
        initial_price=500.0,
        final_displayed_total=560.0,
        mandatory_charges_total=60.0,
        expected_total=560.0,
        price_difference=60.0,
        percentage_increase=12.0,
        data_completeness="complete",
    )

    findings, report = generate_findings(pricing, summary)
    hidden = [f for f in findings if f.category == "hidden_fee"]
    assert len(hidden) == 1
    assert hidden[0].severity == "needs_review"


def test_transparent_pricing_finding():
    pricing = ExtractedPricing(
        currency="USD",
        initial_price=50.0,
        final_displayed_total=50.0,
        reached_checkout=True,
        charges=[],
    )
    summary = PricingSummary(
        initial_price=50.0,
        final_displayed_total=50.0,
        price_difference=0.0,
        data_completeness="complete",
    )
    findings, report = generate_findings(pricing, summary)
    transparent = [f for f in findings if f.category == "transparent_pricing"]
    assert len(transparent) == 1
    assert transparent[0].severity == "informational"
    assert "matched the advertised price" in report


def test_inconclusive_blocked_checkout():
    pricing = ExtractedPricing(
        reached_checkout=False,
        blocked_reason="Merchant enforced mandatory SMS OTP verification.",
    )
    summary = PricingSummary(data_completeness="inconclusive")
    findings, report = generate_findings(pricing, summary)

    assert len(findings) == 1
    assert findings[0].category == "blocked_checkout"
    assert findings[0].severity == "inconclusive"
    assert "SMS OTP" in report
