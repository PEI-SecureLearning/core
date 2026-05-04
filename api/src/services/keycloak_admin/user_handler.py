import requests
from sqlmodel import Session

from src.models import Realm, User
from src.services.keycloak_admin.base_handler import base_handler


class user_handler(base_handler):

    def __init__(self):
        super().__init__()

    def list_users(self, realm_name: str) -> list[dict]:
        """List users in a realm (basic fields only)."""
        token = self._get_admin_token()
        return self.keycloak_client.list_users(realm_name, token)

    def get_user_count(self, realm_name: str) -> int:
        """Return the total number of users in a realm."""
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/users/count"

        r = self.keycloak_client._make_request("GET", url, token)

        return r.json()

    def delete_user(self, realm_name: str, user_id: str) -> None:
        """Delete a user from a realm in Keycloak."""
        token = self._get_admin_token()
        self.keycloak_client.delete_user(realm_name, token, user_id)

    def get_user_realm_roles(self, realm_name: str, user_id: str) -> list[dict]:
        """Return realm roles assigned to the given user."""
        token = self._get_admin_token()
        return self.keycloak_client.get_user_realm_roles(realm_name, token, user_id)

    def assign_realm_role_to_user(self, realm_name: str, user_id: str, role_name: str):
        """Assign a realm role to a user."""
        token = self._get_admin_token()
        kc = self.keycloak_client
        role_repr = kc.get_realm_role(realm_name, token, role_name)
        if role_repr:
            kc.assign_realm_roles(realm_name, token, user_id, [role_repr])

    def remove_realm_role_from_user(
        self, realm_name: str, user_id: str, role_name: str
    ):
        """Remove a realm role from a user."""
        token = self._get_admin_token()
        kc = self.keycloak_client
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
        kc = self.keycloak_client

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

        payload = {k: v for k, v in payload.items() if v not in (None, {}, [])}

        r = kc.create_user(realm_name, token, payload)

        # If session is provided and user was created, add to local DB
        if r.status_code not in (201, 204) or not session:
            return r

        location = r.headers.get("Location")
        if not location:
            return r

        user_id = location.rstrip("/").split("/")[-1]
        
        # Trigger "Update Password" email
        kc.execute_actions_email(realm_name, token, user_id, ["UPDATE_PASSWORD"])

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
            user = User(
                keycloak_id=user_id, email=email or "", is_org_manager=is_org_manager
            )
            session.add(user)
        session.commit()

        return r


_instance: user_handler | None = None


def get_user_handler() -> user_handler:
    global _instance
    if _instance is None:
        _instance = user_handler()
    return _instance
