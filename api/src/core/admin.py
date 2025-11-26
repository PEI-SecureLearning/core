import requests
import json
from fastapi import HTTPException

#TODO CHANGE TO ENV VARIABLES
KEYCLOAK_URL = "http://localhost:8080"
ADMIN_SECRET = "KHiR2RMNFqJLSb653yo2bB18jjGuatq7"          

class Admin():

    def _get_admin_token(self):
        url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"

        data = {
            'grant_type': 'client_credentials',
            'client_id': 'admin-cli',  
            'client_secret': ADMIN_SECRET
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


    def create_realm(self,realm_name: str):
        token = self._get_admin_token()
        url = "http://localhost:8080/admin/realms"

        r = requests.post(url, headers={
                                        "Content-Type": "application/json", 
                                        "Authorization": "Bearer {}".format(token)
                                    },
        json={
            "realm": realm_name,
            "enabled": True,
            "displayName": realm_name
        })
        
        return r


    def add_user(self,realm_name: str, username: str, password: str):
        token = self._get_admin_token()
        url = "http://localhost:8080/auth/admin/realms/" + realm_name + "/test/users"

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