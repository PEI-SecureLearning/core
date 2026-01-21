import secrets
import jwt
from datetime import datetime, timezone
from fastapi import HTTPException
from bson import Binary, ObjectId
from sqlmodel import Session, select
from src.core.deps import SessionDep
from src.models.realm import Realm, RealmCreate
from src.core.admin import Admin
from src.models.user import User
from src.core.db import engine
from src.core.mongo import get_tenant_logos_collection
from src.models.user_group import UserGroup


# Singleton admin instance
_admin = Admin()


def get_admin() -> Admin:
    """Get the Admin instance for Keycloak operations."""
    return _admin


def realm_from_token(access_token: str) -> str | None:
    """Parse realm from token issuer without verifying signature (Keycloak managed)."""
    try:
        decoded = jwt.decode(
            access_token, options={"verify_signature": False, "verify_aud": False}
        )
        iss = decoded.get("iss")
        if iss:
            print(f"[realm:realm_from_token] access token iss={iss}")
        if not iss:
            return None
        parts = iss.split("/realms/")
        return parts[1] if len(parts) > 1 else None
    except Exception:
        return None


def validate_realm_access(token: str, realm: str) -> None:
    """Validate that the token's realm matches the requested realm."""
    token_realm = realm_from_token(token)
    if token_realm and token_realm != realm:
        raise HTTPException(
            status_code=403,
            detail="Realm mismatch: token realm does not match requested realm.",
        )


def domain_from_token_or_realm(access_token: str) -> str | None:
    """Get tenant-domain from token or realm info."""
    realm_name = realm_from_token(access_token)
    if not realm_name:
        return None
    domain = _admin.get_domain_for_realm(realm_name)
    return domain


def list_realms() -> dict:
    """List all tenant realms from Keycloak (excluding master and platform)."""
    realms = _admin.list_realms(exclude_system=True)
    return {"realms": realms}


def delete_realm_from_keycloak(realm_name: str, session: Session) -> None:
    """Delete a realm from Keycloak."""
    _admin.delete_realm(session, realm_name)
    # Remove realm and related users locally
    with Session(engine) as session:
        # Delete users belonging to this realm (best-effort: based on Keycloak listing before deletion)
        try:
            kc_users = _admin.list_users(realm_name)
            kc_ids = [u.get("id") for u in kc_users if u.get("id")]
        except Exception:
            kc_ids = []
        if kc_ids:
            for uid in kc_ids:
                user = session.get(User, uid)
                if user:
                    session.delete(user)
        # Delete realm row
        db_realm = session.get(Realm, realm_name)
        if db_realm:
            session.delete(db_realm)
        session.commit()


def get_platform_logs(max_results: int = 100) -> dict:
    """Get platform logs/events from all tenant realms."""
    events = _admin.get_events(max_results)
    return {"logs": events}


# ============ Realm Operations ============


def get_realm_by_domain(session: Session, domain: str) -> Realm | None:
    statement = select(Realm).where(Realm.domain == domain)
    return session.exec(statement).first()


def find_realm_by_domain(domain: str) -> str | None:
    """Find realm name by domain using Keycloak admin API."""
    return _admin.find_realm_by_domain(domain)


def create_realm_in_keycloak(realm: RealmCreate, session: Session) -> RealmCreate:
    """Create a realm in Keycloak."""
    try:
        response = _admin.create_realm(
            session,
            realm_name=realm.name,
            admin_email=realm.adminEmail,
            domain=realm.domain,
            features=realm.features,
        )
        if response.status_code != 201:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to create realm in Keycloak: {response.text}",
            )

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Failed to communicate with Keycloak: {str(e)}"
        )

    # Persist realm in DB so it's available before any user creation
    with Session(engine) as session:
        _ensure_realm(session, realm.name, realm.domain)
        # Upsert default users created by the realm template (e.g., Org_manager, User)
        try:
            kc_users = _admin.list_users(realm.name)
            for u in kc_users:
                uid = u.get("id")
                if not uid:
                    continue
                roles = u.get("realmRoles") or []
                if not roles:
                    try:
                        roles = _admin.get_user_realm_roles(realm.name, uid)
                    except Exception:
                        roles = []
                is_org_manager = (
                    any(str(r.get("name", r)).upper() == "ORG_MANAGER" for r in roles)
                    if isinstance(roles, list)
                    else False
                )
                _upsert_user(session, uid, u.get("email"), is_org_manager=is_org_manager)
            session.commit()
        except Exception:
            pass

    return realm


