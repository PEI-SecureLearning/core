from fastapi import APIRouter, HTTPException, Depends
from src.services.admin import Admin
from src.core.security import valid_access_token
from src.core.deps import SessionDep

router = APIRouter()

admin = Admin()


@router.post("/admin/realm")
def create_realm(
    realm_name: str,
    session: SessionDep,
    dependencies=Depends(valid_access_token("Admin")),
):
    admin.create_realm("test", session)
    return {"message": "Realm created successfully"}
