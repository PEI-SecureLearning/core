import requests
from fastapi import HTTPException


class user_handler:
    """Keycloak user operations."""

    def list_users(self, realm: str, token: str) -> list[dict]:
        """List users in the realm."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users"
        resp = self._make_request("GET", url, token)
        return resp.json()

    def create_user(self, realm: str, token: str, user_data: dict) -> requests.Response:
        """Create a user in the realm. Returns response for location header extraction."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users"
        return self._make_request("POST", url, token, json_data=user_data)

    def delete_user(self, realm: str, token: str, user_id: str) -> None:
        """Delete a user from the realm."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}"
        self._make_request("DELETE", url, token)

    def get_user(self, realm: str, token: str, user_id: str) -> dict | None:
        """Get a single user representation."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}"
        try:
            resp = self._make_request("GET", url, token)
        except HTTPException as e:
            if e.status_code == 404:
                return None
            raise
        return resp.json()

    def get_user_realm_roles(self, realm: str, token: str, user_id: str) -> list[dict]:
        """Get realm role mappings for a user."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}/role-mappings/realm"
        try:
            resp = self._make_request("GET", url, token)
        except HTTPException as e:
            if e.status_code == 404:
                return []
            raise
        return resp.json() or []
