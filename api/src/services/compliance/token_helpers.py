"""Token verification and tenant resolution helpers.

Shared across compliance and org_manager routers.
"""

import base64
import json
import os
from typing import Tuple
from urllib.parse import urlparse, urlunparse

import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, status


REALM_PATH = "/realms/"
AUTH_SERVER_URL = os.getenv("KEYCLOAK_INTERNAL_URL") or os.getenv("KEYCLOAK_URL")


def parse_unverified_claims(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Malformed JWT")
        payload = parts[1]
        padding = "=" * (-len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload + padding)
        return json.loads(decoded)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc


def get_realm_from_iss(iss: str | None) -> str:
    if not iss or REALM_PATH not in iss:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing issuer",
        )
    return iss.split(REALM_PATH)[-1]


def _get_issuer_base(iss: str | None) -> str | None:
    if not iss:
        return None
    if REALM_PATH in iss:
        return iss.split(REALM_PATH)[0]
    return iss.rsplit("/", 1)[0] if "/" in iss else None


def _with_docker_host(base_url: str) -> str | None:
    parsed = urlparse(base_url)
    if parsed.hostname not in {"localhost", "127.0.0.1"}:
        return None
    host = "host.docker.internal"
    netloc = f"{host}:{parsed.port}" if parsed.port else host
    return urlunparse((parsed.scheme, netloc, parsed.path, "", "", ""))


def decode_token_verified(token: str, realm: str | None = None) -> dict:
    """Verify a JWT against the Keycloak JWKS endpoint.

    If *realm* is not provided it is extracted from the token issuer claim.
    """
    claims = parse_unverified_claims(token)
    if realm is None:
        realm = get_realm_from_iss(claims.get("iss"))
    issuer_base = _get_issuer_base(claims.get("iss"))

    candidates = []
    if AUTH_SERVER_URL:
        candidates.append(AUTH_SERVER_URL)
    if issuer_base and issuer_base not in candidates:
        candidates.append(issuer_base)

    extra_candidates: list[str] = []
    for base_url in candidates:
        docker_host = _with_docker_host(base_url)
        if docker_host and docker_host not in candidates and docker_host not in extra_candidates:
            extra_candidates.append(docker_host)
    if extra_candidates:
        candidates.extend(extra_candidates)

    if not candidates:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="KEYCLOAK_URL is not configured",
        )

    last_exc: Exception | None = None
    for base_url in candidates:
        jwks_url = f"{base_url}/realms/{realm}/protocol/openid-connect/certs"
        try:
            jwk_client = PyJWKClient(jwks_url)
            signing_key = jwk_client.get_signing_key_from_jwt(token)
            decoded = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
            return decoded
        except Exception as exc:
            last_exc = exc
            continue

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token",
    ) from last_exc


def get_user_and_tenant(token: str) -> Tuple[str, str | None]:
    """Decode the token and return (user_identifier, tenant)."""
    claims = decode_token_verified(token)

    user_identifier = (
        claims.get("preferred_username") or claims.get("email") or claims.get("sub")
    )
    if not user_identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to resolve user identifier from token",
        )

    tenant = get_realm_from_iss(claims.get("iss"))
    tenant = claims.get("tenant", tenant)
    return user_identifier, tenant


def require_tenant(tenant: str | None) -> str:
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant could not be resolved from token.",
        )
    return tenant


def resolve_user_identifier(token: str, realm: str) -> str | None:
    """Best-effort user identifier from a verified token."""
    try:
        decoded = decode_token_verified(token, realm)
    except Exception:
        return None
    return (
        decoded.get("preferred_username") or decoded.get("email") or decoded.get("sub")
    )
