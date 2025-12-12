from fastapi import APIRouter
from fastapi.responses import RedirectResponse, Response

from src.core.deps import SessionDep
from src.services.tracking import TrackingService

router = APIRouter()

service = TrackingService()



# 1x1 transparent GIF for tracking pixel
TRACKING_PIXEL = bytes(
    [
        0x47,
        0x49,
        0x46,
        0x38,
        0x39,
        0x61,
        0x01,
        0x00,
        0x01,
        0x00,
        0x80,
        0x00,
        0x00,
        0xFF,
        0xFF,
        0xFF,
        0x00,
        0x00,
        0x00,
        0x21,
        0xF9,
        0x04,
        0x01,
        0x00,
        0x00,
        0x00,
        0x00,
        0x2C,
        0x00,
        0x00,
        0x00,
        0x00,
        0x01,
        0x00,
        0x01,
        0x00,
        0x00,
        0x02,
        0x02,
        0x44,
        0x01,
        0x00,
        0x3B,
    ]
)


@router.get(
    "/track/open/{token}",
    description="Tracking pixel endpoint - records email opens",
    include_in_schema=False,
)
def track_open(token: str, session: SessionDep):
    """
    Called when email client loads the tracking pixel.
    Returns a 1x1 transparent GIF.
    """
    service.record_open(token, session)
    return Response(content=TRACKING_PIXEL, media_type="image/gif")


@router.get(
    "/track/click/{token}",
    description="Link click tracking endpoint - records clicks and redirects to landing page",
)
def track_click(token: str, session: SessionDep, redirect_url: str | None = None):
    """
    Called when user clicks a tracked link in the email.
    Records the click and redirects to the landing page.
    """
    sending = service.record_click(token, session)

    # Get landing page URL from the campaign
    landing_url = redirect_url
    if not landing_url and sending.campaign and sending.campaign.landing_page_template:
        landing_url = sending.campaign.landing_page_template.url

    if landing_url:
        return RedirectResponse(url=landing_url, status_code=302)

    return {"message": "Click recorded"}


@router.post(
    "/track/phish/{token}",
    description="Phishing event endpoint - records when user submits credentials on landing page",
)
def track_phish(token: str, session: SessionDep):
    """
    Called when user submits credentials on the landing page.
    Records the phishing event.
    """
    service.record_phish(token, session)
    return {"message": "Event recorded"}