def create_realm(session: Session, realm_in: RealmCreate) -> Realm:
    """Create realm in both Keycloak and database."""
    # Check if realm already exists in DB
    existing_realm = get_realm_by_domain(session, realm_in.domain)
    if existing_realm:
        raise HTTPException(status_code=400, detail="Domain already exists")

    # Create realm in Keycloak
    response = _admin.create_realm(
        session,
        realm_name=realm_in.name,
        admin_email=realm_in.adminEmail,
        features=realm_in.features,
        domain=realm_in.domain,
    )

    if response.status_code != 201:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to create realm in Keycloak: {response.text}",
        )

    # Persist to DB
    db_realm = session.get(Realm, realm_in.name)
    if not db_realm:
        db_realm = Realm(name=realm_in.name, domain=realm_in.domain)
        session.add(db_realm)
        session.commit()
        session.refresh(db_realm)

    # Ensure platform/admin users from Keycloak exist locally for FK usage
    try:
        kc_users = _admin.list_users(realm_in.name)
        for u in kc_users:
            uid = u.get("id")
            if not uid:
                continue
            roles = u.get("realmRoles") or []
            if not roles:
                try:
                    roles = _admin.get_user_realm_roles(realm_in.name, uid)
                except Exception:
                    roles = []
            is_org_manager = (
                any(str((r.get("name", r) if isinstance(r, dict) else r)).upper() == "ORG_MANAGER" for r in roles)
                if isinstance(roles, list)
                else False
            )
            existing_user = session.get(User, uid)
            if existing_user:
                if u.get("email"):
                    existing_user.email = u["email"]
                existing_user.is_org_manager = is_org_manager
            else:
                session.add(
                    User(
                        keycloak_id=uid,
                        email=u.get("email") or "",
                        is_org_manager=is_org_manager,
                    )
                )
        session.commit()
    except Exception:
        pass

    return db_realm


# ============ User Operations ============


def create_user_in_realm(
    session: Session,
    realm: str,
    username: str,
    name: str,
    email: str,
    role: str,
    group_id: str | None = None,
) -> dict:
    """Create a new user inside the specified Keycloak realm/tenant."""
    # Generate a one-time password for first login.
    temporary_password = secrets.token_urlsafe(12)

    try:
        response = _admin.add_user(
            session,
            realm,
            username,
            temporary_password,
            full_name=name,
            email=email,
            role=role,
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Failed to communicate with Keycloak: {str(e)}"
        )

    if response.status_code not in (201, 204):
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to create user in Keycloak: {response.text}",
        )

    # Optionally add user to a group if provided
    user_id = None
    location = response.headers.get("Location")
    if location:
        user_id = location.rstrip("/").split("/")[-1]

        user = User(keycloak_id=user_id, email=email, is_org_manager=(role or "").strip().upper() == "ORG_MANAGER")
        session.add(user)
        session.commit()
        session.refresh(user)

    if group_id and user_id:
        try:
            _admin.add_user_to_group(realm, user_id, group_id)
        except Exception:
            # Ignore group assignment errors for now but log detail
            pass

    # Persist the user locally (upsert by keycloak_id). If Location header missing, look up by username/email.
    if not user_id:
        try:
            kc_users = _admin.list_users(realm)
            match = next(
                (
                    u
                    for u in kc_users
                    if u.get("username") == username or u.get("email") == email
                ),
                None,
            )
            user_id = match.get("id") if match else None
        except Exception:
            user_id = None

    if user_id:
        with Session(engine) as session:
            _ensure_realm(session, realm, f"{realm}.local")
            existing = session.get(User, user_id)
            if existing:
                existing.email = email
                existing.is_org_manager = (role or "").strip().upper() == "ORG_MANAGER"
            else:
                session.add(
                    User(
                        keycloak_id=user_id,
                        email=email,
                        is_org_manager=(role or "").strip().upper() == "ORG_MANAGER",
                    )
                )
            session.commit()

    return {
        "realm": realm,
        "username": username,
        "status": "created",
        "temporary_password": temporary_password,
    }


