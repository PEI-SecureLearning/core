from fastapi import HTTPException
from sqlmodel import Session, select

from src.models.realm import Realm, RealmCreate
from src.models.user import User
from src.core.db import engine
from src.services.compliance import ensure_tenant_policy, ensure_tenant_quiz


class realm_handler:

    def list_realms(self) -> dict:
        """List all tenant realms from Keycloak (excluding master and platform)."""
        realms = self.admin.list_realms(exclude_system=True)
        return {"realms": realms}


    def get_realm_by_domain(self, session: Session, domain: str) -> Realm | None:
        statement = select(Realm).where(Realm.domain == domain)
        return session.exec(statement).first()


    def find_realm_by_domain(self, domain: str) -> str | None:
        """Find realm name by domain using Keycloak admin API."""
        return self.admin.find_realm_by_domain(domain)


    def create_realm_in_keycloak(self, realm: RealmCreate, session: Session) -> RealmCreate:
        """Create a realm in Keycloak."""
        normalized_domain = (realm.domain or "").strip().lower()
        if not normalized_domain:
            raise HTTPException(status_code=400, detail="Domain is required.")

        existing_realm = self.find_realm_by_domain(normalized_domain)
        existing_local = self.get_realm_by_domain(session, normalized_domain)
        if existing_realm or existing_local:
            raise HTTPException(
                status_code=409,
                detail=f"Domain '{normalized_domain}' is already in use.",
            )

        _ = self.admin.create_realm(
            realm_name=realm.name,
            admin_email=realm.adminEmail,
            domain=normalized_domain,
            features=realm.features,
        )

        self._ensure_realm(session, realm.name, normalized_domain)

        
        session.commit()

        ensure_tenant_policy(session, realm.name)
        ensure_tenant_quiz(session, realm.name)
   
        return realm


    def delete_realm_from_keycloak(self, realm_name: str, session: Session) -> dict:
        """Delete a realm from Keycloak."""

        kc_users = self.admin.list_users(realm_name)
        kc_ids = [u.get("id") for u in kc_users if u.get("id")]

        response = self.admin.delete_realm(realm_name)

        if kc_ids:
            for uid in kc_ids:
                user = session.get(User, uid)
                if user:
                    session.delete(user)
                    
        db_realm = session.get(Realm, realm_name)
        if db_realm:
            session.delete(db_realm)
        session.commit()

        return response


    def get_realm_info(self, session: Session, realm_name: str) -> dict | None:
        """Return realm metadata plus users for admin/management views."""

        realm = self.admin.get_realm(realm_name)
        if not realm:
            return None

        features = self.admin.get_realm_features(realm_name)
        domain = self.admin.get_domain_for_realm(realm_name)
        logo_updated_at = self._get_realm_attribute(realm_name, "tenant-logo-updated-at")

        users = self.list_users_in_realm(session, realm_name).get("users", [])
    

        return {
            "realm": realm.get("realm") or realm_name,
            "displayName": realm.get("displayName") or realm_name,
            "enabled": realm.get("enabled", True),
            "domain": domain,
            "features": features,
            "logoUpdatedAt": logo_updated_at,
            "user_count": len(users),
            "users": users,
        }
 
