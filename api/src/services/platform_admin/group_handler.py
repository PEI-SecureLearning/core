from fastapi import HTTPException
from sqlmodel import Session

from src.models import (
    UserGroup,
    KeycloakGroupDTO,
    UserDTO,
)
from src.services.platform_admin.base_handler import base_handler


class group_handler(base_handler):

    def __init__(self):
        super().__init__()

    def list_groups_in_realm(self, realm: str) -> list[KeycloakGroupDTO]:
        """List groups inside the specified Keycloak realm/tenant."""

        groups = self.admin.list_groups(realm)
        return [self._to_group_dto(g) for g in groups if g.get("id")]

    def create_group_in_realm(
        self, realm: str, group_name: str, session: Session
    ) -> KeycloakGroupDTO:
        """Create a group in the realm."""
        response = self.admin.create_group(session, realm, group_name)

        location = response.headers.get("Location")
        if not location:
            raise HTTPException(
                status_code=500, detail="Failed to create group in Keycloak"
            )
        group_id = location.rstrip("/").split("/")[-1]

        if not session.get(UserGroup, group_id):
            group = UserGroup(keycloak_id=group_id)
            session.add(group)
            session.commit()

        return KeycloakGroupDTO(id=group_id, name=group_name, path=None)

    def add_user_to_group_in_realm(
        self, realm: str, user_id: str, group_id: str
    ) -> None:
        """Add a user to a group in the realm."""

        self.admin.add_user_to_group(realm, user_id, group_id)

    def list_group_members_in_realm(self, realm: str, group_id: str) -> list[UserDTO]:
        """List members of a group in the realm."""
        members = self.admin.list_group_members(realm, group_id)
        return [self._to_group_member_user_dto(m) for m in members if m.get("id")]

    def delete_group_in_realm(
        self, realm: str, group_id: str, session: Session
    ) -> None:
        """Delete a group from the realm."""
        self.admin.delete_group(session, realm, group_id)

        db_group = session.get(UserGroup, group_id)

        if db_group:
            session.delete(db_group)
            session.commit()

    def update_group_in_realm(self, realm: str, group_id: str, group_name: str) -> None:
        """Update a group in the realm."""
        self.admin.update_group(realm, group_id, group_name)

    def remove_user_from_group_in_realm(
        self, realm: str, user_id: str, group_id: str
    ) -> None:
        """Remove a user from a group in the realm."""
        self.admin.remove_user_from_group(realm, user_id, group_id)

    def _to_group_dto(self, group_data: dict) -> KeycloakGroupDTO:
        """Map Keycloak group payload to a typed DTO."""
        group_id = group_data.get("id")
        if not group_id:
            raise HTTPException(
                status_code=500, detail="Invalid group payload from Keycloak"
            )

        return KeycloakGroupDTO(
            id=group_id,
            name=group_data.get("name"),
            path=group_data.get("path"),
        )

    def _to_group_member_user_dto(self, member_data: dict) -> UserDTO:
        """Map Keycloak group member payload to Keycloak user DTO."""
        member_id = member_data.get("id")
        if not member_id:
            raise HTTPException(
                status_code=500, detail="Invalid group member payload from Keycloak"
            )

        return UserDTO(
            id=member_id,
            username=member_data.get("username"),
            email=member_data.get("email") or "",
            firstName=member_data.get("firstName"),
            lastName=member_data.get("lastName"),
            role=(
                "ORG_MANAGER"
                if member_data.get("is_org_manager") == ["true"]
                else "USER"
            ),
            realm=member_data.get("realm", [""])[0],
        )


_instance: group_handler | None = None


def get_group_handler() -> group_handler:
    global _instance
    if _instance is None:
        _instance = group_handler()
    return _instance
