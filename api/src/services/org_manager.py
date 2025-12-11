"""
Org Manager Service - Business logic for org manager operations.
"""
import secrets
from fastapi import HTTPException
from sqlmodel import Session
from src.core.org_manager import OrgManager
from src.core.db import engine
from src.models.user import User
from src.models.user_group import UserGroup
from src.models.realm import Realm

# Singleton instance
_org_manager = OrgManager()


def get_org_manager() -> OrgManager:
    """Get the OrgManager instance."""
    return _org_manager


# ============ User Operations ============

def list_users(realm: str, token: str) -> dict:
    """List users in the realm."""
    users = _org_manager.list_users(realm, token)
    
    simplified = []
    for u in users:
        simplified.append({
            "id": u.get("id"),
            "username": u.get("username"),
            "email": u.get("email"),
            "firstName": u.get("firstName"),
            "lastName": u.get("lastName"),
            "enabled": u.get("enabled"),
        })
    return {"realm": realm, "users": simplified}


def create_user(
    realm: str,
    token: str,
    username: str,
    name: str,
    email: str,
    role: str,
    group_id: str | None = None
) -> dict:
    """Create a new user in the realm."""
    temporary_password = secrets.token_urlsafe(12)
    
    first_name = None
    last_name = None
    if name:
        parts = name.strip().split(" ", 1)
        first_name = parts[0]
        if len(parts) > 1:
            last_name = parts[1]
    
    user_data = {
        "username": username,
        "enabled": True,
        "email": email,
        "firstName": first_name,
        "lastName": last_name,
        "attributes": {"role": [role]} if role else {},
        "credentials": [
            {
                "type": "password",
                "value": temporary_password,
                "temporary": True
            }
        ]
    }
    user_data = {k: v for k, v in user_data.items() if v not in (None, {}, [])}
    
    response = _org_manager.create_user(realm, token, user_data)
    
    if response.status_code not in (201, 204):
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to create user: {response.text}"
        )
    
    # Get user ID from Location header for group assignment
    user_id = None
    location = response.headers.get("Location")
    if location:
        user_id = location.rstrip("/").split("/")[-1]
    
    if group_id and user_id:
        try:
            _org_manager.add_user_to_group(realm, token, user_id, group_id)
        except Exception:
            pass  # Ignore group assignment errors

    # Persist the user locally (upsert by keycloak_id). If Location header missing, look up by username.
    if not user_id:
        try:
            kc_users = _org_manager.list_users(realm, token)
            match = next((u for u in kc_users if u.get("username") == username), None)
            user_id = match.get("id") if match else None
        except Exception:
            user_id = None

    if user_id:
        with Session(engine) as session:
            if realm and not session.get(Realm, realm):
                session.add(Realm(name=realm, domain=f"{realm}.local"))
            existing = session.get(User, user_id)
            if existing:
                existing.email = email
                existing.last_keycloak_sync = None
            else:
                session.add(User(keycloak_id=user_id, email=email))
            session.commit()

    return {
        "realm": realm,
        "username": username,
        "status": "created",
        "temporary_password": temporary_password,
    }


def delete_user(realm: str, token: str, user_id: str) -> None:
    """Delete a user from the realm."""
    _org_manager.delete_user(realm, token, user_id)
    with Session(engine) as session:
        db_user = session.get(User, user_id)
        if db_user:
            session.delete(db_user)
            session.commit()


# ============ Group Operations ============

def list_groups(realm: str, token: str) -> dict:
    """List groups in the realm."""
    groups = _org_manager.list_groups(realm, token)
    
    simplified = []
    for g in groups:
        simplified.append({
            "id": g.get("id"),
            "name": g.get("name"),
            "path": g.get("path")
        })
    return {"realm": realm, "groups": simplified}


def create_group(realm: str, token: str, name: str) -> dict:
    """Create a group in the realm."""
    response = _org_manager.create_group(realm, token, name)
    
    if response.status_code not in (201, 204):
        raise HTTPException(
            status_code=response.status_code,
            detail="Failed to create group"
        )
    # Persist group locally
    location = response.headers.get("Location")
    group_id = None
    if location:
        group_id = location.rstrip("/").split("/")[-1]
    if group_id:
        with Session(engine) as session:
            session.add(UserGroup(keycloak_id=group_id))
            session.commit()
    return {"realm": realm, "name": name}


def delete_group(realm: str, token: str, group_id: str) -> None:
    """Delete a group from the realm."""
    _org_manager.delete_group(realm, token, group_id)
    with Session(engine) as session:
        db_group = session.get(UserGroup, group_id)
        if db_group:
            session.delete(db_group)
            session.commit()


def update_group(realm: str, token: str, group_id: str, name: str) -> None:
    """Update a group's name."""
    _org_manager.update_group(realm, token, group_id, name)


def add_user_to_group(realm: str, token: str, user_id: str, group_id: str) -> None:
    """Add a user to a group."""
    _org_manager.add_user_to_group(realm, token, user_id, group_id)


def remove_user_from_group(realm: str, token: str, user_id: str, group_id: str) -> None:
    """Remove a user from a group."""
    _org_manager.remove_user_from_group(realm, token, user_id, group_id)


def list_group_members(realm: str, token: str, group_id: str) -> dict:
    """List members of a group."""
    members = _org_manager.list_group_members(realm, token, group_id)
    
    simplified = []
    for m in members:
        simplified.append({
            "id": m.get("id"),
            "username": m.get("username"),
            "email": m.get("email"),
            "firstName": m.get("firstName"),
            "lastName": m.get("lastName"),
        })
    return {"realm": realm, "groupId": group_id, "members": simplified}
