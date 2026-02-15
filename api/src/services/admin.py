"""
Admin Service - Business logic for admin operations using Keycloak.
"""

import requests
import json
from pathlib import Path
from fastapi import HTTPException
import os
from dotenv import load_dotenv
from sqlmodel import Session, select

from src.models.realm import Realm
from src.models.user import User
from src.models.user_group import UserGroup
from src.services.keycloak_client import get_keycloak_client

load_dotenv()


def _load_realm_template() -> dict:
    """Load the realm template from the external JSON file."""
    template_path = Path(__file__).parent / "realm_template.json"
    with open(template_path, "r") as f:
        return json.load(f)


class Admin:
    def __init__(self):
        self.keycloak_url = os.getenv("KEYCLOAK_URL")
        self.admin_secret = os.getenv("CLIENT_SECRET")
        self.web_url = os.getenv("WEB_URL", "http://localhost:3000")
        self.api_url = os.getenv("API_URL", "http://localhost:8080")

        if not self.keycloak_url:
            raise HTTPException(
                status_code=500, detail="KEYCLOAK_URL environment variable is not set"
            )
        if not self.admin_secret:
            raise HTTPException(
                status_code=500, detail="CLIENT_SECRET environment variable is not set"
            )

    def _get_admin_token(self) -> str:
        """Get admin service account token."""
        return get_keycloak_client().get_admin_token()

    # ============ Event Operations ============

    def get_events(self, max_results: int = 100) -> list[dict]:
        """
        Fetch events from all tenant realms and the master realm.
        Combines admin events and login events.
        Master realm admin events capture realm creation/deletion.
        """
        token = self._get_admin_token()
        all_events = []

        # First, fetch admin events from master realm (realm creation, deletion, etc.)
        master_admin_url = f"{self.keycloak_url}/admin/realms/master/admin-events"
        try:
            r = requests.get(
                master_admin_url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                params={"max": max_results // 3},
            )
            if r.status_code == 200:
                events = r.json()
                for event in events:
                    resource_type = event.get("resourceType", "")
                    operation = event.get("operationType", "Unknown")

                    # Determine log level based on operation type
                    if operation in ("CREATE", "UPDATE"):
                        level = "info"
                    elif operation == "DELETE":
                        level = "warning"
                    else:
                        level = "info"

                    # Get realm name from resourcePath if available
                    resource_path = event.get("resourcePath", "")
                    resource_name = resource_path.split("/")[-1] if resource_path else ""

                    message = f"{resource_type} {operation}"
                    if resource_name:
                        message += f": {resource_name}"

                    all_events.append(
                        {
                            "id": event.get("id", f"master-admin-{event.get('time', 0)}"),
                            "timestamp": event.get("time"),
                            "level": level,
                            "message": message,
                            "source": "Admin - Master",
                            "user": event.get("authDetails", {}).get("username", "admin"),
                            "realm": "master",
                            "details": {
                                "resourceType": resource_type,
                                "resourcePath": resource_path,
                                "operationType": operation,
                            },
                        }
                    )
        except requests.exceptions.RequestException:
            pass

        tenant_realms = self.list_realms(exclude_system=True)

        for realm_info in tenant_realms:
            realm_name = realm_info.get("realm")
            if not realm_name:
                continue

            # Fetch admin events for this realm
            admin_events_url = (
                f"{self.keycloak_url}/admin/realms/{realm_name}/admin-events"
            )
            try:
                r = requests.get(
                    admin_events_url,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    params={"max": max_results // 3},
                )
                if r.status_code == 200:
                    events = r.json()
                    for event in events:
                        resource_type = event.get("resourceType", "")
                        operation = event.get("operationType", "Unknown")

                        if operation in ("CREATE", "UPDATE"):
                            level = "info"
                        elif operation == "DELETE":
                            level = "warning"
                        else:
                            level = "info"

                        resource_path = event.get("resourcePath", "")
                        resource_name = (
                            resource_path.split("/")[-1] if resource_path else ""
                        )

                        message = f"{resource_type} {operation}"
                        if resource_name:
                            message += f": {resource_name}"

                        all_events.append(
                            {
                                "id": event.get(
                                    "id", f"{realm_name}-admin-{event.get('time', 0)}"
                                ),
                                "timestamp": event.get("time"),
                                "level": level,
                                "message": message,
                                "source": f"Admin - {realm_name}",
                                "user": event.get("authDetails", {}).get(
                                    "username", "unknown"
                                ),
                                "realm": realm_name,
                                "details": {
                                    "resourceType": resource_type,
                                    "resourcePath": resource_path,
                                    "operationType": operation,
                                },
                            }
                        )
            except requests.exceptions.RequestException:
                pass

            login_events_url = f"{self.keycloak_url}/admin/realms/{realm_name}/events"
            try:
                r = requests.get(
                    login_events_url,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    params={"max": max_results // 3},
                )
                if r.status_code == 200:
                    events = r.json()
                    for event in events:
                        event_type = event.get("type", "UNKNOWN")

                        if event_type in ("LOGIN", "LOGOUT", "REGISTER"):
                            level = "info"
                        elif event_type.endswith("_ERROR"):
                            level = "error"
                        else:
                            level = "info"

                        all_events.append(
                            {
                                "id": event.get(
                                    "id", f"{realm_name}-auth-{event.get('time', 0)}"
                                ),
                                "timestamp": event.get("time"),
                                "level": level,
                                "message": event_type.replace("_", " ").title(),
                                "source": f"Auth - {realm_name}",
                                "user": event.get(
                                    "userId",
                                    event.get("details", {}).get("username", "Unknown"),
                                ),
                                "realm": realm_name,
                                "details": event.get("details", {}),
                            }
                        )
            except requests.exceptions.RequestException:
                pass

        # Sort by timestamp descending (most recent first)
        all_events.sort(key=lambda x: x.get("timestamp", 0), reverse=True)

        return all_events[:max_results]

    # ============ Realm Operations ============

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

    # ============ User Operations (delegating to KeycloakClient) ============

    def list_users(self, realm_name: str) -> list[dict]:
        """List users in a realm (basic fields only)."""
        token = self._get_admin_token()
        return get_keycloak_client().list_users(realm_name, token)

    def delete_user(self, session: Session, realm_name: str, user_id: str):
        """Delete a user from a realm."""
        token = self._get_admin_token()
        get_keycloak_client().delete_user(realm_name, token, user_id)
        session.delete(
            session.exec(select(User).where(User.keycloak_id == user_id)).one()
        )

    def get_user_realm_roles(self, realm_name: str, user_id: str) -> list[dict]:
        """Return realm roles assigned to the given user."""
        token = self._get_admin_token()
        return get_keycloak_client().get_user_realm_roles(realm_name, token, user_id)

    def assign_realm_role_to_user(self, realm_name: str, user_id: str, role_name: str):
        """Assign a realm role to a user."""
        token = self._get_admin_token()
        kc = get_keycloak_client()
        role_repr = kc.get_realm_role(realm_name, token, role_name)
        if role_repr:
            kc.assign_realm_roles(realm_name, token, user_id, [role_repr])

    def remove_realm_role_from_user(self, realm_name: str, user_id: str, role_name: str):
        """Remove a realm role from a user."""
        token = self._get_admin_token()
        kc = get_keycloak_client()
        role_repr = kc.get_realm_role(realm_name, token, role_name)
        if role_repr:
            kc.remove_realm_roles(realm_name, token, user_id, [role_repr])

    def add_user(
        self,
        session: Session,
        realm_name: str,
        username: str,
        password: str,
        full_name: str | None = None,
        email: str | None = None,
        role: str | None = None,
    ):
        token = self._get_admin_token()
        kc = get_keycloak_client()

        first_name = None
        last_name = None
        if full_name:
            # Simple split to populate Keycloak first/last name fields
            parts = full_name.strip().split(" ", 1)
            first_name = parts[0]
            if len(parts) > 1:
                last_name = parts[1]

        payload = {
            "username": username,
            "enabled": True,
            "email": email,
            "firstName": first_name,
            "lastName": last_name,
            "attributes": {"role": [role]} if role else {},
            "credentials": [
                {
                    "type": "password",
                    "value": password,
                    "temporary": True,  # force user to change it on first login
                }
            ],
        }

        # Remove empty attributes so Keycloak is not sent null values
        payload = {k: v for k, v in payload.items() if v not in (None, {}, [])}

        r = kc.create_user(realm_name, token, payload)

        # If session is provided and user was created, add to local DB
        if r.status_code in (201, 204) and session is not None:
            location = r.headers.get("Location")
            if location:
                user_id = location.rstrip("/").split("/")[-1]

                # Determine org manager flag from requested role
                is_org_manager = (role or "").strip().upper() == "ORG_MANAGER"

                # Ensure realm exists locally
                if realm_name and not session.get(Realm, realm_name):
                    session.add(Realm(name=realm_name, domain=f"{realm_name}.local"))

                existing = session.get(User, user_id)
                if existing:
                    existing.email = email or existing.email
                    existing.is_org_manager = is_org_manager
                else:
                    user = User(keycloak_id=user_id, email=email or "", is_org_manager=is_org_manager)
                    session.add(user)
                session.commit()

        return r

    # ============ Group Operations (delegating to KeycloakClient) ============

    def list_groups(self, realm_name: str) -> list[dict]:
        """List groups in a realm."""
        token = self._get_admin_token()
        return get_keycloak_client().list_groups(realm_name, token)

    def create_group(self, session: Session, realm_name: str, name: str):
        """Create a group in a realm."""
        token = self._get_admin_token()
        r = get_keycloak_client().create_group(realm_name, token, name)
        location = r.headers.get("Location")
        if location:
            group_id = location.split("/")[-1]
            group = UserGroup(keycloak_id=group_id)
            session.add(group)
            session.commit()
        return r

    def delete_group(self, session: Session, realm_name: str, group_id: str):
        """Delete a group from a realm."""
        token = self._get_admin_token()
        get_keycloak_client().delete_group(realm_name, token, group_id)
        session.delete(
            session.exec(
                select(UserGroup).where(UserGroup.keycloak_id == group_id)
            ).one()
        )
        session.commit()

    def update_group(self, realm_name: str, group_id: str, name: str):
        """Update a group's name."""
        token = self._get_admin_token()
        get_keycloak_client().update_group(realm_name, token, group_id, name)

    def add_user_to_group(self, realm_name: str, user_id: str, group_id: str):
        """Add a user to a group."""
        token = self._get_admin_token()
        get_keycloak_client().add_user_to_group(realm_name, token, user_id, group_id)

    def remove_user_from_group(self, realm_name: str, user_id: str, group_id: str):
        """Remove a user from a group."""
        token = self._get_admin_token()
        get_keycloak_client().remove_user_from_group(realm_name, token, user_id, group_id)

    def list_group_members(self, realm_name: str, group_id: str) -> list[dict]:
        """List members of a group."""
        token = self._get_admin_token()
        return get_keycloak_client().list_group_members(realm_name, token, group_id)

    # ============ Feature Flags ============

    def get_realm_features(self, realm_name: str) -> dict[str, bool]:
        """
        Get feature flags for a realm by reading the realm-feature-flags client scope.
        Returns a dict like {"phishing": True, "lms": False, "reports": True}.
        """
        token = self._get_admin_token()
        features: dict[str, bool] = {}

        # First, get all client scopes for the realm
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/client-scopes"
        try:
            r = requests.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            r.raise_for_status()
            scopes = r.json()

            # Find the realm-feature-flags scope
            feature_scope = None
            for scope in scopes:
                if scope.get("name") == "realm-feature-flags":
                    feature_scope = scope
                    break

            if not feature_scope:
                return features

            scope_id = feature_scope.get("id")
            if not scope_id:
                return features

            # Get the protocol mappers for this scope
            mappers_url = f"{self.keycloak_url}/admin/realms/{realm_name}/client-scopes/{scope_id}/protocol-mappers/models"
            r = requests.get(
                mappers_url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            r.raise_for_status()
            mappers = r.json()

            # Parse the hardcoded claim mappers to extract feature flags
            for mapper in mappers:
                if mapper.get("protocolMapper") == "oidc-hardcoded-claim-mapper":
                    config = mapper.get("config", {})
                    claim_name = config.get("claim.name", "")
                    claim_value = config.get("claim.value", "false")

                    # Extract feature name from claim name (e.g., "features.phishing" -> "phishing")
                    if claim_name.startswith("features."):
                        feature_name = claim_name.replace("features.", "")
                        features[feature_name] = claim_value.lower() == "true"

            return features
        except requests.exceptions.RequestException:
            return features

    def toggle_realm_feature(self, realm_name: str, feature_name: str, enabled: bool) -> bool:
        """Toggle a feature flag for a realm. Returns True if successful."""
        token = self._get_admin_token()

        # Get the realm-feature-flags scope
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/client-scopes"
        try:
            r = requests.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            r.raise_for_status()
            scopes = r.json()

            feature_scope = None
            for scope in scopes:
                if scope.get("name") == "realm-feature-flags":
                    feature_scope = scope
                    break

            if not feature_scope:
                # Create the scope if it doesn't exist
                scope_id = self._create_client_scope(realm_name, "realm-feature-flags", token)
                if not scope_id:
                    return False
            else:
                scope_id = feature_scope.get("id")

            if not scope_id:
                return False

            # Get existing mappers
            mappers_url = f"{self.keycloak_url}/admin/realms/{realm_name}/client-scopes/{scope_id}/protocol-mappers/models"
            r = requests.get(
                mappers_url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            r.raise_for_status()
            mappers = r.json()

            # Find existing mapper for this feature
            existing_mapper = None
            for mapper in mappers:
                config = mapper.get("config", {})
                if config.get("claim.name") == f"features.{feature_name}":
                    existing_mapper = mapper
                    break

            if existing_mapper:
                # Update existing mapper
                mapper_id = existing_mapper.get("id")
                update_url = f"{self.keycloak_url}/admin/realms/{realm_name}/client-scopes/{scope_id}/protocol-mappers/models/{mapper_id}"
                existing_mapper["config"]["claim.value"] = str(enabled).lower()
                r = requests.put(
                    update_url,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    json=existing_mapper,
                )
                return r.status_code in (204, 200)
            else:
                # Create new mapper
                self._add_hardcoded_claim_mapper(realm_name, scope_id, feature_name, enabled, token)
                return True

        except requests.exceptions.RequestException:
            return False

    def _create_client_scope(
        self, realm_name: str, scope_name: str, token: str
    ) -> str | None:
        """Create a client scope and return its ID."""
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/client-scopes"

        payload = {
            "name": scope_name,
            "description": f"Feature flags scope: {scope_name}",
            "protocol": "openid-connect",
            "attributes": {
                "include.in.token.scope": "true",
                "display.on.consent.screen": "false",
            },
        }

        try:
            r = requests.post(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if r.status_code == 201:
                # Get the scope ID from the Location header
                location = r.headers.get("Location", "")
                scope_id = location.split("/")[-1] if location else None
                return scope_id
            print(f"DEBUG: Failed to create client scope: {r.status_code} - {r.text}")
            return None
        except requests.exceptions.RequestException as e:
            print(f"DEBUG: Error creating client scope: {e}")
            return None

    def _add_hardcoded_claim_mapper(
        self,
        realm_name: str,
        scope_id: str,
        feature_name: str,
        feature_value: bool,
        token: str,
    ):
        """Add a hardcoded claim mapper to a client scope."""
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/client-scopes/{scope_id}/protocol-mappers/models"

        payload = {
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

        try:
            r = requests.post(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if r.status_code not in (201, 204):
                print(
                    f"DEBUG: Failed to add claim mapper for {feature_name}: {r.status_code} - {r.text}"
                )
        except requests.exceptions.RequestException as e:
            print(f"DEBUG: Error adding claim mapper for {feature_name}: {e}")

    def _add_client_scope_to_client(
        self, realm_name: str, client_id: str, scope_id: str, token: str
    ):
        """Add a client scope as a default scope to a client."""
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/clients/{client_id}/default-client-scopes/{scope_id}"

        try:
            r = requests.put(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            if r.status_code not in (204, 200):
                print(
                    f"DEBUG: Failed to add scope to client: {r.status_code} - {r.text}"
                )
        except requests.exceptions.RequestException as e:
            print(f"DEBUG: Error adding scope to client: {e}")

    def _get_clients(self, realm_name: str, token: str) -> list[dict]:
        """Get all clients in a realm."""
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/clients"
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
            return []

    # ============ Realm Creation ============

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


# Singleton instance
_admin: Admin | None = None


def get_admin() -> Admin:
    """Get the Admin instance."""
    global _admin
    if _admin is None:
        _admin = Admin()
    return _admin
