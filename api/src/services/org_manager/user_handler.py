import secrets
from fastapi import HTTPException
from sqlmodel import Session
from src.models import Realm, User
from src.models.org_manager.schemas import UserDetailsDTO, UserDetailsGroupDTO
from src.services.compliance.token_helpers import decode_token_verified, get_realm_from_iss
from src.services.keycloak_admin import get_keycloak_admin


def validate_email_domain(email: str, realm_domain: str | None) -> None:
    if not realm_domain:
        return

    email_clean = (email or "").strip().lower()
    expected_domain = realm_domain.strip().lower()

    if "@" not in email_clean:
        raise HTTPException(
            status_code=400,
            detail=f'Email must be a valid address ending in "@{expected_domain}".',
        )

    email_domain = email_clean.split("@", 1)[1]
    if email_domain != expected_domain:
        raise HTTPException(
            status_code=400,
            detail=(
                f'Email domain "{email_domain}" does not match this organization. '
                f'Use an email ending in "@{expected_domain}".'
            ),
        )


class user_handler:

    def __init__(self):
        self.kc_admin = get_keycloak_admin()

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

    def list_user_details(self, realm: str, token: str, user_id: str) -> UserDetailsDTO:
        """Return details for a single user in the realm."""
        user = self.kc.get_user(realm, token, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        roles = self.kc.get_user_realm_roles(realm, token, user_id)
        is_org_manager = any(r.get("name") == "ORG_MANAGER" for r in roles)
        groups = self.kc.list_user_groups(realm, token, user_id)

        return UserDetailsDTO(
            id=user.get("id"),
            username=user.get("username"),
            email=user.get("email") or "",
            firstName=user.get("firstName"),
            lastName=user.get("lastName"),
            email_verified=user.get("emailVerified"),
            active=user.get("enabled"),
            role="ORG_MANAGER" if is_org_manager else "USER",
            realm=realm,
            groups=[
                UserDetailsGroupDTO(id=group.get("id"), name=group.get("name"))
                for group in groups
                if group.get("id")
            ],
        )

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
        role_clean = (role or "").strip().upper()
        name_clean = (name or "").strip()

        validate_email_domain(email_clean, self.get_realm_domain(realm, session))

        temporary_password = secrets.token_urlsafe(12)
        first_name, last_name = self._split_name(name_clean)
        user_data = self._build_user_data(
            username=username_clean,
            email=email_clean,
            first_name=first_name,
            last_name=last_name,
            temporary_password=temporary_password,
        )

        response = self._create_keycloak_user(realm, token, user_data)

        user_id = self.get_user_object(response)

        if group_id:
            self.kc.add_user_to_group(realm, token, user_id, group_id)

        self._assign_roles(realm, token, user_id, role_clean)
        self._ensure_realm_exists(session, realm)
        self._upsert_user_record(session, user_id, email_clean, role_clean)
        session.commit()

        return {
            "realm": realm,
            "username": username_clean,
            "status": "created" if response.status_code in (201, 204) else "exists",
            "temporary_password": temporary_password,
        }

    def _split_name(self, name: str) -> tuple[str, str]:
        if not name:
            return "", ""

        parts = name.strip().split(" ", 1)
        if len(parts) == 1:
            return parts[0], ""
        return parts[0], parts[1]

    def _build_user_data(
        self,
        username: str,
        email: str,
        first_name: str,
        last_name: str,
        temporary_password: str,
    ) -> dict:
        user_data = {
            "username": username,
            "enabled": True,
            "email": email,
            "firstName": first_name,
            "lastName": last_name,
            "credentials": [
                {"type": "password", "value": temporary_password, "temporary": True}
            ],
        }
        return {k: v for k, v in user_data.items() if v not in (None, {}, [])}

    def _create_keycloak_user(self, realm: str, token: str, user_data: dict):
        try:
            return self.kc.create_user(realm, token, user_data)
        except HTTPException as exc:
            if exc.status_code == 409:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "A user with this username or email already exists in "
                        "this organization."
                    ),
                )
            raise

    def _assign_roles(
        self, realm: str, token: str, user_id: str, role_clean: str
    ) -> None:
        role_repr = self.kc.get_realm_role(realm, token, role_clean)
        if role_repr:
            self.kc.assign_realm_roles(realm, token, user_id, [role_repr])

        if role_clean != "ORG_MANAGER":
            return

        client = self.kc.get_client_by_client_id(realm, token, "realm-management")
        client_id = client.get("id") if client else None
        if not client_id:
            return

        client_role = self.kc.get_client_role(realm, token, client_id, "realm-admin")
        if client_role:
            self.kc.assign_client_roles(realm, token, user_id, client_id, [client_role])

    def _ensure_realm_exists(self, session: Session, realm: str) -> None:
        if realm and not session.get(Realm, realm):
            session.add(Realm(name=realm, domain=f"{realm}.local"))

    def _upsert_user_record(
        self, session: Session, user_id: str, email: str, role_clean: str
    ) -> None:
        existing = session.get(User, user_id)
        if existing:
            existing.email = email
            existing.role = role_clean
            return

        session.add(
            User(
                keycloak_id=user_id,
                email=email,
                is_org_manager=(role_clean == "ORG_MANAGER"),
            )
        )

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

        allowed_roles = {"ORG_MANAGER", "DEFAULT_USER"}
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
            raise HTTPException(
                status_code=400, detail="Username must be at least 3 characters."
            )
        if len(username) > 40:
            raise HTTPException(
                status_code=400, detail="Username must be 40 characters or fewer."
            )

    def is_valid_email(
        self, realm: str, session: Session, token: str, email: str
    ) -> None:
        if not email:
            raise HTTPException(status_code=400, detail="Email is required.")

        kc_users = self.kc.list_users(realm, token)

        if any(
            (u.get("email") or "").lower() == (email or "").lower() for u in kc_users
        ):
            raise HTTPException(
                status_code=400, detail="Email already exists in this organization."
            )

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

        try:
            return self.kc_admin.get_domain_for_realm(realm) or ""
        except Exception:
            return ""

    def delete_user(
        self, realm: str, token: str, user_id: str, session: Session
    ) -> None:
        """Delete a user from the realm."""
        claims = decode_token_verified(token)
        current_realm = get_realm_from_iss(claims.get("iss"))
        current_user_id = claims.get("sub")

        if current_realm == realm and current_user_id == user_id:
            raise HTTPException(
                status_code=400,
                detail="You cannot delete your own account.",
            )

        self.kc.delete_user(realm, token, user_id)

        db_user = session.get(User, user_id)
        if db_user:
            session.delete(db_user)
            session.commit()

    def enroll_user(
        self,
        session: Session,
        user_id: str,
        course_ids: list[str],
        start_date=None,
        deadline=None,
        cert_valid_days=365,
    ) -> dict:
        """Assign courses to a user."""
        from datetime import datetime, timedelta
        from src.models import UserProgress, AssignmentStatus

        # Defaults
        if start_date is None:
            start_date = datetime.utcnow()
        if deadline is None:
            deadline = start_date + timedelta(days=30)

        enrolled_count = 0
        for cid in course_ids:
            existing = session.get(UserProgress, {"user_id": user_id, "course_id": cid})
            if not existing:
                up = UserProgress(
                    user_id=user_id,
                    course_id=cid,
                    start_date=start_date,
                    deadline=deadline,
                    cert_valid_days=cert_valid_days,
                    status=AssignmentStatus.SCHEDULED,
                    overdue=False,
                    expired=False,
                    progress_data={},
                    completed_sections=[],
                )
                session.add(up)
                enrolled_count += 1
            else:
                if (
                    existing.status != AssignmentStatus.COMPLETED
                    or existing.is_certified
                ):
                    existing.status = AssignmentStatus.SCHEDULED
                    existing.start_date = start_date
                    existing.deadline = deadline
                    existing.cert_valid_days = cert_valid_days
                    existing.overdue = False
                    existing.expired = False
                    if existing.status != AssignmentStatus.COMPLETED:
                        existing.progress_data = {}
                        existing.completed_sections = []
                    session.add(existing)
                    enrolled_count += 1

        if enrolled_count > 0:
            session.commit()

        return {"status": "success", "enrolled": enrolled_count}
