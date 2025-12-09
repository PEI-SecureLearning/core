from fastapi import APIRouter


router = APIRouter()


@router.get("/opened")
def phishing(si: str):
    return {"message": "Phishing opened"}


@router.post("/clicked")
def phishing(si: str):
    return {"message": "Phishing link clicked"}


@router.post("/victimized")
def phishing(si: str):
    return {"message": "We have a victim"}