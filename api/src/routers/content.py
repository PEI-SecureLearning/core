from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile, status

from src.core.dependencies import CurrentRealm
from src.services import content as content_service
from src.services.content import ContentPieceCreate, ContentPieceOut

router = APIRouter()


@router.get("/content", response_model=list[ContentPieceOut])
async def list_content(_: CurrentRealm) -> list[ContentPieceOut]:
    return await content_service.list_content_pieces()


@router.get("/content/{content_piece_id}", response_model=ContentPieceOut)
async def get_content(content_piece_id: str, _: CurrentRealm) -> ContentPieceOut:
    return await content_service.get_content_piece(content_piece_id)


@router.post("/content", response_model=ContentPieceOut, status_code=status.HTTP_201_CREATED)
async def create_content(
    payload: ContentPieceCreate, _: CurrentRealm
) -> ContentPieceOut:
    return await content_service.create_content_piece(payload)


@router.post(
    "/content/upload",
    response_model=ContentPieceOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_content(
    _: CurrentRealm,
    path: Annotated[str, Form(...)],
    title: Annotated[str, Form(...)],
    file: Annotated[UploadFile, File(...)],
    description: Annotated[str | None, Form()] = None,
    tags: Annotated[str | None, Form()] = None,
) -> ContentPieceOut:
    parsed_tags = [tag.strip() for tag in (tags or "").split(",") if tag.strip()]
    return await content_service.upload_content_piece(
        path=path,
        title=title,
        file=file,
        description=description,
        tags=parsed_tags,
    )


@router.get("/content/{content_piece_id}/file")
async def download_content_file(content_piece_id: str, _: CurrentRealm):
    return await content_service.download_content_file(content_piece_id)


@router.delete("/content/{content_piece_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(content_piece_id: str, _: CurrentRealm) -> None:
    await content_service.delete_content_piece(content_piece_id)
