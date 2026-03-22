from fastapi import HTTPException
from src.services.keycloak_client.base_handler import base_handler


class role_handler(base_handler):
    """Keycloak realm role operations."""

    def __init__(self):
        super().__init__()

    def get_realm_role(self, realm: str, token: str, role_name: str) -> dict | None:
        """Fetch a realm role representation by name."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/roles/{role_name}"
        try:
            resp = self._make_request("GET", url, token)
        except HTTPException as e:
            if e.status_code == 404:
                return None
            raise
        return resp.json()

    def assign_realm_roles(
        self, realm: str, token: str, user_id: str, roles: list[dict]
    ) -> None:
        """Assign one or more realm roles to a user."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}/role-mappings/realm"
        payload = [
            {"id": r.get("id"), "name": r.get("name")}
            for r in roles
            if r.get("id") and r.get("name")
        ]
        if not payload:
            return

        self._make_request("POST", url, token, json_data=payload)

    def remove_realm_roles(
        self, realm: str, token: str, user_id: str, roles: list[dict]
    ) -> None:
        """Remove one or more realm roles from a user."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}/role-mappings/realm"
        payload = [
            {"id": r.get("id"), "name": r.get("name")}
            for r in roles
            if r.get("id") and r.get("name")
        ]
        if not payload:
            return

        self._make_request("DELETE", url, token, json_data=payload)


_instance: role_handler | None = None


def get_role_handler() -> role_handler:
    global _instance
    if _instance is None:
        _instance = role_handler()
    return _instance
