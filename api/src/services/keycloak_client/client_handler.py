from fastapi import HTTPException


class Client_handler:
    """Keycloak client role operations."""

    def get_client_by_client_id(self, realm: str, token: str, client_id: str) -> dict | None:
        """Fetch a client representation by clientId."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/clients"
        resp = self._make_request("GET", url, token)
        clients = resp.json() or []
        return next((c for c in clients if c.get("clientId") == client_id), None)

    def get_client_role(self, realm: str, token: str, client_uuid: str, role_name: str) -> dict | None:
        """Fetch a client role representation by name."""
        url = f"{self.keycloak_url}/admin/realms/{realm}/clients/{client_uuid}/roles/{role_name}"
        resp = self._make_request("GET", url, token)

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

        self._make_request("POST", url, token, json_data=payload)
