import requests


class Feature_handler:

    def get_realm_features(self, realm_name: str) -> dict[str, bool]:
        """
        Get feature flags for a realm by reading the realm-feature-flags client scope.
        """
        features: dict[str, bool] = {}

        token = self._get_admin_token()

        url = f"{self.keycloak_url}/admin/realms/{realm_name}/client-scopes"
    
        r = self._make_request("GET",url,token)
  
        scope_id = self.find_feature_scope(r.json())

        # Get the protocol mappers for this scope
        mappers_url = f"{self.keycloak_url}/admin/realms/{realm_name}/client-scopes/{scope_id}/protocol-mappers/models"
        
        r = self._make_request("GET",mappers_url,token)

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


    def find_feature_scope(self,scopes):
        feature_scope = next((s for s in scopes if s.get("name") == "realm-feature-flags"),None)

        if not feature_scope:
            raise HTTPException(status_code=404, detail="Feature scope not found")

        scope_id = feature_scope.get("id")
        if not scope_id:
            raise HTTPException(status_code=404, detail="Feature scope ID not found")

        return scope_id


    def toggle_realm_feature(self, realm_name: str, feature_name: str, enabled: bool) -> bool:
        """Toggle a feature flag for a realm. Returns True if successful."""
        token = self._get_admin_token()

        # Get the realm-feature-flags scope
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/client-scopes"
        r = self._make_request("GET",url,token)

        scope_id = self.find_feature_scope(r.json())

        if not scope_id:
            scope_id = self._create_client_scope(realm_name, "realm-feature-flags", token)

        # Get existing mappers
        mappers_url = f"{self.keycloak_url}/admin/realms/{realm_name}/client-scopes/{scope_id}/protocol-mappers/models"
       
        r = self._make_request("GET",mappers_url,token)
        
        mappers = r.json()

        existing_mapper = None
        for mapper in mappers:
            
            config = mapper.get("config", {})
            
            if config.get("claim.name") == f"features.{feature_name}":
                existing_mapper = mapper
                break

        if existing_mapper:

            mapper_id = existing_mapper.get("id")
            update_url = f"{self.keycloak_url}/admin/realms/{realm_name}/client-scopes/{scope_id}/protocol-mappers/models/{mapper_id}"
            
            existing_mapper["config"]["claim.value"] = str(enabled).lower()
            
            r = self._make_request("PUT",update_url,token,json=existing_mapper)
            
            return r.status_code in (204, 200)

        else:
            # Create new mapper
            self._add_hardcoded_claim_mapper(realm_name, scope_id, feature_name, enabled, token)

            return True


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

        r = self._make_request("POST",url,token,json=payload)
        
        location = r.headers.get("Location", "")
        scope_id = location.split("/")[-1] if location else None
        
        return scope_id
     

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

        r = self._make_request("POST",url,token,json=payload)
        
        return r.status_code in (201, 204)


