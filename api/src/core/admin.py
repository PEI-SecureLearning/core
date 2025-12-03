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


    def create_realm(self, realm_name: str, admin_email: str, user_count: int, bundle: str | None = None, features: dict | None = None):
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms"

        attributes = {
            "userCount": str(user_count),
            "bundle": bundle if bundle else "",
            "features": json.dumps(features) if features else ""
        }

        r = requests.post(url, headers={
                                        "Content-Type": "application/json", 
                                        "Authorization": "Bearer {}".format(token)
                                    },
        json={
                "realm": realm_name,
                "enabled": True,
                "displayName": realm_name,
                "attributes": attributes,
                "roles": {
                    "realm": [
                        {
                            "name": "CUSTOM_ORG_ADMIN",
                            "description": "Custom administrator role for the organization"
                        },
                        {
                            "name": "ent_managercont",
                            "description": "Custom role for read-only access"
                        },
                        {
                            "name": "Default_user",
                            "description": "Custom role for read-only access"
                        },
                        {
                            "name": "phishing",
                            "description": "Custom role for read-only access"
                        },
                        {
                            "name": "lms",
                            "description": "Custom role for read-only access"
                        },  
                    ]
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
                    },
                    {
                        "clientId": "api",
                        "enabled": True,
                        "publicClient": False,
                        "redirectUris": ["http://localhost:8000/*"],
                        "webOrigins": ["http://localhost:8000"],
                        "implicitFlowEnabled": False,
                        "directAccessGrantsEnabled": True,
                        "serviceAccountsEnabled": True,
                        "authorizationServicesEnabled": True,
                    }
                ],
                "users": [
                    {
                        "username": "Org_manager",
                        "enabled": True,
                        "firstName": "Org",
                        "lastName": "Manager",
                        "email": admin_email, 
                        "credentials": [
                            {
                                "type": "password",
                                "value": "1234",
                                "temporary": True
                            }
                        ],
                        "realmRoles": [
                            "CUSTOM_ORG_ADMIN"
                        ]
                    }
                ]
        })             
        return r


    def add_user(self,realm_name: str, username: str, password: str):
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/users"

        r = requests.post(url, headers={
                                        "Content-Type": "application/json", 
                                        "Authorization": "Bearer {}".format(token)
                                    },
        json={
            "username": username,
            "enabled": True,
            "credentials": [
                {
                    "type": "password",
                    "value": password,
                    "temporary": False
                }
            ]
        })
        
        return r

    def get_client_uuid(self, realm_name: str, client_id: str):
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/clients"
        r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, params={"clientId": client_id})
        r.raise_for_status()
        clients = r.json()
        if not clients:
            raise HTTPException(status_code=404, detail=f"Client {client_id} not found")
        return clients[0]['id']

    def get_role_id(self, realm_name: str, role_name: str):
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/roles/{role_name}"
        r = requests.get(url, headers={"Authorization": f"Bearer {token}"})
        if r.status_code == 404:
            return None
        r.raise_for_status()
        return r.json()['id']

    def create_authz_scope(self, realm_name: str, client_uuid: str, scope_name: str):
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/clients/{client_uuid}/authz/resource-server/scope"
        r = requests.post(url, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }, json={"name": scope_name})
        return r

    def create_authz_resource(self, realm_name: str, client_uuid: str, resource_name: str, uris: list[str], scopes: list[str]):
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/clients/{client_uuid}/authz/resource-server/resource"
        
        scope_payload = [{"name": s} for s in scopes]
        
        r = requests.post(url, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }, json={
            "name": resource_name,
            "uris": uris,
            "scopes": scope_payload
        })
        return r

    def create_authz_role_policy(self, realm_name: str, client_uuid: str, policy_name: str, roles: list[dict]):
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/clients/{client_uuid}/authz/resource-server/policy/role"
        
        r = requests.post(url, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }, json={
            "name": policy_name,
            "type": "role",
            "logic": "POSITIVE",
            "config": {
                "roles": json.dumps(roles)
            }
        })
        return r

    def create_authz_permission(self, realm_name: str, client_uuid: str, permission_name: str, resource_name: str, policy_names: list[str], scope_names: list[str] = None):
        token = self._get_admin_token()
        url = f"{self.keycloak_url}/admin/realms/{realm_name}/clients/{client_uuid}/authz/resource-server/permission/scope"
        
        payload = {
            "name": permission_name,
            "resources": [resource_name],
            "policies": policy_names,
        }
        if scope_names:
            payload["scopes"] = scope_names
            
        r = requests.post(url, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }, json=payload)
        return r

    def setup_orders_authorization(self, realm_name: str):
        # 1. Get Client UUID for 'api'
        client_uuid = self.get_client_uuid(realm_name, "api")
        
        # 2. Create Scopes
        self.create_authz_scope(realm_name, client_uuid, "view")
        self.create_authz_scope(realm_name, client_uuid, "edit")
        
        # 3. Create Resource
        self.create_authz_resource(
            realm_name, 
            client_uuid, 
            "orders-resource", 
            ["/api/orders/*"], 
            ["view", "edit"]
        )
        
        # 4. Create Role Policy (Managers Only)
        # Using CUSTOM_ORG_ADMIN as the manager role
        role_id = self.get_role_id(realm_name, "CUSTOM_ORG_ADMIN")
        if not role_id:
             print(f"Warning: CUSTOM_ORG_ADMIN role not found in realm {realm_name}.")
             return

        self.create_authz_role_policy(
            realm_name, 
            client_uuid, 
            "Managers Only", 
            [{"id": role_id, "required": True}]
        )
        
        # 5. Create Permission
        self.create_authz_permission(
            realm_name,
            client_uuid,
            "Orders Manager Permission",
            "orders-resource",
            ["Managers Only"],
            ["view", "edit"]
        )
        
        print(f"Orders authorization setup complete for realm {realm_name}")