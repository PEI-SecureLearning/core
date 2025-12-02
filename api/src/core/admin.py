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
                        "email": admin_email, 
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