def list_users_in_realm(realm: str) -> dict:
    """List users inside the specified Keycloak realm/tenant."""
    try:
        users = _admin.list_users(realm)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Failed to communicate with Keycloak: {str(e)}"
        )
    simplified = []
    org_managers = []
    # Load org_manager flag from DB, but also respect inline realmRoles and persist them back.
    db_flags: dict[str, bool] = {}
    with Session(engine) as session:
        db_flags = {u.keycloak_id: u.is_org_manager for u in session.exec(select(User)).all()}

    for u in users:
        uid = u.get("id")
        # Start from DB flag
        is_org_manager = db_flags.get(uid, False) if uid else False
        # Inline roles in list_users payload
        roles_inline = u.get("realmRoles") or []
        if isinstance(roles_inline, list) and any(str(r).upper() == "ORG_MANAGER" for r in roles_inline):
            is_org_manager = True
        # Fallback: explicitly ask Keycloak for realm roles when we still don't know
        if not is_org_manager and uid:
            try:
                user_roles = _admin.get_user_realm_roles(realm, uid)
                if any(str((r.get("name", r) if isinstance(r, dict) else r)).upper() == "ORG_MANAGER" for r in user_roles):
                    is_org_manager = True
            except Exception:
                pass
        record = {
            "id": uid,
            "username": u.get("username"),
            "email": u.get("email"),
            "firstName": u.get("firstName"),
            "lastName": u.get("lastName"),
            "email_verified": u.get("emailVerified"),
            "enabled": u.get("enabled"),
            "is_org_manager": is_org_manager,
        }
        simplified.append(record)
        if is_org_manager:
            org_managers.append(record)

        # Persist the flag for consistency
        if uid:
            with Session(engine) as session:
                existing = session.get(User, uid)
                if existing:
                    existing.is_org_manager = is_org_manager
                    if record["email"]:
                        existing.email = record["email"]
                else:
                    session.add(User(keycloak_id=uid, email=record["email"] or "", is_org_manager=is_org_manager))
                session.commit()
    try:
        total = _admin.get_user_count(realm)
    except Exception:
        total = len(simplified)
    print(f"[realm:list_users_in_realm] users={simplified}")
    return {"realm": realm, "total": total, "users": simplified, "org_managers": org_managers}


def get_user_in_realm(realm: str, user_id: str) -> dict:
    """Get a specific user in the realm by ID."""
    try:
        users = _admin.list_users(realm)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Failed to communicate with Keycloak: {str(e)}"
        )

    for u in users:
        if u.get("id") == user_id:
            return {
                "id": u.get("id"),
                "username": u.get("username"),
                "email": u.get("email"),
                "firstName": u.get("firstName"),
                "lastName": u.get("lastName"),
                "enabled": u.get("enabled"),
            }

    raise HTTPException(status_code=404, detail="User not found in realm")


