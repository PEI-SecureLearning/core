"""Realm router package — combines all sub-routers into a single router."""

from fastapi import APIRouter

from src.routers.realm.realm_routes import router as realm_router
from src.routers.realm.user_routes import router as user_router
from src.routers.realm.group_routes import router as group_router
from src.routers.realm.logo_routes import router as logo_router

router = APIRouter()
router.include_router(realm_router)
router.include_router(user_router)
router.include_router(group_router)
router.include_router(logo_router)
