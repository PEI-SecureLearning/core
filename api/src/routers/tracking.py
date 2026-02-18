from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse, Response

from src.core.dependencies import SessionDep, OAuth2Scheme
from src.services.tracking import TrackingService
from src.services import templates as TemplateService

router = APIRouter()

service = TrackingService()


@router.post(
    "/track/sent",
    status_code=200,
    description="Email sent tracking endpoint - records successful email delivery from SMTP",
)
def track_sent(si: str, session: SessionDep):
    service.record_sent(si, session)


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
    "/track/open",
    status_code=200,
    description="Tracking pixel endpoint - records email opens",
    include_in_schema=False,
)
def track_open(si: str, session: SessionDep):
    """
    Called when email client loads the tracking pixel.
    Returns a 1x1 transparent GIF.
    """
    service.record_open(si, session)
    return Response(content=TRACKING_PIXEL, media_type="image/gif")


@router.get(
    "/track/click",
    status_code=200,
    description="Link click tracking endpoint - records clicks and redirects to landing page",
)
async def track_click(si: str, session: SessionDep):
    """
    Called when user clicks a tracked link in the email.
    Records the click and redirects to the landing page.
    """
    sending = service.record_click(si, session)

    template = await TemplateService.get_template(sending.campaign.landing_page_template.content_link)

    if template is None:
        raise HTTPException(status_code=404, detail="Page not found")

    # Render template with phish endpoint as redirect
    rendered_html = TemplateService.render_template(template.html, {
        "redirect": f"/track/phish?si={si}"
    })

    return Response(content=rendered_html, media_type="text/html")


@router.post(
    "/track/phish",
    status_code=200,
    description="Phishing event endpoint - records when user submits credentials on landing page",
)
def track_phish(si: str, session: SessionDep):
    """
    Called when user submits credentials on the landing page.
    Records the phishing event.
    """
    service.record_phish(si, session)
    return {"message": "Event recorded"}
