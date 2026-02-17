from fastapi import HTTPException
from sqlmodel import Session

from src.models.user_group import UserGroup
from src.core.db import engine


class Group_handler:

    def list_groups(self, realm: str, token: str) -> dict:
        """List groups in the realm."""
        groups = self.kc.list_groups(realm, token)

        simplified = []
        for g in groups:
            simplified.append(
                {"id": g.get("id"), "name": g.get("name"), "path": g.get("path")}
            )
        return {"realm": realm, "groups": simplified}


    def create_group(self, session: Session, realm: str, token: str, name: str) -> dict:
        """Create a group in the realm."""
        response = self.kc.create_group(realm, token, name)

        location = response.headers.get("Location")
        group_id = None
        if location:
            group_id = location.rstrip("/").split("/")[-1]

        existing = session.get(UserGroup, group_id)
        if not existing:
            session.add(UserGroup(keycloak_id=group_id))
            session.commit()

        return {"realm": realm, "name": name}


    def delete_group(self, session: Session, realm: str, token: str, group_id: str) -> None:
        """Delete a group from the realm."""
        self.kc.delete_group(realm, token, group_id)

        db_group = session.get(UserGroup, group_id)
        if db_group:
            session.delete(db_group)
            session.commit()


    def update_group(self, realm: str, token: str, group_id: str, name: str) -> None:
        """Update a group's name."""
        self.kc.update_group(realm, token, group_id, name)


    def add_user_to_group(self, realm: str, token: str, user_id: str, group_id: str) -> None:
        """Add a user to a group."""
        self.kc.add_user_to_group(realm, token, user_id, group_id)


    def remove_user_from_group(self, realm: str, token: str, user_id: str, group_id: str) -> None:
        """Remove a user from a group."""
        self.kc.remove_user_from_group(realm, token, user_id, group_id)


    def list_group_members(self, realm: str, token: str, group_id: str) -> dict:
        """List members of a group."""
        members = self.kc.list_group_members(realm, token, group_id)

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
