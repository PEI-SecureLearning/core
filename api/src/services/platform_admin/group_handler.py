from fastapi import HTTPException
from sqlmodel import Session

from src.models.user_group import UserGroup
from src.core.db import engine


class group_handler:

    def list_groups_in_realm(self, realm: str) -> dict:
        """List groups inside the specified Keycloak realm/tenant."""
        
        groups = self.admin.list_groups(realm)

        simplified = []
        for g in groups:
            simplified.append(
                {"id": g.get("id"), "name": g.get("name"), "path": g.get("path")}
            )
        return {"realm": realm, "groups": simplified}


    def create_group_in_realm(self, realm: str, group_name: str, session: Session) -> UserGroup:
        """Create a group in the realm."""
        group: UserGroup | None = None

        response = self.admin.create_group(session, realm, group_name)

        location = response.headers.get("Location")

        group_id = location.rstrip("/").split("/")[-1]

        existing_local = session.get(UserGroup, group_id)

        if existing_local:
            group = existing_local
        else:
            group = UserGroup(keycloak_id=group_id)
            session.add(group)
            session.commit()
            session.refresh(group)

        # Persist group locally
        try:
            location = response.headers.get("Location")
            group_id = location.rstrip("/").split("/")[-1] if location else None
            with Session(engine) as session:
                self._ensure_realm(session, realm, f"{realm}.local")
                if group_id and not session.get(UserGroup, group_id):
                    session.add(UserGroup(keycloak_id=group_id))
                    session.commit()
        except Exception:
            pass
        return group or UserGroup(keycloak_id=group_id if 'group_id' in locals() else "")


    def add_user_to_group_in_realm(self, realm: str, user_id: str, group_id: str) -> None:
        """Add a user to a group in the realm."""
        
        self.admin.add_user_to_group(realm, user_id, group_id)
 

    def list_group_members_in_realm(self, realm: str, group_id: str) -> dict:
        """List members of a group in the realm."""
        members = self.admin.list_group_members(realm, group_id)

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


    def delete_group_in_realm(self, realm: str, group_id: str, session: Session) -> None:
        """Delete a group from the realm."""
        self.admin.delete_group(session, realm, group_id)

        db_group = session.get(UserGroup, group_id)

        if db_group:
            session.delete(db_group)
            session.commit()


    def update_group_in_realm(self, realm: str, group_id: str, group_name: str) -> None:
        """Update a group in the realm."""
        self.admin.update_group(realm, group_id, group_name)


    def remove_user_from_group_in_realm(self, realm: str, user_id: str, group_id: str) -> None:
        """Remove a user from a group in the realm."""
        self.admin.remove_user_from_group(realm, user_id, group_id)

