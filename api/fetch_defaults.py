import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL")
ADMIN_SECRET = os.getenv("CLIENT_SECRET")

def get_admin_token():
    url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    data = {
        'grant_type': 'client_credentials',
        'client_id': 'SecureLearning-admin',
        'client_secret': ADMIN_SECRET
    }
    r = requests.post(url, data=data)
    r.raise_for_status()
    return r.json()['access_token']

def fetch_defaults():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # 1. Create a temp realm with minimal config
    realm_name = "temp-defaults-fetcher"
    print(f"Creating temp realm: {realm_name}")
    try:
        requests.delete(f"{KEYCLOAK_URL}/admin/realms/{realm_name}", headers=headers)
    except:
        pass
    
    r = requests.post(f"{KEYCLOAK_URL}/admin/realms", headers=headers, json={
        "realm": realm_name,
        "enabled": True
    })
    r.raise_for_status()
    
    # 2. Get client scopes
    print("Fetching client scopes...")
    r = requests.get(f"{KEYCLOAK_URL}/admin/realms/{realm_name}/client-scopes", headers=headers)
    r.raise_for_status()
    client_scopes = r.json()
    
    # 3. Get default default client scopes
    print("Fetching default default client scopes...")
    r = requests.get(f"{KEYCLOAK_URL}/admin/realms/{realm_name}/default-default-client-scopes", headers=headers)
    r.raise_for_status()
    default_defaults = r.json()
    default_default_names = [s['name'] for s in default_defaults]
    
    print(f"Found {len(client_scopes)} client scopes.")
    print(f"Default default client scopes: {default_default_names}")
    
    # Filter for the ones we care about
    target_scopes = ["acr", "address", "basic", "email", "microprofile-jwt", "offline_access", "organization", "phone", "profile", "role_list", "web-origins", "roles"]
    
    definitions = []
    for scope in client_scopes:
        if scope['name'] in target_scopes:
            scope_def = {
                "name": scope["name"],
                "description": scope.get("description", ""),
                "protocol": scope.get("protocol", "openid-connect"),
                "attributes": scope.get("attributes", {}),
                "protocolMappers": scope.get("protocolMappers", [])
            }
            definitions.append(scope_def)
            
    print(json.dumps(definitions, indent=2))
    
    # 4. Cleanup
    print("Deleting temp realm...")
    requests.delete(f"{KEYCLOAK_URL}/admin/realms/{realm_name}", headers=headers)

if __name__ == "__main__":
    fetch_defaults()
