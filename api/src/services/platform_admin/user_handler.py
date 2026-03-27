import secrets
from fastapi import HTTPException
from sqlmodel import Session, select

from src.models import (
    Realm,
    User,
    UserDTO,
    UserCreatedInRealmDTO,
    UserListInRealmDTO,
)
from src.services.platform_admin.base_handler import base_handler


class user_handler(base_handler):

    def __init__(self):
        super().__init__()

    def create_user_in_realm(
        self,
        session: Session,
        realm: str,
        username: str,
        name: str,
        email: str,
        role: str,
        group_id: str | None = None,
    ) -> UserCreatedInRealmDTO:
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

        if group_id and user_id:
            try:
                self.admin.add_user_to_group(realm, user_id, group_id)
            except Exception:
                pass

        if not user_id:
            raise HTTPException(
                status_code=500, detail="Failed to create user in Keycloak"
            )

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

        return UserCreatedInRealmDTO(
            realm=realm,
            username=username,
            status="created",
            temporary_password=temporary_password,
        )

    def list_users_in_realm(self, session: Session, realm: str) -> UserListInRealmDTO:
        """List users inside the specified Keycloak realm/tenant."""
        users = self.admin.list_users(realm)

        db_flags = {
            u.keycloak_id: u.is_org_manager for u in session.exec(select(User)).all()
        }
        parsed_users: list[UserDTO] = []

        for u in users:
            uid = u.get("id")
            if uid:
                is_org_manager = self._resolve_is_org_manager(
                    realm, u, db_flags.get(uid, False)
                )
                dto = self._to_user_dto(u, is_org_manager)
                parsed_users.append(dto)

                existing = session.get(User, uid)
                if existing:
                    existing.is_org_manager = is_org_manager
                    if dto.email:
                        existing.email = dto.email
                else:
                    session.add(
                        User(
                            keycloak_id=uid,
                            email=dto.email or "",
                            is_org_manager=is_org_manager,
                        )
                    )

        session.commit()
        total = self.admin.get_user_count(realm)
        org_managers = [u for u in parsed_users if u.is_org_manager]

        return UserListInRealmDTO(
            realm=realm,
            total=total,
            users=parsed_users,
            org_managers=org_managers,
        )

    def get_user_in_realm(self, realm: str, user_id: str) -> UserDTO:
        """Get a specific user in the realm by ID."""
        users = self.admin.list_users(realm)

        for u in users:
            if u.get("id") == user_id:
                return self._to_user_dto(
                    u,
                    self._resolve_is_org_manager(realm, u, False),
                )

        raise HTTPException(status_code=404, detail="User not found in realm")

    def delete_user_in_realm(self, realm: str, user_id: str, session: Session) -> None:
        """Delete a user from the realm."""
        if self._is_org_manager(realm, user_id) and self._count_org_managers(realm) <= 1:
            raise HTTPException(
                status_code=400, detail="Cannot delete the last org manager."
            )

        self.admin.delete_user(realm, user_id)
        self._delete_local_user(session, user_id)

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

    def _to_user_dto(self, user_data: dict, is_org_manager: bool) -> UserDTO:
        """Map Keycloak user payload to a typed DTO."""
        user_id = user_data.get("id")
        if not user_id:
            raise HTTPException(
                status_code=500, detail="Invalid user payload from Keycloak"
            )

        return UserDTO(
            id=user_id,
            username=user_data.get("username"),
            email=user_data.get("email"),
            firstName=user_data.get("firstName"),
            lastName=user_data.get("lastName"),
            email_verified=user_data.get("emailVerified"),
            enabled=user_data.get("enabled"),
            is_org_manager=is_org_manager,
        )

    def _resolve_is_org_manager(
        self, realm: str, user_data: dict, fallback: bool
    ) -> bool:
        """Resolve ORG_MANAGER role from inline roles first, then Keycloak lookup."""
        roles_inline = user_data.get("realmRoles") or []
        if isinstance(roles_inline, list) and any(
            str(role).upper() == "ORG_MANAGER" for role in roles_inline
        ):
            return True

        user_id = user_data.get("id")
        if not user_id:
            return fallback

        try:
            user_roles = self.admin.get_user_realm_roles(realm, user_id)
            return self._has_org_manager_role(user_roles)
        except Exception:
            return fallback

    def _has_org_manager_role(self, roles: list[dict] | list[str] | None) -> bool:
        return any(
            str((role.get("name", role) if isinstance(role, dict) else role)).upper()
            == "ORG_MANAGER"
            for role in (roles or [])
        )

    def _is_org_manager(self, realm: str, user_id: str) -> bool:
        return self._has_org_manager_role(
            self.admin.get_user_realm_roles(realm, user_id)
        )

    def _count_org_managers(self, realm: str) -> int:
        return sum(
            1
            for user in self.admin.list_users(realm)
            if self._resolve_is_org_manager(realm, user, False)
        )

    def _delete_local_user(self, session: Session, user_id: str) -> None:
        db_user = session.get(User, user_id)
        if db_user:
            session.delete(db_user)
            session.commit()


_instance: user_handler | None = None


def get_user_handler() -> user_handler:
    global _instance
    if _instance is None:
        _instance = user_handler()
    return _instance
