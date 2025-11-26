from fastapi import APIRouter, HTTPException, Depends
from core.admin import Admin
from core.security import valid_access_token

router = APIRouter()

admin = Admin()

@router.post("/admin/realm")
def create_realm(realm_name: str, dependencies=Depends(valid_access_token("Admin"))):
  admin.create_realm("test")
  return 