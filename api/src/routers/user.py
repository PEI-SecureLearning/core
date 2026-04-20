"""Authenticated user self-service routes."""

from fastapi import APIRouter

from src.core.dependencies import OAuth2Scheme
from src.models import CurrentUserProfileDTO
from src.services.platform_admin import get_platform_admin_service

router = APIRouter()
user_service = get_platform_admin_service()


@router.get("/users/me", response_model=CurrentUserProfileDTO)
def get_current_user_profile(token: OAuth2Scheme):
    """Return base profile data for the caller resolved through Keycloak."""
    return user_service.get_current_user_profile(token)