def delete_user_in_realm(realm: str, user_id: str, session: Session) -> None:
    """Delete a user from the realm."""
    # Prevent deleting the last org manager
    try:
        roles = _admin.get_user_realm_roles(realm, user_id)
    except Exception:
        roles = []
    is_target_org_manager = any(
        str((r.get("name", r) if isinstance(r, dict) else r)).upper() == "ORG_MANAGER"
        for r in (roles or [])
    )
    if is_target_org_manager:
        try:
            kc_users = _admin.list_users(realm)
        except Exception:
            kc_users = []
        org_count = 0
        for u in kc_users:
            uid = u.get("id")
            if not uid:
                continue
            inline = u.get("realmRoles") or []
            has_role = any(str(r).upper() == "ORG_MANAGER" for r in inline) if isinstance(inline, list) else False
            if not has_role:
                try:
                    user_roles = _admin.get_user_realm_roles(realm, uid)
                    has_role = any(
                        str((r.get("name", r) if isinstance(r, dict) else r)).upper() == "ORG_MANAGER"
                        for r in (user_roles or [])
                    )
                except Exception:
                    has_role = False
            if has_role:
                org_count += 1
        if org_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last org manager.")

    try:
        _admin.delete_user(session, realm, user_id)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Failed to delete user in Keycloak: {str(e)}"
        )
    # Remove from local DB
    with Session(engine) as session:
        db_user = session.get(User, user_id)
        if db_user:
            session.delete(db_user)
            session.commit()


# ============ Group Operations ============


def list_groups_in_realm(realm: str) -> dict:
    """List groups inside the specified Keycloak realm/tenant."""
    try:
        groups = _admin.list_groups(realm)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Failed to communicate with Keycloak: {str(e)}"
        )

    simplified = []
    for g in groups:
        simplified.append(
            {"id": g.get("id"), "name": g.get("name"), "path": g.get("path")}
        )
    return {"realm": realm, "groups": simplified}


def create_group_in_realm(realm: str, group_name: str, session: Session) -> UserGroup:
    """Create a group in the realm."""
    group: UserGroup | None = None
    try:
        response = _admin.create_group(session, realm, group_name)
        if response.status_code not in (201, 204):
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to create group in Keycloak",
            )
        location = response.headers.get("Location")
        if not location:
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve group location from Keycloak",
            )
        group_id = location.rstrip("/").split("/")[-1]
        # Upsert locally to avoid duplicate key errors
        existing_local = session.get(UserGroup, group_id)
        if existing_local:
            group = existing_local
        else:
            group = UserGroup(keycloak_id=group_id)
            session.add(group)
            session.commit()
            session.refresh(group)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Failed to communicate with Keycloak: {str(e)}"
        )
    # Persist group locally
    try:
        location = response.headers.get("Location")
        group_id = location.rstrip("/").split("/")[-1] if location else None
        with Session(engine) as session:
            _ensure_realm(session, realm, f"{realm}.local")
            if group_id and not session.get(UserGroup, group_id):
                session.add(UserGroup(keycloak_id=group_id))
                session.commit()
    except Exception:
        pass
    return group or UserGroup(keycloak_id=group_id if 'group_id' in locals() else "")


def add_user_to_group_in_realm(realm: str, user_id: str, group_id: str) -> None:
    """Add a user to a group in the realm."""
    try:
        _admin.add_user_to_group(realm, user_id, group_id)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Failed to add user to group: {str(e)}"
        )


def list_group_members_in_realm(realm: str, group_id: str) -> dict:
    """List members of a group in the realm."""
    try:
        members = _admin.list_group_members(realm, group_id)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch group members: {str(e)}"
        )

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


def delete_group_in_realm(realm: str, group_id: str, session: Session) -> None:
    """Delete a group from the realm."""
    try:
        _admin.delete_group(session, realm, group_id)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to delete group: {str(e)}")
    with Session(engine) as session:
        db_group = session.get(UserGroup, group_id)
        if db_group:
            session.delete(db_group)
            session.commit()


def update_group_in_realm(realm: str, group_id: str, group_name: str) -> None:
    """Update a group in the realm."""
    try:
        _admin.update_group(realm, group_id, group_name)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to update group: {str(e)}")


