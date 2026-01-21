import requests
import json
from urllib.parse import quote
from fastapi import HTTPException
import os
from dotenv import load_dotenv
from sqlmodel import Session, select

from src.models.realm import Realm
from src.models.user import User
from src.models.user_group import UserGroup

load_dotenv()


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

    def _get_admin_token(self):
        url = f"{self.keycloak_url}/realms/master/protocol/openid-connect/token"

        data = {
            "grant_type": "client_credentials",
            "client_id": "SecureLearning-admin",
            "client_secret": self.admin_secret,
        }

        try:
            response = requests.post(
                url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()

            token_data = response.json()
            access_token = token_data.get("access_token")

        except requests.exceptions.RequestException as e:
            raise HTTPException(
                status_code=500, detail="Failed to retrieve admin token"
            )
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=500, detail="Failed to decode admin token response"
            )

        return access_token

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
                    level = "info"
                    if operation == "CREATE":
                        level = "success"
                    elif operation == "DELETE":
                        level = "warning"
                    elif "ERROR" in operation:
                        level = "error"

                    # Extract realm name from resourcePath if available
                    resource_path = event.get("resourcePath", "")

                    all_events.append(
                        {
                            "id": event.get("id", f"master-{event.get('time', '')}"),
                            "timestamp": event.get("time"),
                            "level": level,
                            "message": f"{operation} on {resource_type}"
                            + (f" ({resource_path})" if resource_path else ""),
                            "source": "Platform Admin",
                            "user": event.get("authDetails", {}).get(
                                "username", "System"
                            ),
                            "realm": "master",
                            "details": event.get("representation", ""),
                        }
                    )
        except requests.exceptions.RequestException:
            pass

        # Get all tenant realms
        realms = self.list_realms(exclude_system=True)

        for realm_info in realms:
            realm_name = realm_info.get("realm")
            if not realm_name:
                continue

            # Fetch admin events (user creation, role changes, etc.)
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
                        all_events.append(
                            {
                                "id": event.get(
                                    "id", f"{realm_name}-{event.get('time', '')}"
                                ),
                                "timestamp": event.get("time"),
                                "level": "info",
                                "message": f"{event.get('operationType', 'Unknown')} on {event.get('resourceType', 'resource')}",
                                "source": f"Admin - {realm_name}",
                                "user": event.get("authDetails", {}).get(
                                    "username", "System"
                                ),
                                "realm": realm_name,
                                "details": event.get("representation", ""),
                            }
                        )
            except requests.exceptions.RequestException:
                pass

            # Fetch login events (logins, logouts, failed logins, etc.)
            events_url = f"{self.keycloak_url}/admin/realms/{realm_name}/events"
            try:
                r = requests.get(
                    events_url,
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
                        level = "info"
                        if "ERROR" in event_type or "FAILURE" in event_type:
                            level = "error"
                        elif "LOGOUT" in event_type:
                            level = "warning"
                        elif "LOGIN" in event_type:
                            level = "success"

                        all_events.append(
                            {
                                "id": event.get(
                                    "id", f"{realm_name}-{event.get('time', '')}-login"
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
        # TODO change to use database realms

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

    def _extract_realm_attributes(self, realm: dict) -> tuple[str | None, str | None]:
        attrs = realm.get("attributes") or {}
        if not isinstance(attrs, dict):
            return None, None
        tenant_domain = None
        tenant_logo_updated_at = None
        raw_domain = attrs.get("tenant-domain")
        if isinstance(raw_domain, list) and raw_domain:
            tenant_domain = raw_domain[0]
        elif isinstance(raw_domain, str):
            tenant_domain = raw_domain
        raw_logo_updated_at = attrs.get("tenant-logo-updated-at")
        if isinstance(raw_logo_updated_at, list) and raw_logo_updated_at:
            tenant_logo_updated_at = raw_logo_updated_at[0]
        elif isinstance(raw_logo_updated_at, str):
            tenant_logo_updated_at = raw_logo_updated_at
        return tenant_domain, tenant_logo_updated_at

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

                tenant_domain, tenant_logo_updated_at = self._extract_realm_attributes(
                    realm
                )
                features = self.get_realm_features(realm_name)

                result.append(
                    {
                        "id": realm.get("id"),
                        "realm": realm_name,
                        "displayName": realm.get("displayName") or realm_name,
                        "domain": tenant_domain,
                        "enabled": realm.get("enabled", True),
                        "features": features,
                        "logoUpdatedAt": tenant_logo_updated_at,
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

    def update_realm_attributes(self, realm_name: str, attributes: dict[str, str]) -> None:
        """Update realm attributes, preserving existing configuration."""
        token = self._get_admin_token()
        realm_info = self.get_realm(realm_name)
        if not realm_info:
            raise HTTPException(status_code=404, detail="Realm not found")

        existing_attrs = realm_info.get("attributes") or {}
        if not isinstance(existing_attrs, dict):
            existing_attrs = {}
        merged_attrs = {**existing_attrs, **attributes}
        realm_info["attributes"] = merged_attrs

        encoded_realm = quote(realm_name, safe="")
        url = f"{self.keycloak_url}/admin/realms/{encoded_realm}"
        try:
            r = requests.put(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=realm_info,
            )
            if r.status_code not in (204, 200):
                r.raise_for_status()
        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=500, detail="Failed to update realm attributes in Keycloak"
            )

    def get_user_realm_roles(self, realm_name: str, user_id: str) -> list[dict]:
        """Return realm roles assigned to the given user."""
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/users/{user_id}/role-mappings/realm"
        try:
            r = requests.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            if r.status_code == 404:
                return []
            r.raise_for_status()
            return r.json() or []
        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=500, detail="Failed to retrieve user roles from Keycloak"
            )
        
    def assign_realm_role_to_user(self, realm_name: str, user_id: str, role_name: str):
        """Assign a realm role to a user."""
        token = self._get_admin_token()
        # First, get the role representation
        role_url = f"{self.keycloak_url}/admin/realms/{realm_name}/roles/{role_name}"
        try:
            r = requests.get(
                role_url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            r.raise_for_status()
            role_representation = r.json()

            # Now, assign the role to the user
            assign_url = f"{self.keycloak_url}/admin/realms/{realm_name}/users/{user_id}/role-mappings/realm"
            r = requests.post(
                assign_url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=[role_representation],
            )
            if r.status_code not in (204, 201):
                r.raise_for_status()
        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=500, detail="Failed to assign role to user in Keycloak"
            )
        
    def remove_realm_role_from_user(self, realm_name: str, user_id: str, role_name: str):
        """Remove a realm role from a user."""
        token = self._get_admin_token()
        # First, get the role representation
        role_url = f"{self.keycloak_url}/admin/realms/{realm_name}/roles/{role_name}"
        try:
            r = requests.get(
                role_url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            r.raise_for_status()
            role_representation = r.json()

            # Now, remove the role from the user
            remove_url = f"{self.keycloak_url}/admin/realms/{realm_name}/users/{user_id}/role-mappings/realm"
            r = requests.delete(
                remove_url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=[role_representation],
            )
            if r.status_code not in (204, 200):
                r.raise_for_status()
        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=500, detail="Failed to remove role from user in Keycloak"
            )

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
                    mapper_name = mapper.get("name", "")
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

    def list_users(self, realm_name: str) -> list[dict]:
        """List users in a realm (basic fields only)."""
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/users"
        try:
            r = requests.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                params={"briefRepresentation": "false"},
            )
            r.raise_for_status()
            return r.json()
        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=500, detail="Failed to list users from Keycloak"
            )

    def delete_user(self, session: Session, realm_name: str, user_id: str):
        """Delete a user from a realm."""
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/users/{user_id}"
        try:
            r = requests.delete(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            if r.status_code not in (204, 200):
                r.raise_for_status()

            session.delete(
                session.exec(select(User).where(User.keycloak_id == user_id)).one()
            )

        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=500, detail="Failed to delete user in Keycloak"
            )

    def list_groups(self, realm_name: str) -> list[dict]:
        """List groups in a realm."""
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/groups"
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
                status_code=500, detail="Failed to list groups from Keycloak"
            )

    def create_group(self, session: Session, realm_name: str, name: str):
        """Create a group in a realm."""
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/groups"
        try:
            r = requests.post(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={"name": name},
            )
            r.raise_for_status()
            location = r.headers.get("Location")
            if location:
                # A string é tipo ".../groups/b624123-..."
                # Partimos a string e ficamos com a última fatia (o ID)
                group_id = location.split("/")[-1]
                group = UserGroup(keycloak_id=group_id)
                session.add(group)
                session.commit()
            return r
        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=500, detail="Failed to create group in Keycloak"
            )

    def delete_group(self, session: Session, realm_name: str, group_id: str):
        """Delete a group from a realm."""
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/groups/{group_id}"
        try:
            r = requests.delete(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            if r.status_code not in (204, 200):
                r.raise_for_status()
            session.delete(
                session.exec(
                    select(UserGroup).where(UserGroup.keycloak_id == group_id)
                ).one()
            )
            session.commit()
        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=500, detail="Failed to delete group in Keycloak"
            )

    def update_group(self, realm_name: str, group_id: str, name: str):
        """Update a group's name."""
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/groups/{group_id}"
        try:
            r = requests.put(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={"name": name},
            )
            if r.status_code not in (204, 200):
                r.raise_for_status()
        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=500, detail="Failed to update group in Keycloak"
            )

    def add_user_to_group(self, realm_name: str, user_id: str, group_id: str):
        """Add a user to a group."""
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/users/{user_id}/groups/{group_id}"
        try:
            r = requests.put(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            if r.status_code not in (204, 201):
                r.raise_for_status()
        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=500, detail="Failed to add user to group in Keycloak"
            )

    def remove_user_from_group(self, realm_name: str, user_id: str, group_id: str):
        """Remove a user from a group."""
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/users/{user_id}/groups/{group_id}"
        try:
            r = requests.delete(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            if r.status_code not in (204, 200):
                r.raise_for_status()
        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=500, detail="Failed to remove user from group in Keycloak"
            )

    def list_group_members(self, realm_name: str, group_id: str) -> list[dict]:
        """List members of a group."""
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/groups/{group_id}/members"
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
                status_code=500, detail="Failed to list group members from Keycloak"
            )

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
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/users"

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

        r = requests.post(
            url,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
            },
            json=payload,
        )

        # If session is provided and user was created, add to local DB
        if r.status_code in (201, 204) and session is not None:
            location = r.headers.get("Location")
            if location:
                user_id = location.rstrip("/").split("/")[-1]
                from src.models.user import User
                from src.models.realm import Realm

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

        # Prepare client scopes and default scopes
        client_scopes = [
            {
                "name": "acr",
                "description": "OpenID Connect scope for add acr (authentication context class reference) to the token",
                "protocol": "openid-connect",
                "attributes": {
                    "include.in.token.scope": "false",
                    "display.on.consent.screen": "false",
                },
                "protocolMappers": [
                    {
                        "name": "acr loa level",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-acr-mapper",
                        "consentRequired": False,
                        "config": {
                            "id.token.claim": "true",
                            "introspection.token.claim": "true",
                            "access.token.claim": "true",
                            "userinfo.token.claim": "true",
                        },
                    }
                ],
            },
            {
                "name": "address",
                "description": "OpenID Connect built-in scope: address",
                "protocol": "openid-connect",
                "attributes": {
                    "include.in.token.scope": "true",
                    "display.on.consent.screen": "true",
                    "consent.screen.text": "${addressScopeConsentText}",
                },
                "protocolMappers": [
                    {
                        "name": "address",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-address-mapper",
                        "consentRequired": False,
                        "config": {
                            "user.attribute.formatted": "formatted",
                            "user.attribute.country": "country",
                            "user.attribute.postal_code": "postal_code",
                            "userinfo.token.claim": "true",
                            "user.attribute.street": "street",
                            "id.token.claim": "true",
                            "user.attribute.region": "region",
                            "access.token.claim": "true",
                            "user.attribute.locality": "locality",
                        },
                    }
                ],
            },
            {
                "name": "basic",
                "description": "OpenID Connect scope for add all basic claims to the token",
                "protocol": "openid-connect",
                "attributes": {
                    "include.in.token.scope": "false",
                    "display.on.consent.screen": "false",
                },
                "protocolMappers": [
                    {
                        "name": "sub",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-sub-mapper",
                        "consentRequired": False,
                        "config": {
                            "introspection.token.claim": "true",
                            "access.token.claim": "true",
                        },
                    },
                    {
                        "name": "auth_time",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-usersessionmodel-note-mapper",
                        "consentRequired": False,
                        "config": {
                            "user.session.note": "AUTH_TIME",
                            "introspection.token.claim": "true",
                            "userinfo.token.claim": "true",
                            "id.token.claim": "true",
                            "access.token.claim": "true",
                            "claim.name": "auth_time",
                            "jsonType.label": "long",
                        },
                    },
                    {
                        "name": "session id",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-usersessionmodel-note-mapper",
                        "consentRequired": False,
                        "config": {
                            "user.session.note": "nosession",
                            "introspection.token.claim": "true",
                            "id.token.claim": "true",
                            "access.token.claim": "true",
                            "claim.name": "sid",
                            "jsonType.label": "String",
                        },
                    },
                ],
            },
            {
                "name": "email",
                "description": "OpenID Connect built-in scope: email",
                "protocol": "openid-connect",
                "attributes": {
                    "include.in.token.scope": "true",
                    "display.on.consent.screen": "true",
                    "consent.screen.text": "${emailScopeConsentText}",
                },
                "protocolMappers": [
                    {
                        "name": "email",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-usermodel-property-mapper",
                        "consentRequired": False,
                        "config": {
                            "user.attribute": "email",
                            "introspection.token.claim": "true",
                            "userinfo.token.claim": "true",
                            "id.token.claim": "true",
                            "access.token.claim": "true",
                            "claim.name": "email",
                            "jsonType.label": "String",
                        },
                    },
                    {
                        "name": "email verified",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-usermodel-property-mapper",
                        "consentRequired": False,
                        "config": {
                            "user.attribute": "emailVerified",
                            "introspection.token.claim": "true",
                            "userinfo.token.claim": "true",
                            "id.token.claim": "true",
                            "access.token.claim": "true",
                            "claim.name": "email_verified",
                            "jsonType.label": "boolean",
                        },
                    },
                ],
            },
            {
                "name": "microprofile-jwt",
                "description": "Microprofile - JWT built-in scope",
                "protocol": "openid-connect",
                "attributes": {
                    "include.in.token.scope": "true",
                    "display.on.consent.screen": "false",
                },
                "protocolMappers": [
                    {
                        "name": "groups",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-usermodel-realm-role-mapper",
                        "consentRequired": False,
                        "config": {
                            "introspection.token.claim": "true",
                            "multivalued": "true",
                            "userinfo.token.claim": "true",
                            "user.attribute": "foo",
                            "id.token.claim": "true",
                            "access.token.claim": "true",
                            "claim.name": "groups",
                            "jsonType.label": "String",
                        },
                    },
                    {
                        "name": "upn",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-usermodel-attribute-mapper",
                        "consentRequired": False,
                        "config": {
                            "introspection.token.claim": "true",
                            "userinfo.token.claim": "true",
                            "user.attribute": "username",
                            "id.token.claim": "true",
                            "access.token.claim": "true",
                            "claim.name": "upn",
                            "jsonType.label": "String",
                        },
                    },
                ],
            },
            {
                "name": "offline_access",
                "description": "OpenID Connect built-in scope: offline_access",
                "protocol": "openid-connect",
                "attributes": {
                    "include.in.token.scope": "false",
                    "display.on.consent.screen": "true",
                    "consent.screen.text": "${offlineAccessScopeConsentText}",
                },
            },
            {
                "name": "organization",
                "description": "Additional claims about the organization a subject belongs to",
                "protocol": "openid-connect",
                "attributes": {
                    "include.in.token.scope": "true",
                    "display.on.consent.screen": "false",
                },
                "protocolMappers": [
                    {
                        "name": "organization",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-organization-membership-mapper",
                        "consentRequired": False,
                        "config": {
                            "introspection.token.claim": "true",
                            "multivalued": "true",
                            "userinfo.token.claim": "true",
                            "id.token.claim": "true",
                            "access.token.claim": "true",
                            "claim.name": "organization",
                            "jsonType.label": "String",
                        },
                    }
                ],
            },
            {
                "name": "phone",
                "description": "OpenID Connect built-in scope: phone",
                "protocol": "openid-connect",
                "attributes": {
                    "include.in.token.scope": "true",
                    "display.on.consent.screen": "true",
                    "consent.screen.text": "${phoneScopeConsentText}",
                },
                "protocolMappers": [
                    {
                        "name": "phone number",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-usermodel-attribute-mapper",
                        "consentRequired": False,
                        "config": {
                            "introspection.token.claim": "true",
                            "userinfo.token.claim": "true",
                            "user.attribute": "phoneNumber",
                            "id.token.claim": "true",
                            "access.token.claim": "true",
                            "claim.name": "phone_number",
                            "jsonType.label": "String",
                        },
                    },
                    {
                        "name": "phone number verified",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-usermodel-attribute-mapper",
                        "consentRequired": False,
                        "config": {
                            "introspection.token.claim": "true",
                            "userinfo.token.claim": "true",
                            "user.attribute": "phoneNumberVerified",
                            "id.token.claim": "true",
                            "access.token.claim": "true",
                            "claim.name": "phone_number_verified",
                            "jsonType.label": "boolean",
                        },
                    },
                ],
            },
            {
                "name": "profile",
                "description": "OpenID Connect built-in scope: profile",
                "protocol": "openid-connect",
                "attributes": {
                    "include.in.token.scope": "true",
                    "display.on.consent.screen": "true",
                    "consent.screen.text": "${profileScopeConsentText}",
                },
                "protocolMappers": [
                    {
                        "name": "full name",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-full-name-mapper",
                        "consentRequired": False,
                        "config": {
                            "id.token.claim": "true",
                            "introspection.token.claim": "true",
                            "access.token.claim": "true",
                            "userinfo.token.claim": "true",
                        },
                    },
                    {
                        "name": "username",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-usermodel-attribute-mapper",
                        "consentRequired": False,
                        "config": {
                            "introspection.token.claim": "true",
                            "userinfo.token.claim": "true",
                            "user.attribute": "username",
                            "id.token.claim": "true",
                            "access.token.claim": "true",
                            "claim.name": "preferred_username",
                            "jsonType.label": "String",
                        },
                    },
                    {
                        "name": "email",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-usermodel-property-mapper",
                        "consentRequired": False,
                        "config": {
                            "user.attribute": "email",
                            "introspection.token.claim": "true",
                            "userinfo.token.claim": "true",
                            "id.token.claim": "true",
                            "access.token.claim": "true",
                            "claim.name": "email",
                            "jsonType.label": "String",
                        },
                    },
                    {
                        "name": "given name",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-usermodel-attribute-mapper",
                        "consentRequired": False,
                        "config": {
                            "introspection.token.claim": "true",
                            "userinfo.token.claim": "true",
                            "user.attribute": "firstName",
                            "id.token.claim": "true",
                            "access.token.claim": "true",
                            "claim.name": "given_name",
                            "jsonType.label": "String",
                        },
                    },
                    {
                        "name": "family name",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-usermodel-attribute-mapper",
                        "consentRequired": False,
                        "config": {
                            "introspection.token.claim": "true",
                            "userinfo.token.claim": "true",
                            "user.attribute": "lastName",
                            "id.token.claim": "true",
                            "access.token.claim": "true",
                            "claim.name": "family_name",
                            "jsonType.label": "String",
                        },
                    },
                ],
            },
            {
                "name": "role_list",
                "description": "SAML role list",
                "protocol": "saml",
                "attributes": {
                    "consent.screen.text": "${samlRoleListScopeConsentText}",
                    "display.on.consent.screen": "true",
                },
                "protocolMappers": [
                    {
                        "name": "role list",
                        "protocol": "saml",
                        "protocolMapper": "saml-role-list-mapper",
                        "consentRequired": False,
                        "config": {
                            "single": "false",
                            "attribute.nameformat": "Basic",
                            "attribute.name": "Role",
                        },
                    }
                ],
            },
            {
                "name": "roles",
                "description": "OpenID Connect scope for add user roles to the access token",
                "protocol": "openid-connect",
                "attributes": {
                    "include.in.token.scope": "false",
                    "consent.screen.text": "${rolesScopeConsentText}",
                    "display.on.consent.screen": "true",
                },
                "protocolMappers": [
                    {
                        "name": "client roles",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-usermodel-client-role-mapper",
                        "consentRequired": False,
                        "config": {
                            "user.attribute": "foo",
                            "introspection.token.claim": "true",
                            "access.token.claim": "true",
                            "claim.name": "resource_access.${client_id}.roles",
                            "jsonType.label": "String",
                            "multivalued": "true",
                        },
                    },
                    {
                        "name": "realm roles",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-usermodel-realm-role-mapper",
                        "consentRequired": False,
                        "config": {
                            "user.attribute": "foo",
                            "introspection.token.claim": "true",
                            "access.token.claim": "true",
                            "claim.name": "realm_access.roles",
                            "jsonType.label": "String",
                            "multivalued": "true",
                        },
                    },
                    {
                        "name": "audience resolve",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-audience-resolve-mapper",
                        "consentRequired": False,
                        "config": {
                            "introspection.token.claim": "true",
                            "access.token.claim": "true",
                        },
                    },
                ],
            },
            {
                "name": "web-origins",
                "description": "OpenID Connect scope for add allowed web origins to the access token",
                "protocol": "openid-connect",
                "attributes": {
                    "include.in.token.scope": "false",
                    "consent.screen.text": "",
                    "display.on.consent.screen": "false",
                },
                "protocolMappers": [
                    {
                        "name": "allowed web origins",
                        "protocol": "openid-connect",
                        "protocolMapper": "oidc-allowed-origins-mapper",
                        "consentRequired": False,
                        "config": {
                            "introspection.token.claim": "true",
                            "access.token.claim": "true",
                        },
                    }
                ],
            },
        ]

        default_default_client_scopes = [
            "role_list",
            "profile",
            "email",
            "roles",
            "web-origins",
            "acr",
        ]

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
            "enabledEventTypes": [
                "LOGIN",
                "LOGIN_ERROR",
                "LOGOUT",
                "LOGOUT_ERROR",
                "REGISTER",
                "REGISTER_ERROR",
                "CODE_TO_TOKEN",
                "CODE_TO_TOKEN_ERROR",
                "CLIENT_LOGIN",
                "CLIENT_LOGIN_ERROR",
                "REFRESH_TOKEN",
                "REFRESH_TOKEN_ERROR",
                "INTROSPECT_TOKEN",
                "INTROSPECT_TOKEN_ERROR",
                "FEDERATED_IDENTITY_LINK",
                "FEDERATED_IDENTITY_LINK_ERROR",
                "REMOVE_FEDERATED_IDENTITY",
                "REMOVE_FEDERATED_IDENTITY_ERROR",
                "UPDATE_EMAIL",
                "UPDATE_EMAIL_ERROR",
                "UPDATE_PROFILE",
                "UPDATE_PROFILE_ERROR",
                "UPDATE_PASSWORD",
                "UPDATE_PASSWORD_ERROR",
                "UPDATE_TOTP",
                "UPDATE_TOTP_ERROR",
                "VERIFY_EMAIL",
                "VERIFY_EMAIL_ERROR",
                "VERIFY_PROFILE",
                "VERIFY_PROFILE_ERROR",
                "REMOVE_TOTP",
                "REMOVE_TOTP_ERROR",
                "GRANT_CONSENT",
                "GRANT_CONSENT_ERROR",
                "UPDATE_CONSENT",
                "UPDATE_CONSENT_ERROR",
                "REVOKE_GRANT",
                "REVOKE_GRANT_ERROR",
                "SEND_VERIFY_EMAIL",
                "SEND_VERIFY_EMAIL_ERROR",
                "SEND_RESET_PASSWORD",
                "SEND_RESET_PASSWORD_ERROR",
                "RESET_PASSWORD",
                "RESET_PASSWORD_ERROR",
                "CUSTOM_REQUIRED_ACTION",
                "CUSTOM_REQUIRED_ACTION_ERROR",
                "EXECUTE_ACTIONS",
                "EXECUTE_ACTIONS_ERROR",
                "CLIENT_REGISTER",
                "CLIENT_REGISTER_ERROR",
                "CLIENT_UPDATE",
                "CLIENT_UPDATE_ERROR",
                "CLIENT_DELETE",
                "CLIENT_DELETE_ERROR",
            ],
            "eventsExpiration": 604800,  # 7 days in seconds
            "adminEventsEnabled": True,
            "adminEventsDetailsEnabled": True,
            "roles": {
                "realm": [
                    {
                        "name": "ORG_MANAGER",
                        "description": "Custom administrator role for the organization",
                    },
                    {
                        "name": "CONTENT_MANAGER",
                        "description": "Custom role for read-only access",
                    },
                    {
                        "name": "DEFAULT_USER",
                        "description": "Custom role for read-only access",
                    },
                ]
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
