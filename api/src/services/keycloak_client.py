"""
Keycloak Client - Unified Keycloak API operations.

This module provides a single interface for all Keycloak API calls.
All methods accept an access token parameter, allowing both admin
service account tokens and user access tokens to be used.
"""

import os
import json
import requests
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()


class KeycloakClient:
    """Unified Keycloak API client."""

    def __init__(self):
        self.keycloak_url = os.getenv("KEYCLOAK_URL")
        self.admin_secret = os.getenv("CLIENT_SECRET")

        if not self.keycloak_url:
            raise HTTPException(
                status_code=500, detail="KEYCLOAK_URL environment variable is not set"
            )

    def _make_request(
        self,
        method: str,
        url: str,
        token: str,
        json_data: dict | list | None = None,
        params: dict | None = None,
    ) -> requests.Response:
        """Make an authenticated request to Keycloak."""
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        try:
            if method == "GET":
                resp = requests.get(url, headers=headers, params=params)
            elif method == "POST":
                resp = requests.post(url, headers=headers, json=json_data)
            elif method == "PUT":
                resp = requests.put(url, headers=headers, json=json_data)
            elif method == "DELETE":
                resp = requests.delete(url, headers=headers, json=json_data)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            return resp
        except requests.exceptions.RequestException as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to communicate with Keycloak: {str(e)}"
            )

    def get_admin_token(self) -> str:
        """Get admin service account token using client credentials."""
        if not self.admin_secret:
            raise HTTPException(
                status_code=500, detail="CLIENT_SECRET environment variable is not set"
            )

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
            return token_data.get("access_token")
        except requests.exceptions.RequestException:
            raise HTTPException(status_code=500, detail="Failed to retrieve admin token")
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=500, detail="Failed to decode admin token response"
            )

    # ============ User Operations ============

    def list_users(self, realm: str, token: str) -> list[dict]:
        """List users in the realm."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users"
        resp = self._make_request("GET", url, token)

        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        resp.raise_for_status()
        return resp.json()

    def create_user(self, realm: str, token: str, user_data: dict) -> requests.Response:
        """Create a user in the realm. Returns response for location header extraction."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users"
        resp = self._make_request("POST", url, token, json_data=user_data)

        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        return resp

    def delete_user(self, realm: str, token: str, user_id: str) -> None:
        """Delete a user from the realm."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}"
        resp = self._make_request("DELETE", url, token)

        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code not in (204, 200):
            resp.raise_for_status()

    def get_user(self, realm: str, token: str, user_id: str) -> dict | None:
        """Get a single user representation."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}"
        resp = self._make_request("GET", url, token)

        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return resp.json()

    def get_user_realm_roles(self, realm: str, token: str, user_id: str) -> list[dict]:
        """Get realm role mappings for a user."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}/role-mappings/realm"
        resp = self._make_request("GET", url, token)

        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code == 404:
            return []
        resp.raise_for_status()
        return resp.json() or []

    # ============ Group Operations ============

    def list_groups(self, realm: str, token: str) -> list[dict]:
        """List groups in the realm."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/groups"
        resp = self._make_request("GET", url, token)

        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        resp.raise_for_status()
        return resp.json()

    def create_group(self, realm: str, token: str, name: str) -> requests.Response:
        """Create a group in the realm. Returns response for location header extraction."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/groups"
        resp = self._make_request("POST", url, token, json_data={"name": name})

        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        return resp

    def delete_group(self, realm: str, token: str, group_id: str) -> None:
        """Delete a group from the realm."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/groups/{group_id}"
        resp = self._make_request("DELETE", url, token)

        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code not in (204, 200):
            resp.raise_for_status()

    def update_group(self, realm: str, token: str, group_id: str, name: str) -> None:
        """Update a group's name."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/groups/{group_id}"
        resp = self._make_request("PUT", url, token, json_data={"name": name})

        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code not in (204, 200):
            resp.raise_for_status()

    def add_user_to_group(self, realm: str, token: str, user_id: str, group_id: str) -> None:
        """Add a user to a group."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}/groups/{group_id}"
        resp = self._make_request("PUT", url, token)

        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code not in (204, 201):
            resp.raise_for_status()

    def remove_user_from_group(self, realm: str, token: str, user_id: str, group_id: str) -> None:
        """Remove a user from a group."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}/groups/{group_id}"
        resp = self._make_request("DELETE", url, token)

        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code not in (204, 200):
            resp.raise_for_status()

    def list_group_members(self, realm: str, token: str, group_id: str) -> list[dict]:
        """List members of a group."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/groups/{group_id}/members"
        resp = self._make_request("GET", url, token)

        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        resp.raise_for_status()
        return resp.json()

    # ============ Role Operations ============

    def get_realm_role(self, realm: str, token: str, role_name: str) -> dict | None:
        """Fetch a realm role representation by name."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/roles/{role_name}"
        resp = self._make_request("GET", url, token)

        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return resp.json()

    def assign_realm_roles(self, realm: str, token: str, user_id: str, roles: list[dict]) -> None:
        """Assign one or more realm roles to a user."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}/role-mappings/realm"
        payload = [{"id": r.get("id"), "name": r.get("name")} for r in roles if r.get("id") and r.get("name")]
        if not payload:
            return

        resp = self._make_request("POST", url, token, json_data=payload)
        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code not in (204, 201):
            resp.raise_for_status()

    def remove_realm_roles(self, realm: str, token: str, user_id: str, roles: list[dict]) -> None:
        """Remove one or more realm roles from a user."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}/role-mappings/realm"
        payload = [{"id": r.get("id"), "name": r.get("name")} for r in roles if r.get("id") and r.get("name")]
        if not payload:
            return

        resp = self._make_request("DELETE", url, token, json_data=payload)
        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code not in (204, 200):
            resp.raise_for_status()

    # ============ Client Role Operations ============

    def get_client_by_client_id(self, realm: str, token: str, client_id: str) -> dict | None:
        """Fetch a client representation by clientId."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/clients"
        resp = self._make_request("GET", url, token)

        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        resp.raise_for_status()
        clients = resp.json() or []
        return next((c for c in clients if c.get("clientId") == client_id), None)

    def get_client_role(self, realm: str, token: str, client_uuid: str, role_name: str) -> dict | None:
        """Fetch a client role representation by name."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/clients/{client_uuid}/roles/{role_name}"
        resp = self._make_request("GET", url, token)

        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return resp.json()

    def assign_client_roles(
        self, realm: str, token: str, user_id: str, client_uuid: str, roles: list[dict]
    ) -> None:
        """Assign one or more client roles to a user."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}/role-mappings/clients/{client_uuid}"
        payload = []
        for r in roles:
            rid = r.get("id")
            name = r.get("name")
            if rid and name:
                payload.append({
                    "id": rid,
                    "name": name,
                    "containerId": r.get("containerId", client_uuid),
                    "clientRole": True,
                })
        if not payload:
            return

        resp = self._make_request("POST", url, token, json_data=payload)
        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code not in (204, 201):
            resp.raise_for_status()


# Singleton instance
_keycloak_client: KeycloakClient | None = None


def get_keycloak_client() -> KeycloakClient:
    """Get the singleton KeycloakClient instance."""
    global _keycloak_client
    if _keycloak_client is None:
        _keycloak_client = KeycloakClient()
    return _keycloak_client
