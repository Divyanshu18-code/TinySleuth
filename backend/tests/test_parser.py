from app.services.parser import clean_number, parse_pricing


def test_clean_number():
    assert clean_number(120) == 120.0
    assert clean_number(99.95) == 99.95
    assert clean_number("₹2,499.50") == 2499.5
    assert clean_number("$1,200") == 1200.0
    assert clean_number("invalid") is None
    assert clean_number(None) is None


def test_parse_valid_dict():
    data = {
        "product_title": "Sneakers",
        "currency": "USD",
        "initial_price": "89.99",
        "final_displayed_total": "99.99",
        "reached_checkout": True,
        "charges": [
            {
                "label": "Shipping Fee",
                "amount": "10.00",
                "mandatory": True,
            }
        ],
    }
    pricing = parse_pricing(data)
    assert pricing is not None
    assert pricing.product_title == "Sneakers"
    assert pricing.initial_price == 89.99
    assert pricing.final_displayed_total == 99.99
    assert len(pricing.charges) == 1
    assert pricing.charges[0].amount == 10.0


def test_parse_markdown_json_string():
    raw_text = """
    Here is the pricing data:
    ```json
    {
      "product_title": "Coffee Maker",
      "currency": "EUR",
      "initial_price": 50,
      "final_displayed_total": 55,
      "reached_checkout": true,
      "charges": [
        {"label": "Eco Tax", "amount": 5, "mandatory": true}
      ]
    }
    ```
    Inspection concluded.
    """
    pricing = parse_pricing(raw_text)
    assert pricing is not None
    assert pricing.product_title == "Coffee Maker"
    assert pricing.currency == "EUR"
    assert pricing.initial_price == 50.0
    assert pricing.final_displayed_total == 55.0


def test_parse_malformed_json():
    assert parse_pricing("this is not json at all") is None
    assert parse_pricing(None) is None
    assert parse_pricing({"broken": [1, 2]}) is not None  # empty valid pricing defaults
