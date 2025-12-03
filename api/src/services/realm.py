from sqlmodel import Session, select
from fastapi import HTTPException
from src.models.realm import Realm, RealmCreate
from src.core.admin import Admin

def get_realm_by_domain(session: Session, domain: str) -> Realm | None:
    statement = select(Realm).where(Realm.domain == domain)
    return session.exec(statement).first()

def create_realm(session: Session, realm_in: RealmCreate) -> Realm:
    # Check if realm already exists in DB
    existing_realm = get_realm_by_domain(session, realm_in.domain)
    if existing_realm:
        raise HTTPException(status_code=400, detail="Domain already exists")

    # Create realm in Keycloak
    admin = Admin()
    response = admin.create_realm(
        realm_name=realm_in.name,
        admin_email=realm_in.adminEmail,
        user_count=realm_in.userCount,
        bundle=realm_in.bundle,
        features=realm_in.features
    )

    if response.status_code != 201:
        raise HTTPException(
            status_code=response.status_code, 
            detail=f"Failed to create realm in Keycloak: {response.text}"
        )

    # Persist to DB
    db_realm = Realm(
        name=realm_in.name,
        domain=realm_in.domain
    )
    session.add(db_realm)
    session.commit()
    session.refresh(db_realm)
    
    return db_realm
