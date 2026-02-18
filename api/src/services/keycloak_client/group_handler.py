import requests


class group_handler:
    """Keycloak group operations."""

    def list_groups(self, realm: str, token: str) -> list[dict]:
        """List groups in the realm."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/groups"
        resp = self._make_request("GET", url, token)
        return resp.json()

    def create_group(self, realm: str, token: str, name: str) -> requests.Response:
        """Create a group in the realm. Returns response for location header extraction."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/groups"
        return self._make_request("POST", url, token, json_data={"name": name})

    def delete_group(self, realm: str, token: str, group_id: str) -> None:
        """Delete a group from the realm."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/groups/{group_id}"
        self._make_request("DELETE", url, token)

    def update_group(self, realm: str, token: str, group_id: str, name: str) -> None:
        """Update a group's name."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/groups/{group_id}"
        self._make_request("PUT", url, token, json_data={"name": name})

    def add_user_to_group(self, realm: str, token: str, user_id: str, group_id: str) -> None:
        """Add a user to a group."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}/groups/{group_id}"
        self._make_request("PUT", url, token)

    def remove_user_from_group(self, realm: str, token: str, user_id: str, group_id: str) -> None:
        """Remove a user from a group."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/users/{user_id}/groups/{group_id}"
        self._make_request("DELETE", url, token)

    def list_group_members(self, realm: str, token: str, group_id: str) -> list[dict]:
        """List members of a group."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/groups/{group_id}/members"
        resp = self._make_request("GET", url, token)
        return resp.json()
