from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import TinyFishRun
from app.services.tinyfish_client import TinyFishError

client = TestClient(app)


def test_health_endpoints():
    r1 = client.get("/api/health")
    assert r1.status_code == 200
    assert r1.json()["status"] == "ok"

    r2 = client.get("/health")
    assert r2.status_code == 200
    assert r2.json()["status"] == "ok"


def test_audit_ssrf_rejection():
    # Attempting to audit localhost or private network
    resp = client.post("/api/audit", json={"url": "http://localhost:8000/secret"})
    assert resp.status_code == 400
    assert "prohibited" in resp.json()["detail"].lower()


@patch("app.api.routes.run_audit")
def test_successful_mocked_audit(mock_run):
    mock_run.return_value = TinyFishRun(
        run_id="test_run_123",
        status="COMPLETED",
        result={
            "product_title": "Test Product",
            "currency": "USD",
            "initial_price": 50.0,
            "final_displayed_total": 60.0,
            "reached_checkout": True,
            "charges": [
                {
                    "label": "Delivery Charge",
                    "amount": 10.0,
                    "mandatory": True,
                    "evidence": "Standard ground shipping: $10.00",
                }
            ],
        },
    )

    resp = client.post("/api/audit", json={"url": "https://example.com/product"})
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "completed"
    assert data["product_title"] == "Test Product"
    assert data["pricing_summary"]["initial_price"] == 50.0
    assert data["pricing_summary"]["final_displayed_total"] == 60.0
    assert data["pricing_summary"]["price_difference"] == 10.0
    assert len(data["findings"]) >= 1


@patch("app.api.routes.run_audit")
def test_audit_tinyfish_error_propagation(mock_run):
    mock_run.side_effect = TinyFishError("TinyFish inspection timed out after 300 seconds.")

    resp = client.post("/api/audit", json={"url": "https://example.com/product"})
    assert resp.status_code == 502
    assert "timed out" in resp.json()["detail"]


@patch("app.api.routes.run_audit")
def test_audit_inconclusive_when_blocked(mock_run):
    mock_run.return_value = TinyFishRun(
        run_id="test_run_blocked",
        status="COMPLETED",
        result={
            "product_title": "Hotel Room",
            "currency": "INR",
            "initial_price": 5000.0,
            "final_displayed_total": None,
            "reached_checkout": False,
            "blocked_reason": "Site enforced mandatory phone OTP before viewing total",
            "charges": [],
        },
    )

    resp = client.post("/api/audit", json={"url": "https://example.com/hotel"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "inconclusive"
    assert "OTP" in data["summary_report"]
