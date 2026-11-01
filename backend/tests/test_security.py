import pytest
from app.core.security import validate_target_url


def test_valid_urls():
    assert validate_target_url("https://example.com/product") == "https://example.com/product"
    assert validate_target_url("http://example.com/item?id=123") == "http://example.com/item?id=123"
    assert validate_target_url("  https://example.com/clean  ") == "https://example.com/clean"


def test_invalid_schemes():
    with pytest.raises(ValueError, match="Unsupported URL scheme"):
        validate_target_url("ftp://example.com/file")

    with pytest.raises(ValueError, match="Unsupported URL scheme"):
        validate_target_url("file:///etc/passwd")

    with pytest.raises(ValueError, match="Unsupported URL scheme"):
        validate_target_url("javascript:alert(1)")


def test_reject_localhost():
    with pytest.raises(ValueError, match="Access to local or cloud metadata hosts is prohibited"):
        validate_target_url("http://localhost:8000/api")

    with pytest.raises(ValueError, match="Access to local or cloud metadata hosts is prohibited"):
        validate_target_url("http://127.0.0.1:3000")


def test_reject_private_ip():
    with pytest.raises(ValueError, match="Access to private, loopback, or reserved IP addresses is prohibited"):
        validate_target_url("http://192.168.1.1/admin")

    with pytest.raises(ValueError, match="Access to private, loopback, or reserved IP addresses is prohibited"):
        validate_target_url("http://10.0.0.5/checkout")

    with pytest.raises(ValueError, match="Access to private, loopback, or reserved IP addresses is prohibited"):
        validate_target_url("http://172.16.0.10:8080")


def test_reject_cloud_metadata():
    with pytest.raises(ValueError, match="Access to private, loopback, or reserved IP addresses is prohibited"):
        validate_target_url("http://169.254.169.254/latest/meta-data/")

    with pytest.raises(ValueError, match="Access to local or cloud metadata hosts is prohibited"):
        validate_target_url("http://metadata.google.internal/computeMetadata/v1/")


def test_reject_empty_or_too_long():
    with pytest.raises(ValueError, match="non-empty string"):
        validate_target_url("")

    with pytest.raises(ValueError, match="maximum length"):
        validate_target_url("https://example.com/" + "a" * 2050)
