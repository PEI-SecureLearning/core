"""
Org Manager - Token-based Keycloak operations.

This module provides Keycloak operations using the user's access token
instead of the admin service account. Used by ORG_MANAGER users to 
manage their realm.
"""
import os
import requests
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()


class OrgManager:
    """Token-based Keycloak operations for org managers."""
    
    def __init__(self):
        self.keycloak_url = os.getenv("KEYCLOAK_URL")
        if not self.keycloak_url:
            raise HTTPException(status_code=500, detail="KEYCLOAK_URL environment variable is not set")

    def _make_request(self, method: str, url: str, token: str, json: dict | list | None = None):
        """Make an authenticated request to Keycloak using the user's token."""
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        try:
            if method == "GET":
                resp = requests.get(url, headers=headers)
            elif method == "POST":
                resp = requests.post(url, headers=headers, json=json)
            elif method == "PUT":
                resp = requests.put(url, headers=headers, json=json)
            elif method == "DELETE":
                resp = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            return resp
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=500, detail=f"Failed to communicate with Keycloak: {str(e)}")

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
        """Create a user in the realm."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users"
        resp = self._make_request("POST", url, token, json=user_data)
        
        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        return resp

    def delete_user(self, realm: str, token: str, user_id: str):
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
        """Create a group in the realm."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/groups"
        resp = self._make_request("POST", url, token, json={"name": name})
        
        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        return resp

    def delete_group(self, realm: str, token: str, group_id: str):
        """Delete a group from the realm."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/groups/{group_id}"
        resp = self._make_request("DELETE", url, token)
        
        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code not in (204, 200):
            resp.raise_for_status()

    def update_group(self, realm: str, token: str, group_id: str, name: str):
        """Update a group's name."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/groups/{group_id}"
        resp = self._make_request("PUT", url, token, json={"name": name})
        
        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code not in (204, 200):
            resp.raise_for_status()

    def add_user_to_group(self, realm: str, token: str, user_id: str, group_id: str):
        """Add a user to a group."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}/groups/{group_id}"
        resp = self._make_request("PUT", url, token)
        
        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code not in (204, 201):
            resp.raise_for_status()

    def remove_user_from_group(self, realm: str, token: str, user_id: str, group_id: str):
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
        resp = self._make_request("POST", url, token, json=payload)
        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code not in (204, 201):
            resp.raise_for_status()

    # ============ Client Role Operations ============

    def get_client_by_client_id(self, realm: str, token: str, client_id: str) -> dict | None:
        """Fetch a client representation by clientId."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/clients"
        resp = self._make_request("GET", url, token, json=None)
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

    def assign_client_roles(self, realm: str, token: str, user_id: str, client_uuid: str, roles: list[dict]) -> None:
        """Assign one or more client roles to a user."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}/role-mappings/clients/{client_uuid}"
        payload = []
        for r in roles:
            rid = r.get("id")
            name = r.get("name")
            if rid and name:
                payload.append(
                    {
                        "id": rid,
                        "name": name,
                        "containerId": r.get("containerId", client_uuid),
                        "clientRole": True,
                    }
                )
        if not payload:
            return
        resp = self._make_request("POST", url, token, json=payload)
        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        if resp.status_code not in (204, 201):
            resp.raise_for_status()
