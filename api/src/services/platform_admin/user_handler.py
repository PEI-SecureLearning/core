import secrets
from fastapi import HTTPException
from sqlmodel import Session, select

from src.models.user import User
from src.models.realm import Realm
from src.core.db import engine


class User_handler:

    def create_user_in_realm(
        self,
        session: Session,
        realm: str,
        username: str,
        name: str,
        email: str,
        role: str,
        group_id: str | None = None,
    ) -> dict:
        """Create a new user inside the specified Keycloak realm/tenant."""
        temporary_password = secrets.token_urlsafe(12)

        response = self.admin.add_user(
            session,
            realm,
            username,
            temporary_password,
            full_name=name,
            email=email,
            role=role,
        )


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
                self.admin.add_user_to_group(realm, user_id, group_id)
            except Exception:
                pass

        if not user_id:
            raise HTTPException(status_code=500, detail="Failed to create user in Keycloak")

        self._ensure_realm(session, realm, f"{realm}.local")
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


    def list_users_in_realm(self, session: Session, realm: str) -> dict:
        """List users inside the specified Keycloak realm/tenant."""
        users = self.admin.list_users(realm)
        
        simplified = []
        org_managers = []
        db_flags: dict[str, bool] = {}

        
        db_flags = {u.keycloak_id: u.is_org_manager for u in session.exec(select(User)).all()}

        for u in users:
            uid = u.get("id")
            is_org_manager = db_flags.get(uid, False) if uid else False
            roles_inline = u.get("realmRoles") or []
            if isinstance(roles_inline, list) and any(str(r).upper() == "ORG_MANAGER" for r in roles_inline):
                is_org_manager = True
            if not is_org_manager and uid:
                try:
                    user_roles = self.admin.get_user_realm_roles(realm, uid)
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
        
        total = self.admin.get_user_count(realm)

        return {"realm": realm, "total": total, "users": simplified, "org_managers": org_managers}


    def get_user_in_realm(self, realm: str, user_id: str) -> dict:
        """Get a specific user in the realm by ID."""
        users = self.admin.list_users(realm)

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


    def delete_user_in_realm(self, realm: str, user_id: str, session: Session) -> None:
        """Delete a user from the realm."""


        roles = self.admin.get_user_realm_roles(realm, user_id)
 
        is_target_org_manager = any(
            str((r.get("name", r) if isinstance(r, dict) else r)).upper() == "ORG_MANAGER"
            for r in (roles or [])
        )
        if is_target_org_manager:
            
            kc_users = self.admin.list_users(realm)
     
            org_count = 0
            for u in kc_users:
                uid = u.get("id")
                if not uid:
                    continue
                inline = u.get("realmRoles") or []
                has_role = any(str(r).upper() == "ORG_MANAGER" for r in inline) if isinstance(inline, list) else False
                if not has_role:
                    try:
                        user_roles = self.admin.get_user_realm_roles(realm, uid)
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

        self.admin.delete_user(session, realm, user_id)
     
        db_user = session.get(User, user_id)
        if db_user:
            session.delete(db_user)
            session.commit()


    def update_user_role_in_realm(
        self, realm: str, user_id: str, new_role: str
    ) -> None:
        """Update a user's role in the realm."""
        
        existing_roles = self.admin.get_user_realm_roles(realm, user_id)
        for r in existing_roles:
            role_name = r.get("name") if isinstance(r, dict) else str(r)
            self.admin.remove_realm_role_from_user(realm, user_id, role_name)

        if new_role:
            self.admin.assign_realm_role_to_user(realm, user_id, new_role)
