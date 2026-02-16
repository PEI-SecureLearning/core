import requests


class Feature_handler:

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
