"""Org Manager router package — combines all sub-routers into a single router."""

from fastapi import APIRouter

from src.routers.org_manager.user_routes import router as user_router
from src.routers.org_manager.campaign_routes import router as campaign_router
from src.routers.org_manager.group_routes import router as group_router
from src.routers.org_manager.compliance_routes import router as compliance_router

router = APIRouter()
router.include_router(user_router)
router.include_router(campaign_router)
router.include_router(group_router)
router.include_router(compliance_router)
