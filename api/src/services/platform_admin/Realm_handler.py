from fastapi import HTTPException
from sqlmodel import Session, select

from src.models.realm import Realm, RealmCreate
from src.models.user import User
from src.core.db import engine
from src.services.compliance import ensure_tenant_policy, ensure_tenant_quiz


class Realm_handler:

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
        response = self.admin.create_realm(
            session,
            realm_name=realm.name,
            admin_email=realm.adminEmail,
            domain=realm.domain,
            features=realm.features,
        )

        self._ensure_realm(session, realm.name, realm.domain)

        
        session.commit()

        ensure_tenant_policy(session, realm.name)
        ensure_tenant_quiz(session, realm.name)
   
        return realm


    def delete_realm_from_keycloak(self, realm_name: str, session: Session) -> None:
        """Delete a realm from Keycloak."""
        self.admin.delete_realm(session, realm_name)
        # Remove realm and related users locally
        kc_users = self.admin.list_users(realm_name)
        kc_ids = [u.get("id") for u in kc_users if u.get("id")]
      

        if kc_ids:
            for uid in kc_ids:
                user = session.get(User, uid)
                if user:
                    session.delete(user)
        db_realm = session.get(Realm, realm_name)
        if db_realm:
            session.delete(db_realm)
        session.commit()


    def get_realm_info(self, realm_name: str) -> dict | None:
        """Return realm metadata plus users for admin/management views."""

        realm = self.admin.get_realm(realm_name)
        if not realm:
            return None

        features = self.admin.get_realm_features(realm_name)
        domain = self.admin.get_domain_for_realm(realm_name)
        logo_updated_at = self._get_realm_attribute(realm_name, "tenant-logo-updated-at")

        users = self.list_users_in_realm(realm_name).get("users", [])
    

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
 
