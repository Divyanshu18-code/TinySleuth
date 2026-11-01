from app.models.schemas import ExtractedCharge, ExtractedPricing
from app.services.pricing_service import calculate_pricing_summary, deduplicate_charges


def test_standard_pricing_calculation():
    pricing = ExtractedPricing(
        product_title="Wireless Headphones",
        currency="USD",
        initial_price=100.0,
        final_displayed_total=125.0,
        reached_checkout=True,
        charges=[
            ExtractedCharge(label="Standard Shipping", amount=15.0, mandatory=True),
            ExtractedCharge(label="Sales Tax", amount=10.0, mandatory=True),
        ],
    )
    summary = calculate_pricing_summary(pricing)
    assert summary.initial_price == 100.0
    assert summary.final_displayed_total == 125.0
    assert summary.mandatory_charges_total == 25.0
    assert summary.optional_selected_charges_total == 0.0
    assert summary.expected_total == 125.0
    assert summary.price_difference == 25.0
    assert summary.percentage_increase == 25.0
    assert summary.component_discrepancy is None
    assert summary.data_completeness == "complete"


def test_optional_preselected_charges():
    pricing = ExtractedPricing(
        product_title="Flight Ticket",
        currency="INR",
        initial_price=3000.0,
        final_displayed_total=3500.0,
        reached_checkout=True,
        charges=[
            ExtractedCharge(label="Mandatory Aviation Fee", amount=300.0, mandatory=True),
            ExtractedCharge(label="Travel Insurance", amount=200.0, mandatory=False, preselected=True),
            ExtractedCharge(label="Carbon Offset", amount=50.0, mandatory=False, preselected=False),
        ],
    )
    summary = calculate_pricing_summary(pricing)
    assert summary.mandatory_charges_total == 300.0
    # Carbon offset was NOT preselected, so it should NOT be in optional_selected
    assert summary.optional_selected_charges_total == 200.0
    assert summary.expected_total == 3500.0
    assert summary.price_difference == 500.0


def test_deduplicate_identical_charges():
    charges = [
        ExtractedCharge(label="Service Tax", amount=25.0, mandatory=True),
        ExtractedCharge(label="service tax ", amount=25.0, mandatory=True),  # duplicate
        ExtractedCharge(label="Handling Fee", amount=10.0, mandatory=True),
    ]
    unique = deduplicate_charges(charges)
    assert len(unique) == 2


def test_component_discrepancy_detection():
    # Base 100 + mandatory 10 = 110, but final total is 130
    pricing = ExtractedPricing(
        initial_price=100.0,
        final_displayed_total=130.0,
        reached_checkout=True,
        charges=[
            ExtractedCharge(label="Shipping", amount=10.0, mandatory=True),
        ],
    )
    summary = calculate_pricing_summary(pricing)
    assert summary.expected_total == 110.0
    assert summary.component_discrepancy == 20.0  # 130 - 110 = 20 unexplained


def test_missing_initial_or_final_price():
    pricing = ExtractedPricing(
        initial_price=None,
        final_displayed_total=150.0,
        reached_checkout=True,
        charges=[ExtractedCharge(label="Delivery", amount=15.0, mandatory=True)],
    )
    summary = calculate_pricing_summary(pricing)
    assert summary.initial_price is None
    assert summary.expected_total is None
    assert summary.price_difference is None
    assert summary.percentage_increase is None
    assert summary.data_completeness == "partial"


def test_empty_or_none_pricing():
    summary = calculate_pricing_summary(None)
    assert summary.data_completeness == "inconclusive"
    assert summary.initial_price is None
