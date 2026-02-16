import requests
from fastapi import HTTPException
from sqlmodel import Session, select

from src.models.realm import Realm
from src.services.admin_service.Base_handler import _load_realm_template


class Realm_handler:

    def get_realm(self, realm_name: str) -> dict:
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}"
        try:
            r = requests.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            r.raise_for_status()
            return r.json()
        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve realm information from Keycloak",
            )


    def delete_realm(self, session: Session, realm_name: str) -> None:
        """Delete a realm from Keycloak."""
        # Prevent deletion of system realms
        if realm_name.lower() in ("master", "platform"):
            raise HTTPException(status_code=403, detail="Cannot delete system realms")

        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}"
        try:
            r = requests.delete(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )

            session.exec(select(Realm).where(Realm.name == realm_name)).one()
            session.commit()

            if r.status_code == 404:
                raise HTTPException(status_code=404, detail="Realm not found")
            r.raise_for_status()
        except requests.exceptions.RequestException as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=500, detail="Failed to delete realm from Keycloak"
            )

    def find_realm_by_domain(self, domain: str) -> str | None:
        """
        Find a realm that has the given domain stored in its attributes.
        This relies on realms created with create_realm storing tenant-domain.
        """
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms"
        try:
            r = requests.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            r.raise_for_status()
            realms = r.json()
            for realm in realms:
                attrs = realm.get("attributes") or {}
                tenant_domain = None
                if isinstance(attrs, dict):
                    raw = attrs.get("tenant-domain")
                    if isinstance(raw, list) and raw:
                        tenant_domain = raw[0]
                    elif isinstance(raw, str):
                        tenant_domain = raw
                if tenant_domain and tenant_domain.lower() == domain.lower():
                    return realm.get("realm")
        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=500, detail="Failed to retrieve realms from Keycloak"
            )
        return None

    def list_realms(self, exclude_system: bool = True) -> list[dict]:
        """
        List all realms from Keycloak.
        If exclude_system is True, excludes 'master' and 'platform' realms.
        """
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms"
        try:
            r = requests.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            r.raise_for_status()
            realms = r.json()

            result = []
            for realm in realms:
                realm_name = realm.get("realm", "")
                if exclude_system and realm_name.lower() in ("master", "platform"):
                    continue

                attrs = realm.get("attributes") or {}
                tenant_domain = None
                if isinstance(attrs, dict):
                    raw = attrs.get("tenant-domain")
                    if isinstance(raw, list) and raw:
                        tenant_domain = raw[0]
                    elif isinstance(raw, str):
                        tenant_domain = raw

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
        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=500, detail="Failed to retrieve realms from Keycloak"
            )

    def get_domain_for_realm(self, realm_name: str) -> str | None:
        """Return the tenant-domain attribute for a given realm, if set."""
        realm_info = self.get_realm(realm_name)
        attrs = realm_info.get("attributes") or {}
        if not isinstance(attrs, dict):
            return None
        raw = attrs.get("tenant-domain")
        if isinstance(raw, list) and raw:
            return raw[0]
        if isinstance(raw, str):
            return raw
        return None

    def update_realm_attributes(self, realm_name: str, new_attributes: dict) -> None:
        """Merge new_attributes into the existing realm attributes."""
        token = self._get_admin_token()
        realm_info = self.get_realm(realm_name)
        attrs = realm_info.get("attributes") or {}
        if not isinstance(attrs, dict):
            attrs = {}
        attrs.update(new_attributes)

        url = f"{self.keycloak_url}/admin/realms/{realm_name}"
        try:
            r = requests.put(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={"attributes": attrs},
            )
            r.raise_for_status()
        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=500, detail="Failed to update realm attributes in Keycloak"
            )

    def create_realm(
        self,
        session: Session,
        realm_name: str,
        admin_email: str,
        domain: str,
        features: dict | None = None,
    ):
        print(
            f"DEBUG: Creating realm '{realm_name}' for admin '{admin_email}' with domain '{domain}'"
        )
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms"

        # Load realm template from external JSON file
        template = _load_realm_template()
        client_scopes = list(template["client_scopes"])  # Make a copy to avoid mutating
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

        attributes = {
            "tenant-domain": domain,
        }

        payload = {
            "realm": realm_name,
            "enabled": True,
            "sslRequired": "NONE",
            "loginTheme": "keycloakify-starter",
            "displayName": realm_name,
            "clientScopes": client_scopes,
            "defaultDefaultClientScopes": default_default_client_scopes,
            "attributes": attributes,
            # Enable event logging
            "eventsEnabled": True,
            "eventsListeners": ["jboss-logging"],
            "enabledEventTypes": template["enabled_event_types"],
            "eventsExpiration": 604800,  # 7 days in seconds
            "adminEventsEnabled": True,
            "adminEventsDetailsEnabled": True,
            "roles": {
                "realm": template["realm_roles"]
            },
            "clients": [
                {
                    "clientId": "react-app",
                    "enabled": True,
                    "publicClient": True,
                    "redirectUris": [f"{self.web_url}/*"],
                    "webOrigins": [self.web_url],
                    "standardFlowEnabled": True,
                    "directAccessGrantsEnabled": True,
                    "protocolMappers": [
                        {
                            "name": "api-audience",
                            "protocol": "openid-connect",
                            "protocolMapper": "oidc-audience-mapper",
                            "consentRequired": False,
                            "config": {
                                "included.client.audience": "api",
                                "id.token.claim": "false",
                                "access.token.claim": "true",
                                "introspection.token.claim": "true",
                            },
                        }
                    ],
                },
                {
                    "clientId": "api",
                    "enabled": True,
                    "publicClient": False,
                    "redirectUris": [f"{self.api_url}/*"],
                    "webOrigins": [self.api_url],
                    "implicitFlowEnabled": False,
                    "directAccessGrantsEnabled": True,
                    "serviceAccountsEnabled": True,
                    "authorizationServicesEnabled": True,
                    "authorizationSettings": {
                        "allowRemoteResourceManagement": True,
                        "policyEnforcementMode": "ENFORCING",
                        "resources": [
                            {
                                "name": "org_manager",
                                "type": "urn:api:resources:org_manager",
                                "ownerManagedAccess": False,
                                "displayName": "Organization Manager Resource",
                                "attributes": {},
                                "uris": ["/api/org-manager/*"],
                                "scopes": [{"name": "view"}, {"name": "manage"}],
                            }
                        ],
                        "policies": [
                            {
                                "name": "ORG_MANAGER Role Policy",
                                "description": "Policy that grants access to users with ORG_MANAGER role",
                                "type": "role",
                                "logic": "POSITIVE",
                                "decisionStrategy": "UNANIMOUS",
                                "config": {
                                    "roles": '[{"id":"ORG_MANAGER","required":false}]'
                                },
                            },
                            {
                                "name": "org_manager Permission",
                                "description": "Permission for org_manager resource",
                                "type": "resource",
                                "logic": "POSITIVE",
                                "decisionStrategy": "UNANIMOUS",
                                "config": {
                                    "resources": '["org_manager"]',
                                    "applyPolicies": '["ORG_MANAGER Role Policy"]',
                                },
                            },
                        ],
                        "scopes": [{"name": "view"}, {"name": "manage"}],
                    },
                },
            ],
            "users": [
                {
                    "username": "Org_manager",
                    "enabled": True,
                    "firstName": "Org",
                    "lastName": "Manager",
                    "email": admin_email,
                    "credentials": [
                        {"type": "password", "value": "1234", "temporary": True}
                    ],
                    "realmRoles": ["ORG_MANAGER"],
                    "clientRoles": {"realm-management": ["realm-admin"]},
                },
            ],
        }

        r = requests.post(
            url,
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer {}".format(token),
            },
            json=payload,
        )

        print(f"DEBUG: Keycloak create realm response: {r.status_code} - {r.text}")

        return r