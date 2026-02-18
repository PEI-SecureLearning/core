import secrets
from fastapi import HTTPException
from sqlmodel import Session

from src.models.user import User
from src.models.realm import Realm


class user_handler:

    def list_users(self, realm: str, token: str) -> dict:
        """List users in the realm."""
        users = self.kc.list_users(realm, token)

        simplified = []
        for u in users:
            uid = u.get("id")
            is_org_manager = False
            
            try:
                roles = self.kc.get_user_realm_roles(realm, token, uid) if uid else []
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
            self,
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
        username_clean = (username or "").strip()
        email_clean = (email or "").strip().lower()
        role_clean = self.is_valid_role(role)
        first_name = ""
        last_name = ""

        self.is_valid_username(username_clean)
        self.is_valid_email(realm, session, token, email_clean)

        temporary_password = secrets.token_urlsafe(12)

        if name:
            parts = name.strip().split(" ", 1)
            first_name = parts[0]
            if len(parts) > 1:
                last_name = parts[1]
            else:
                last_name = ""

        user_data = {
            "username": username_clean,
            "enabled": True,
            "email": email_clean,
            "firstName": first_name,
            "lastName": last_name,
            "credentials": [
                {"type": "password", "value": temporary_password, "temporary": True}
            ],
        }
        user_data = {k: v for k, v in user_data.items() if v not in (None, {}, [])}

        response = self.kc.create_user(realm, token, user_data)

        user_id = self.get_user_object(response)

        if group_id:
            self.kc.add_user_to_group(realm, token, user_id, group_id)


        role_repr = self.kc.get_realm_role(realm, token, role_clean)
        
        if role_repr:
            self.kc.assign_realm_roles(realm, token, user_id, [role_repr])
        
        if role_clean == "ORG_MANAGER":
            client = self.kc.get_client_by_client_id(realm, token, "realm-management")
            if client and client.get("id"):
                client_role = self.kc.get_client_role(realm, token, client["id"], "realm-admin")
                if client_role:
                    self.kc.assign_client_roles(realm, token, user_id, client["id"], [client_role])


        if realm and not session.get(Realm, realm):
            session.add(Realm(name=realm, domain=f"{realm}.local"))

        existing = session.get(User, user_id)
        if existing:
            existing.email = email_clean
            existing.is_org_manager = role_clean == "ORG_MANAGER"
        else:
            session.add(
                User(
                    keycloak_id=user_id,
                    email=email_clean,
                    is_org_manager=(role_clean == "ORG_MANAGER"),
                )
            )
        session.commit()

        return {
            "realm": realm,
            "username": username_clean,
            "status": "created" if response.status_code in (201, 204) else "exists",
            "temporary_password": temporary_password,
        }


    def get_user_object(self, response) -> str:
        if response.status_code == 409:
            raise HTTPException(status_code=409, detail="User already exists.")
        if response.status_code not in (201, 204):
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to create user in Keycloak.",
            )

        user_id = None
        location = response.headers.get("Location")
        if location:
            user_id = location.rstrip("/").split("/")[-1]

        if not user_id:
            raise HTTPException(status_code=400, detail="User ID not found.")

        return user_id

    def is_valid_role(self, role: str) -> str:

        allowed_roles = {"ORG_MANAGER", "CONTENT_MANAGER", "DEFAULT_USER"}
        role_clean = (role or "").strip().upper()

        if not role_clean:
            raise HTTPException(status_code=400, detail="Role is required.")
        if role_clean not in allowed_roles:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid role '{role_clean}'. Must be one of {', '.join(sorted(allowed_roles))}.",
            )
        return role_clean


    def is_valid_username(self, username: str) -> None:

        if len(username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
        if len(username) > 255:
            raise HTTPException(status_code=400, detail="Username must be 255 characters or fewer.")


    def is_valid_email(self, realm: str, session: Session, token: str, email: str) -> None:
        if not email:
            raise HTTPException(status_code=400, detail="Email is required.")
        
        kc_users = self.kc.list_users(realm, token)
        
        if any((u.get("email") or "").lower() == (email or "").lower() for u in kc_users):
            raise HTTPException(status_code=400, detail="Email already exists in this realm.")

        realm_domain = self.get_realm_domain(realm, session)

        if realm_domain:
            domain_suffix = f"@{realm_domain.lower()}"
            email_lower = (email or "").lower()

            if not email_lower.endswith(domain_suffix):
                raise HTTPException(
                    status_code=400,
                    detail=f"Email must belong to the '{realm_domain}' domain.",
                )


    def get_realm_domain(self, realm: str, session: Session) -> str:
        """Get the realm's domain."""
        try:
            db_realm = session.get(Realm, realm) if realm else None
            if db_realm and db_realm.domain:
                return db_realm.domain
        except Exception:
            return ""
        return ""


    def delete_user(self, realm: str, token: str, user_id: str, session: Session) -> None:
        """Delete a user from the realm."""
        
        self.kc.delete_user(realm, token, user_id)

        db_user = session.get(User, user_id)
        if db_user:
            session.delete(db_user)
            session.commit()
