"""
Org Manager Service - Business logic for org manager operations.
"""

import secrets

from requests import session
from fastapi import HTTPException
from sqlmodel import Session, select
from src.core.org_manager import OrgManager
from src.models.user import User
from src.models.user_group import UserGroup
from src.core.db import engine
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
        uid = u.get("id")
        is_org_manager = False
        try:
            roles = _org_manager.get_user_realm_roles(realm, token, uid) if uid else []
            is_org_manager = any(r.get("name") == "ORG_MANAGER" for r in roles)
        except Exception:
            is_org_manager = False

        simplified.append(
            {
                "id": uid,
                "username": u.get("username"),
                "email": u.get("email"),
                "firstName": u.get("firstName"),
                "lastName": u.get("lastName"),
                "enabled": u.get("enabled"),
                "is_org_manager": is_org_manager,
            }
        )
    return {"realm": realm, "users": simplified}


def create_user(
    session: Session,
    realm: str,
    token: str,
    username: str,
    name: str,
    email: str,
    role: str,
    group_id: str | None = None,
) -> dict:
    """Create a new user in the realm."""
    allowed_roles = {"ORG_MANAGER", "CONTENT_MANAGER", "DEFAULT_USER"}
    role_clean = (role or "").strip().upper()
    username_clean = (username or "").strip()

    if len(username_clean) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
    if len(username_clean) > 255:
        raise HTTPException(status_code=400, detail="Username must be 255 characters or fewer.")

    # Ensure email is unique within the realm (Keycloak will also enforce, but we surface a clearer message).
    try:
        kc_users = _org_manager.list_users(realm, token)
        if any((u.get("email") or "").lower() == (email or "").lower() for u in kc_users):
            raise HTTPException(status_code=400, detail="Email already exists in this realm.")
    except HTTPException:
        raise
    except Exception:
        # If we fail to list users, continue; Keycloak will enforce uniqueness.
        pass

    # Enforce that the user's email matches the realm's configured domain.
    realm_domain = None
    try:
        db_realm = session.get(Realm, realm) if realm else None
        if db_realm and db_realm.domain:
            realm_domain = db_realm.domain
    except Exception:
        realm_domain = None

    if realm and not realm_domain:
        # Fallback to realm name if domain not present; better than no validation.
        realm_domain = realm

    if realm_domain:
        domain_suffix = f"@{realm_domain.lower()}"
        email_lower = (email or "").lower()
        if not email_lower.endswith(domain_suffix):
            raise HTTPException(
                status_code=400,
                detail=f"Email must belong to the '{realm_domain}' domain.",
            )

    if not role_clean:
        raise HTTPException(status_code=400, detail="Role is required.")
    if role_clean not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role '{role_clean}'. Must be one of {', '.join(sorted(allowed_roles))}.",
        )

    temporary_password = secrets.token_urlsafe(12)

    first_name = None
    last_name = None
    if name:
        parts = name.strip().split(" ", 1)
        first_name = parts[0]
        if len(parts) > 1:
            last_name = parts[1]

    user_data = {
        "username": username_clean,
        "enabled": True,
        "email": email,
        "firstName": first_name,
        "lastName": last_name,
        "credentials": [
            {"type": "password", "value": temporary_password, "temporary": True}
        ],
    }
    user_data = {k: v for k, v in user_data.items() if v not in (None, {}, [])}

    response = _org_manager.create_user(realm, token, user_data)

    if response.status_code not in (201, 204, 409):
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to create user: {response.text}",
        )

    # Get user ID from Location header for group assignment (or handle existing user on 409).
    user_id = None
    location = response.headers.get("Location")
    if location:
        user_id = location.rstrip("/").split("/")[-1]
        user = User(keycloak_id=user_id, email=email)
        session.add(user)
        session.commit()

    # Persist the user locally (upsert by keycloak_id). If Location header missing, look up by username.
    if not user_id:
        try:
            kc_users = _org_manager.list_users(realm, token)
            match = next((u for u in kc_users if u.get("username") == username), None)
            user_id = match.get("id") if match else None
        except Exception:
            user_id = None

    if user_id:
        if group_id:
            try:
                _org_manager.add_user_to_group(realm, token, user_id, group_id)
            except Exception:
                # Ignore group assignment errors; they can be retried separately.
                pass

        try:
            role_repr = _org_manager.get_realm_role(realm, token, role_clean)
            if role_repr:
                _org_manager.assign_realm_roles(realm, token, user_id, [role_repr])
                if role_clean == "ORG_MANAGER":
                    client = _org_manager.get_client_by_client_id(realm, token, "realm-management")
                    if client and client.get("id"):
                        client_role = _org_manager.get_client_role(realm, token, client["id"], "realm-admin")
                        if client_role:
                            _org_manager.assign_client_roles(realm, token, user_id, client["id"], [client_role])
        except Exception:
            pass

        with Session(engine) as session:
            if realm and not session.get(Realm, realm):
                session.add(Realm(name=realm, domain=f"{realm}.local"))
            existing = session.get(User, user_id)
            if existing:
                existing.email = email
            else:
                session.add(User(keycloak_id=user_id, email=email))
            session.commit()

    return {
        "realm": realm,
        "username": username,
        "status": "created" if response.status_code in (201, 204) else "exists",
        "temporary_password": temporary_password,
    }


def delete_user(realm: str, token: str, user_id: str, session: Session) -> None:
    """Delete a user from the realm."""
    try:
        roles = _org_manager.get_user_realm_roles(realm, token, user_id)
        if any(r.get("name") == "ORG_MANAGER" for r in roles):
            raise HTTPException(status_code=403, detail="Cannot delete another org manager.")
    except HTTPException:
        raise
    except Exception:
        # If we fail to retrieve roles, proceed and let Keycloak enforce permissions.
        pass

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
        simplified.append(
            {"id": g.get("id"), "name": g.get("name"), "path": g.get("path")}
        )
    return {"realm": realm, "groups": simplified}


def create_group(session: Session, realm: str, token: str, name: str) -> dict:
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
        existing = session.get(UserGroup, group_id)
        if not existing:
            session.add(UserGroup(keycloak_id=group_id))
            session.commit()
    return {"realm": realm, "name": name}


def delete_group(session: Session, realm: str, token: str, group_id: str) -> None:
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
        simplified.append(
            {
                "id": m.get("id"),
                "username": m.get("username"),
                "email": m.get("email"),
                "firstName": m.get("firstName"),
                "lastName": m.get("lastName"),
            }
        )
    return {"realm": realm, "groupId": group_id, "members": simplified}
