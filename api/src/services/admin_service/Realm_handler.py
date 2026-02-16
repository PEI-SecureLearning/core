from fastapi import HTTPException
from sqlmodel import Session, select

from src.models.realm import Realm


class Realm_handler:

    def get_realm(self, realm_name: str) -> dict:
        
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}"
        r = self._make_request("GET", url, token)
        
        return r.json()


    def delete_realm(self, session: Session, realm_name: str) -> None:
        """Delete a realm from Keycloak."""

        if realm_name.lower() in ("master", "platform"):
            raise HTTPException(status_code=403, detail="Cannot delete system realms")

        token = self._get_admin_token()
        
        url = f"{self.keycloak_url}/admin/realms/{realm_name}"
        
        self._make_request("DELETE", url, token)

        session.exec(select(Realm).where(Realm.name == realm_name)).one()
        session.commit()


    def find_realm_by_domain(self, domain: str) -> str | None:
        """
        Find a realm that has the given domain stored in its attributes.
        This relies on realms created with create_realm storing tenant-domain.
        """
        token = self._get_admin_token()
        
        url = f"{self.keycloak_url}/admin/realms"
        
        r = self._make_request("GET", url, token)
        
        realms = r.json()
        
        
        for realm in realms:
            
            tenant_domain = self.extract_tenant_domain(realm)
           
            if tenant_domain and tenant_domain.lower() == domain.lower():
                return realm.get("realm")
        
        return None


    def list_realms(self, exclude_system: bool = True) -> list[dict]:
        """
        List all realms from Keycloak.
        If exclude_system is True, excludes 'master' and 'platform' realms.
        """
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms"
        r = self._make_request("GET", url, token)
        realms = r.json()

        result = []
        for realm in realms:
            realm_name = realm.get("realm", "")
            if exclude_system and realm_name.lower() in ("master", "platform"):
                continue

            tenant_domain = self.extract_tenant_domain(realm)

            # Fetch feature flags for this realm
            features = self.get_realm_features(realm_name)

            result.append(
                {
                    "id": realm.get("id"),
                    "realm": realm_name,
                    "displayName": realm.get("displayName") or realm_name,
                    "domain": tenant_domain,
                    "enabled": realm.get("enabled", True),
                    "features": features,
                }
            )
        return result

    def get_domain_for_realm(self, realm_name: str) -> str | None:
        """Return the tenant-domain attribute for a given realm, if set."""
        realm_info = self.get_realm(realm_name)

        return self.extract_tenant_domain(realm_info)


    def update_realm_attributes(self, realm_name: str, new_attributes: dict) -> None:
        """Merge new_attributes into the existing realm attributes."""
        token = self._get_admin_token()
        realm_info = self.get_realm(realm_name)
        attrs = realm_info.get("attributes") or {}
        if not isinstance(attrs, dict):
            attrs = {}
        attrs.update(new_attributes)

        url = f"{self.keycloak_url}/admin/realms/{realm_name}"
        self._make_request("PUT", url, token, json={"attributes": attrs})


    def extract_tenant_domain(self, realm_info: dict) -> str | None:
        """Return the tenant-domain attribute for a given realm, if set."""
        attrs = realm_info.get("attributes") or {}
        
        if not isinstance(attrs, dict):
            return None
        
        raw = attrs.get("tenant-domain")
        
        if isinstance(raw, list) and raw:
            return raw[0]
        
        if isinstance(raw, str):
            return raw
        
        return None


    def create_realm(
        self,
        session: Session,
        realm_name: str,
        admin_email: str,
        domain: str,
        features: dict | None = None,
    ):
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms"

        template = self._load_realm_template(
            web_url=self.web_url,
            api_url=self.api_url,
            admin_email=admin_email,
        )

        client_scopes = list(template["client_scopes"]) 
        default_default_client_scopes = list(template["default_default_client_scopes"])

        if features:
            mappers = []
            for feature_name, feature_value in features.items():
                if isinstance(feature_value, bool):
                    mappers.append(
                        {
                            "name": f"feature-{feature_name}",
                            "protocol": "openid-connect",
                            "protocolMapper": "oidc-hardcoded-claim-mapper",
                            "consentRequired": False,
                            "config": {
                                "claim.name": f"features.{feature_name}",
                                "claim.value": str(feature_value).lower(),
                                "jsonType.label": "boolean",
                                "id.token.claim": "true",
                                "access.token.claim": "true",
                                "userinfo.token.claim": "true",
                            },
                        }
                    )

            if mappers:
                scope_name = "realm-feature-flags"
                client_scopes.append(
                    {
                        "name": scope_name,
                        "description": "Feature flags for the realm",
                        "protocol": "openid-connect",
                        "attributes": {
                            "include.in.token.scope": "true",
                            "display.on.consent.screen": "false",
                        },
                        "protocolMappers": mappers,
                    }
                )
                default_default_client_scopes.append(scope_name)

        payload = {
            "realm": realm_name,
            "enabled": True,
            "sslRequired": "NONE",
            "loginTheme": "keycloakify-starter",
            "displayName": realm_name,
            "clientScopes": client_scopes,
            "defaultDefaultClientScopes": default_default_client_scopes,
            "attributes": {"tenant-domain": domain},
            "eventsEnabled": True,
            "eventsListeners": ["jboss-logging"],
            "enabledEventTypes": template["enabled_event_types"],
            "eventsExpiration": 604800,
            "adminEventsEnabled": True,
            "adminEventsDetailsEnabled": True,
            "roles": {"realm": template["realm_roles"]},
            "clients": template["clients"],
            "users": template["users"],
        }

        r = self._make_request("POST", url, token, json=payload)


        return r