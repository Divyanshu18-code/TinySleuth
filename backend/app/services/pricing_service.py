import math
from typing import Optional
from app.models.schemas import ExtractedCharge, ExtractedPricing, PricingSummary


def deduplicate_charges(charges: list[ExtractedCharge]) -> list[ExtractedCharge]:
    """
    Remove exact duplicate charges while preserving order.
    A charge is duplicate if label, amount, and mandatory status match identically.
    """
    seen: set[tuple[str, float, Optional[bool]]] = set()
    unique: list[ExtractedCharge] = []

    for c in charges:
        # Normalize label for key
        key = (c.label.strip().lower(), round(c.amount, 2), c.mandatory)
        if key not in seen:
            seen.add(key)
            unique.append(c)

    return unique


def calculate_pricing_summary(extracted: Optional[ExtractedPricing]) -> PricingSummary:
    """
    Perform deterministic mathematical comparisons distinguishing extracted values
    from calculated values without guessing missing data.
    """
    if extracted is None:
        return PricingSummary(data_completeness="inconclusive")

    initial = extracted.initial_price
    final = extracted.final_displayed_total

    # Validate numeric bounds
    if initial is not None and (math.isnan(initial) or initial < 0):
        initial = None
    if final is not None and (math.isnan(final) or final < 0):
        final = None

    # Deduplicate observed charges
    unique_charges = deduplicate_charges(extracted.charges)

    mandatory_sum = 0.0
    optional_selected_sum = 0.0
    unknown_sum = 0.0

    for charge in unique_charges:
        amt = round(charge.amount, 2)
        if charge.mandatory is True:
            mandatory_sum += amt
        elif charge.mandatory is False:
            # Only include optional charges in total if they were preselected / selected in checkout
            if charge.preselected:
                optional_selected_sum += amt
        else:
            # Mandatory status is unknown
            unknown_sum += amt

    mandatory_sum = round(mandatory_sum, 2)
    optional_selected_sum = round(optional_selected_sum, 2)
    unknown_sum = round(unknown_sum, 2)

    expected_total: Optional[float] = None
    if initial is not None:
        expected_total = round(initial + mandatory_sum + optional_selected_sum, 2)

    price_diff: Optional[float] = None
    pct_increase: Optional[float] = None
    if initial is not None and final is not None:
        price_diff = round(final - initial, 2)
        if initial > 0 and final >= initial:
            pct_increase = round(((final - initial) / initial) * 100, 1)

    component_discrepancy: Optional[float] = None
    if final is not None and expected_total is not None:
        # Difference between actual final total and the sum of initial + extracted charges
        discrepancy = round(final - expected_total, 2)
        if abs(discrepancy) > 0.01:
            component_discrepancy = discrepancy

    # Determine completeness
    if initial is not None and final is not None and extracted.reached_checkout:
        completeness = "complete"
    elif initial is not None or final is not None or len(unique_charges) > 0:
        completeness = "partial"
    else:
        completeness = "inconclusive"

    return PricingSummary(
        initial_price=initial,
        final_displayed_total=final,
        mandatory_charges_total=mandatory_sum,
        optional_selected_charges_total=optional_selected_sum,
        unknown_charges_total=unknown_sum,
        expected_total=expected_total,
        price_difference=price_diff,
        percentage_increase=pct_increase,
        component_discrepancy=component_discrepancy,
        data_completeness=completeness,
    )
