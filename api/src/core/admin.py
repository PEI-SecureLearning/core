import requests
import json
from fastapi import HTTPException
import os
from dotenv import load_dotenv

load_dotenv()

class Admin():
    def __init__(self):
        self.keycloak_url = os.getenv("KEYCLOAK_URL")
        self.admin_secret = os.getenv("CLIENT_SECRET")
        
        if not self.keycloak_url:
            raise HTTPException(status_code=500, detail="KEYCLOAK_URL environment variable is not set")
        if not self.admin_secret:
            raise HTTPException(status_code=500, detail="CLIENT_SECRET environment variable is not set")

    def _get_admin_token(self):
        url = f"{self.keycloak_url}/realms/master/protocol/openid-connect/token"

        data = {
            'grant_type': 'client_credentials',
            'client_id': 'SecureLearning-admin',  
            'client_secret': self.admin_secret
        }

        try:
            response = requests.post(
                url,
                data=data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            response.raise_for_status()

            token_data = response.json()
            access_token = token_data.get('access_token')

        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=500, detail="Failed to retrieve admin token")
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Failed to decode admin token response")
        
        return access_token


    def create_realm(self, realm_name: str, domain: str):
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms"

        r = requests.post(url, headers={
                                        "Content-Type": "application/json", 
                                        "Authorization": "Bearer {}".format(token)
                                    },
        json={
                "realm": realm_name,
                "enabled": True,
                "displayName": realm_name,
                "attributes": {
                    "tenant-domain": domain
                },
                "clients": [
                    {
                        "clientId": "react-app",
                        "enabled": True,
                        "publicClient": True,
                        "redirectUris": ["http://localhost:5173/*"],
                        "webOrigins": ["http://localhost:5173"],
                        "standardFlowEnabled": True,
                        "directAccessGrantsEnabled": True
                    }
                ],
                "users": [
                    {
                        "username": "Org_manager",
                        "enabled": True,
                        "firstName": "Org",
                        "lastName": "Manager",
                        "email": "org_manager@example.com", 
                        "credentials": [
                            {
                                "type": "password",
                                "value": "1234",
                                "temporary": True
                            }
                        ]
                    }
                ]
            })
                    
        return r


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
            raise HTTPException(status_code=500, detail="Failed to retrieve realm information from Keycloak")


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
            raise HTTPException(status_code=500, detail="Failed to retrieve realms from Keycloak")
        return None


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
            )
            r.raise_for_status()
            return r.json()
        except requests.exceptions.RequestException:
            raise HTTPException(status_code=500, detail="Failed to list users from Keycloak")


    def delete_user(self, realm_name: str, user_id: str):
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
        except requests.exceptions.RequestException:
            raise HTTPException(status_code=500, detail="Failed to delete user in Keycloak")


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
            raise HTTPException(status_code=500, detail="Failed to list groups from Keycloak")


    def create_group(self, realm_name: str, name: str):
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
            return r
        except requests.exceptions.RequestException:
            raise HTTPException(status_code=500, detail="Failed to create group in Keycloak")

    def delete_group(self, realm_name: str, group_id: str):
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
        except requests.exceptions.RequestException:
            raise HTTPException(status_code=500, detail="Failed to delete group in Keycloak")

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
            raise HTTPException(status_code=500, detail="Failed to update group in Keycloak")


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
            raise HTTPException(status_code=500, detail="Failed to add user to group in Keycloak")

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
            raise HTTPException(status_code=500, detail="Failed to remove user from group in Keycloak")


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
            raise HTTPException(status_code=500, detail="Failed to list group members from Keycloak")


    def add_user(
        self,
        realm_name: str,
        username: str,
        password: str,
        *,
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
                    "temporary": True  # force user to change it on first login
                }
            ]
        }

        # Remove empty attributes so Keycloak is not sent null values
        payload = {k: v for k, v in payload.items() if v not in (None, {}, [])}

        r = requests.post(url, headers={
                                        "Content-Type": "application/json", 
                                        "Authorization": "Bearer {}".format(token)
                                    },
        json=payload)
        
        return r
