from fastapi import HTTPException

from src.services.compliance import token_helpers


def _mock_claims(iss: str, roles: list[str], preferred_username: str = "user") -> dict:
    return {
        "iss": iss,
        "preferred_username": preferred_username,
        "realm_access": {"roles": roles},
    }


def test_require_tenant_learner_context_blocks_platform_realm(monkeypatch):
    claims = _mock_claims("https://keycloak:8080/realms/platform", roles=[])
    monkeypatch.setattr(token_helpers, "decode_token_verified", lambda _token: claims)

    try:
        token_helpers.require_tenant_learner_context("token")
        assert False, "Expected HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 403
        assert "tenant users" in exc.detail


def test_require_tenant_learner_context_blocks_content_manager_role(monkeypatch):
    claims = _mock_claims(
        "https://keycloak:8080/realms/tenant-a",
        roles=["CONTENT_MANAGER"],
    )
    monkeypatch.setattr(token_helpers, "decode_token_verified", lambda _token: claims)

    try:
        token_helpers.require_tenant_learner_context("token")
        assert False, "Expected HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 403
        assert "learner users" in exc.detail


def test_require_tenant_learner_context_blocks_org_manager_role(monkeypatch):
    claims = _mock_claims(
        "https://keycloak:8080/realms/tenant-a",
        roles=["ORG_MANAGER"],
    )
    monkeypatch.setattr(token_helpers, "decode_token_verified", lambda _token: claims)

    try:
        token_helpers.require_tenant_learner_context("token")
        assert False, "Expected HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 403
        assert "learner users" in exc.detail


def test_require_tenant_learner_context_allows_tenant_learner(monkeypatch):
    claims = _mock_claims(
        "https://keycloak:8080/realms/tenant-a",
        roles=["DEFAULT_USER"],
        preferred_username="learner-1",
    )
    monkeypatch.setattr(token_helpers, "decode_token_verified", lambda _token: claims)

    user_id, tenant = token_helpers.require_tenant_learner_context("token")
    assert user_id == "learner-1"
    assert tenant == "tenant-a"
