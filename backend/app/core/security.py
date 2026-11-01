import ipaddress
import re
import socket
from typing import Optional
from urllib.parse import parse_qsl, unquote, urlencode, urlparse, urlunparse


BLOCKED_HOSTS = {
    "localhost",
    "127.0.0.1",
    "::1",
    "metadata.google.internal",
    "instance-data",
}

BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # AWS/GCP/Azure link-local metadata
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("192.88.99.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    ipaddress.ip_network("224.0.0.0/4"),  # Multicast
    ipaddress.ip_network("240.0.0.0/4"),  # Reserved
    ipaddress.ip_network("255.255.255.255/32"),
    # IPv6
    ipaddress.ip_network("::/128"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),  # Unique local
    ipaddress.ip_network("fe80::/10"),  # Link-local
    ipaddress.ip_network("ff00::/8"),  # Multicast
]


NAT64_PREFIX = ipaddress.ip_network("64:ff9b::/96")


def is_ip_blocked(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Return True if IP is private, loopback, link-local, reserved, or multicast."""
    # Special handling for RFC 6052 IPv4/IPv6 translation prefix used by mobile/ISP networks
    if isinstance(ip, ipaddress.IPv6Address) and ip in NAT64_PREFIX:
        embedded_v4 = ipaddress.IPv4Address(ip.packed[-4:])
        return is_ip_blocked(embedded_v4)

    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast:
        return True
    if ip.is_reserved and not ip.is_global:
        return True
    for net in BLOCKED_IP_NETWORKS:
        if ip in net:
            return True
    return False


def validate_target_url(raw_url: str) -> str:
    """
    Validate target URL against SSRF and unsupported schemes.
    Allows only http and https with publicly resolvable hostnames.
    """
    if not raw_url or not isinstance(raw_url, str):
        raise ValueError("URL must be a non-empty string.")

    cleaned_url = raw_url.strip()
    if len(cleaned_url) > 2048:
        raise ValueError("URL exceeds maximum length of 2048 characters.")

    parsed = urlparse(cleaned_url)

    if parsed.scheme.lower() not in ("http", "https"):
        raise ValueError(f"Unsupported URL scheme '{parsed.scheme}'. Only http and https are permitted.")

    hostname = parsed.hostname
    if not hostname:
        raise ValueError("URL must contain a valid hostname.")

    hostname_lower = hostname.lower()

    if hostname_lower in BLOCKED_HOSTS:
        raise ValueError("Access to local or cloud metadata hosts is prohibited.")

    if hostname_lower.endswith(".internal") or hostname_lower.endswith(".local"):
        raise ValueError("Access to internal hostnames is prohibited.")

    # Check if hostname is directly an IP address
    try:
        ip = ipaddress.ip_address(hostname_lower)
        if is_ip_blocked(ip):
            raise ValueError("Access to private, loopback, or reserved IP addresses is prohibited.")
        return cleaned_url
    except ValueError as exc:
        if "prohibited" in str(exc):
            raise
        # Not a raw IP literal, proceed to DNS check

    # Resolve hostname to verify destination IP is not internal/private
    try:
        resolved_ips = socket.getaddrinfo(hostname_lower, parsed.port or (443 if parsed.scheme == "https" else 80))
        for res in resolved_ips:
            sockaddr = res[4]
            ip_str = sockaddr[0]
            ip_obj = ipaddress.ip_address(ip_str)
            if is_ip_blocked(ip_obj):
                raise ValueError("Hostname resolves to a private, loopback, or reserved IP address.")
    except socket.gaierror as exc:
        raise ValueError(f"Could not resolve hostname '{hostname_lower}': {exc}") from exc

    return cleaned_url


def clean_tracking_url(raw_url: str) -> str:
    """
    Clean tracking tokens and canonicalize URLs for major merchants (e.g. Amazon, Flipkart).
    Strips affiliate bloat, tracking IDs, and session tokens to speed up page loads.
    """
    cleaned = raw_url.strip()
    parsed = urlparse(cleaned)
    hostname = (parsed.hostname or "").lower()

    # Amazon URL canonicalization: extract ASIN
    if "amazon." in hostname:
        asin_match = re.search(r"/(?:dp|gp/product)/([A-Z0-9]{10})", parsed.path, re.IGNORECASE)
        if asin_match:
            asin = asin_match.group(1).upper()
            return f"{parsed.scheme}://{parsed.netloc}/dp/{asin}"

    # Amazon Shortlinks (amzn.in, amzn.to)
    if "amzn.in" in hostname or "amzn.to" in hostname:
        return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

    # Flipkart URL canonicalization: keep path and pid
    if "flipkart.com" in hostname:
        pid_match = re.search(r"[?&]pid=([A-Z0-9]+)", parsed.query, re.IGNORECASE)
        if pid_match:
            return f"{parsed.scheme}://{parsed.netloc}{parsed.path}?pid={pid_match.group(1)}"

    # General tracking parameters removal
    if parsed.query:
        query_params = parse_qsl(parsed.query, keep_blank_values=True)
        filtered = [
            (k, v)
            for k, v in query_params
            if not (
                k.lower().startswith("utm_")
                or k.lower() in ("fbclid", "gclid", "_ga", "_gl", "ref", "ref_", "dib", "dib_tag", "qid", "sr")
            )
        ]
        if len(filtered) != len(query_params):
            new_query = urlencode(filtered)
            return urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))

    return cleaned


def extract_title_from_url_slug(raw_url: str) -> Optional[str]:
    """
    Extract human-readable product title from URL slug if available.
    Useful when the merchant blocks guest checkout before page metadata is extracted.
    """
    try:
        parsed = urlparse(raw_url)
        # Match Amazon /<slug>/dp/<ASIN>
        match = re.search(r"/([^/]+)/(?:dp|gp/product)/[A-Z0-9]{10}", parsed.path, re.IGNORECASE)
        if match:
            slug = match.group(1)
            title = unquote(slug).replace("-", " ").replace("_", " ").strip()
            if len(title) > 3:
                return title

        # Match Amazon short links amzn.in/d/<token>
        hostname = (parsed.hostname or "").lower()
        if "amzn.in" in hostname or "amzn.to" in hostname:
            token_match = re.search(r"/d/([A-Za-z0-9]+)", parsed.path)
            if token_match:
                return f"Amazon India Shared Item (Ref: {token_match.group(1)})"
            return "Amazon India Shared Product"

        # Fallback Amazon ASIN if no slug
        if "amazon." in hostname:
            asin_match = re.search(r"/(?:dp|gp/product)/([A-Z0-9]{10})", parsed.path, re.IGNORECASE)
            if asin_match:
                return f"Amazon Item (ASIN: {asin_match.group(1).upper()})"

        # Match Flipkart pid or slug
        if "flipkart.com" in (parsed.hostname or "").lower():
            slug_match = re.search(r"/([^/]+)/p/itm", parsed.path, re.IGNORECASE)
            if slug_match:
                return unquote(slug_match.group(1)).replace("-", " ").strip()

        # Match general ecommerce slug e.g. /products/<slug> or /product/<slug>
        match = re.search(r"/(?:products?|items?|p)/([^/?#]+)", parsed.path, re.IGNORECASE)
        if match:
            slug = match.group(1)
            title = unquote(slug).replace("-", " ").replace("_", " ").strip()
            if len(title) > 3:
                return title
    except Exception:
        pass
    return None


LOGIN_WALLED_MERCHANTS: dict[str, str] = {
    "amazon.": "Amazon mandates account login (password and OTP) before checkout totals and delivery fees are revealed.",
    "amzn.in": "Amazon India mandates account login (password and OTP) before checkout totals and delivery fees are revealed.",
    "amzn.to": "Amazon mandates account login (password and OTP) before checkout totals and delivery fees are revealed.",
    "flipkart.": "Flipkart requires user sign-in with phone number / OTP before proceeding to checkout.",
    "fkrt.it": "Flipkart requires user sign-in with phone number / OTP before proceeding to checkout.",
    "myntra.": "Myntra strictly requires mobile OTP login before viewing bag checkout details.",
    "ajio.": "Ajio requires account login before accessing checkout and delivery charges.",
    "nykaa.": "Nykaa requires user authentication before checkout total breakdown.",
    "tatacliq.": "Tata CLiQ mandates personal login before order checkout.",
    "meesho.": "Meesho requires phone number OTP verification for checkout.",
    "aliexpress.": "AliExpress mandates user login to access final payment and checkout screens.",
}


def detect_login_walled_merchant(raw_url: str) -> tuple[bool, Optional[str], Optional[str]]:
    """
    Identifies known merchants that strictly enforce user authentication (login/OTP)
    and do not support guest checkout.
    Returns: (is_login_walled, merchant_name, explanation)
    """
    try:
        parsed = urlparse(raw_url)
        hostname = (parsed.hostname or "").lower()
        if any(k in hostname for k in ("amazon.", "amzn.in", "amzn.to")):
            merchant_name = "Amazon India" if (".in" in hostname or "amzn.in" in hostname) else "Amazon"
            return True, merchant_name, LOGIN_WALLED_MERCHANTS.get("amzn.in" if "amzn.in" in hostname else "amazon.")
        if any(k in hostname for k in ("flipkart.", "fkrt.it")):
            return True, "Flipkart", LOGIN_WALLED_MERCHANTS.get("flipkart.")
        for key, explanation in LOGIN_WALLED_MERCHANTS.items():
            if key in hostname:
                merchant_name = key.rstrip(".").capitalize()
                return True, merchant_name, explanation
    except Exception:
        pass
    return False, None, None
