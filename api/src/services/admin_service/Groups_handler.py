from sqlmodel import Session, select

from src.models.user_group import UserGroup
from src.services.keycloak_client import get_keycloak_client


class Groups_handler:

    def list_groups(self, realm_name: str) -> list[dict]:
        """List groups in a realm."""
        token = self._get_admin_token()
        return get_keycloak_client().list_groups(realm_name, token)

    def create_group(self, session: Session, realm_name: str, name: str):
        """Create a group in a realm."""
        token = self._get_admin_token()
        r = get_keycloak_client().create_group(realm_name, token, name)
        location = r.headers.get("Location")
        if location:
            group_id = location.split("/")[-1]
            group = UserGroup(keycloak_id=group_id)
            session.add(group)
            session.commit()
        return r

    def delete_group(self, session: Session, realm_name: str, group_id: str):
        """Delete a group from a realm."""
        token = self._get_admin_token()
        get_keycloak_client().delete_group(realm_name, token, group_id)
        session.delete(
            session.exec(
                select(UserGroup).where(UserGroup.keycloak_id == group_id)
            ).one()
        )
        session.commit()

    def update_group(self, realm_name: str, group_id: str, name: str):
        """Update a group's name."""
        token = self._get_admin_token()
        get_keycloak_client().update_group(realm_name, token, group_id, name)

    def add_user_to_group(self, realm_name: str, user_id: str, group_id: str):
        """Add a user to a group."""
        token = self._get_admin_token()
        get_keycloak_client().add_user_to_group(realm_name, token, user_id, group_id)

    def remove_user_from_group(self, realm_name: str, user_id: str, group_id: str):
        """Remove a user from a group."""
        token = self._get_admin_token()
        get_keycloak_client().remove_user_from_group(realm_name, token, user_id, group_id)

    def list_group_members(self, realm_name: str, group_id: str) -> list[dict]:
        """List members of a group."""
        token = self._get_admin_token()
        return get_keycloak_client().list_group_members(realm_name, token, group_id)
