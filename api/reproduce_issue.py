import sys
import os
import requests
import json

# Add current directory to sys.path to allow imports
sys.path.append(os.getcwd())

from src.core.admin import Admin

try:
    admin = Admin()
    print("Admin initialized")
    token = admin._get_admin_token()
    print("Token retrieved")

    url = f"{admin.keycloak_url}/admin/realms"
    
    # Payload with attributes
    payload = {
        "realm": "DebugRealmAttributes",
        "enabled": True,
        "attributes": {
            "userCount": "5",
            "bundle": "",
            "features": ""
        }
    }
    
    print(f"Testing minimal payload: {json.dumps(payload)}")
    
    r = requests.post(url, headers={
        "Content-Type": "application/json", 
        "Authorization": "Bearer {}".format(token)
    }, data=json.dumps(payload))

    print(f"Status Code: {r.status_code}")
    print(f"Response Text: {r.text}")

except Exception as e:
    print(f"Exception: {e}")
