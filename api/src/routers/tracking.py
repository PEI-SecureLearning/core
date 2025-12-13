from fastapi import APIRouter
from fastapi.responses import RedirectResponse, Response

from src.core.deps import SessionDep
from src.services.tracking import TrackingService
from src.services import templates as TemplateService

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


@router.post(
    "/track/sent/{token}",
    description="Email sent tracking endpoint - records when email is sent",
    include_in_schema=False,
)
def track_sent(token: str, session: SessionDep):
    """
    Called when email is sent.
    Records the email sent event.
    """
    service.record_sent(token, session)
    return {"message": "Email sent recorded"}

@router.post(
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


@router.post(
    "/track/click/{token}",
    description="Link click tracking endpoint - records clicks and redirects to landing page",
)
def track_click(token: str, session: SessionDep):
    """
    Called when user clicks a tracked link in the email.
    Records the click and redirects to the landing page.
    """
    sending = service.record_click(token, session)

    template = TemplateService.get_template(sending.campaign.template_id)

    if template is None:
        raise HTTPException(status_code=404, detail="Page not found")

    return template.html


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