def remove_user_from_group_in_realm(realm: str, user_id: str, group_id: str) -> None:
    """Remove a user from a group in the realm."""
    try:
        _admin.remove_user_from_group(realm, user_id, group_id)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Failed to remove user from group: {str(e)}"
        )


def _ensure_realm(session: Session, realm_name: str, domain: str | None = None) -> None:
    if session.get(Realm, realm_name):
        return
    session.add(Realm(name=realm_name, domain=domain or f"{realm_name}.local"))
    session.commit()


def _upsert_user(session: Session, keycloak_id: str, email: str | None, is_org_manager: bool = False) -> None:
    existing = session.get(User, keycloak_id)
    if existing:
        if email:
            existing.email = email
        existing.is_org_manager = is_org_manager
    else:
        session.add(User(keycloak_id=keycloak_id, email=email or "", is_org_manager=is_org_manager))


def get_realm_info(realm_name: str) -> dict | None:
    """Return realm metadata plus users for admin/management views."""
    try:
        realm = _admin.get_realm(realm_name)
        if not realm:
            return None

        features = _admin.get_realm_features(realm_name)
        domain = _admin.get_domain_for_realm(realm_name)
        logo_updated_at = _get_realm_attribute(realm_name, "tenant-logo-updated-at")

        try:
            users = list_users_in_realm(realm_name).get("users", [])
        except Exception:
            users = []

        return {
            "realm": realm.get("realm") or realm_name,
            "displayName": realm.get("displayName") or realm_name,
            "enabled": realm.get("enabled", True),
            "domain": domain,
            "features": features,
            "logoUpdatedAt": logo_updated_at,
            "user_count": len(users),
            "users": users,
        }
    except Exception:
        return None


def _get_realm_attribute(realm_name: str, key: str) -> str | None:
    realm_info = _admin.get_realm(realm_name)
    attrs = realm_info.get("attributes") or {}
    if not isinstance(attrs, dict):
        return None
    raw = attrs.get(key)
    if isinstance(raw, list) and raw:
        return raw[0]
    if isinstance(raw, str):
        return raw
    return None


async def upsert_tenant_logo(
    realm_name: str,
    data: bytes,
    content_type: str,
    filename: str | None = None,
) -> str:
    collection = get_tenant_logos_collection()
    now = datetime.now(timezone.utc)
    payload = {
        "realm": realm_name,
        "filename": filename,
        "content_type": content_type,
        "size": len(data),
        "data": Binary(data),
        "updated_at": now,
    }
    await collection.update_one(
        {"realm": realm_name},
        {
            "$set": payload,
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )
    doc = await collection.find_one({"realm": realm_name})
    if not doc or not doc.get("_id"):
        raise HTTPException(status_code=500, detail="Failed to store tenant logo")

    logo_id = str(doc["_id"])
    _admin.update_realm_attributes(
        realm_name,
        {
            "tenant-logo-id": logo_id,
            "tenant-logo-updated-at": now.isoformat(),
        },
    )
    return logo_id


async def get_tenant_logo(realm_name: str) -> dict | None:
    collection = get_tenant_logos_collection()
    logo_id = _get_realm_attribute(realm_name, "tenant-logo-id")

    doc = None
    if logo_id:
        try:
            doc = await collection.find_one({"_id": ObjectId(logo_id)})
        except Exception:
            doc = None

    if not doc:
        doc = await collection.find_one({"realm": realm_name})

    return doc


def update_user_role_in_realm(
    realm: str, user_id: str, new_role: str
) -> None:
    """Update a user's role in the realm."""
    try:
        # First, remove all existing realm roles
        existing_roles = _admin.get_user_realm_roles(realm, user_id)
        for r in existing_roles:
            role_name = r.get("name") if isinstance(r, dict) else str(r)
            _admin.remove_realm_role_from_user(realm, user_id, role_name)

        # Then, assign the new role
        if new_role:
            _admin.assign_realm_role_to_user(realm, user_id, new_role)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Failed to update user role: {str(e)}"
        )
