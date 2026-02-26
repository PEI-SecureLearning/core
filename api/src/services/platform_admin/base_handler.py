from fastapi import HTTPException
from sqlmodel import Session

from src.services.keycloak_admin import get_keycloak_admin
from src.services.compliance.token_helpers import decode_token_verified, get_realm_from_iss
from src.models.realm import Realm
from src.models.user import User


class base_handler:

    def __init__(self):
        self.admin = get_keycloak_admin()



    def validate_realm_access(self, token: str, realm: str) -> None:
        """Validate that the token's realm matches the requested realm."""
        token_realm = self._realm_from_token(token)
        if token_realm and token_realm != realm:
            raise HTTPException(
                status_code=403,
                detail="Realm mismatch: token realm does not match requested realm.",
            )


    def domain_from_token_or_realm(self, access_token: str) -> str | None:
        """Get tenant-domain from token or realm info."""
        realm_name = self._realm_from_token(access_token)
        if not realm_name:
            return None
        return self.admin.get_domain_for_realm(realm_name)


    def _realm_from_token(self, access_token: str) -> str | None:
        """Extract realm from token issuer after verifying signature via JWKS."""
        try:
            claims = decode_token_verified(access_token)
            return get_realm_from_iss(claims.get("iss"))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid access token.")


    def _ensure_realm(self, session: Session, realm_name: str, domain: str | None = None) -> None:
        if session.get(Realm, realm_name):
            return
        session.add(Realm(name=realm_name, domain=domain or f"{realm_name}.local"))
        session.commit()


    def _upsert_user(self, session: Session, keycloak_id: str, email: str | None, is_org_manager: bool = False) -> None:
        existing = session.get(User, keycloak_id)
        if existing:
            if email:
                existing.email = email
            existing.is_org_manager = is_org_manager
        else:
            session.add(User(keycloak_id=keycloak_id, email=email or "", is_org_manager=is_org_manager))


    def _get_realm_attribute(self, realm_name: str, key: str) -> str | None:
        realm_info = self.admin.get_realm(realm_name)
        attrs = realm_info.get("attributes") or {}
        if not isinstance(attrs, dict):
            return None
        raw = attrs.get(key)
        if isinstance(raw, list) and raw:
            return raw[0]
        if isinstance(raw, str):
            return raw
        return None
