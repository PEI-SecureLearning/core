from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile, status

from src.core.dependencies import CurrentRealm
from src.services import content as content_service
from src.services.content import (
    ContentFolderCreate,
    ContentFolderOut,
    ContentPieceCreate,
    ContentPieceOut,
    ContentPieceUpdate,
)

router = APIRouter()


@router.get("/content")
async def list_content(_: CurrentRealm) -> list[ContentPieceOut]:
    return await content_service.list_content_pieces()


@router.get("/content/folders")
@router.get("/content/collections")
async def list_content_folders(_: CurrentRealm) -> list[ContentFolderOut]:
    return await content_service.list_content_folders()


@router.post("/content/folders", status_code=status.HTTP_201_CREATED)
@router.post("/content/collections", status_code=status.HTTP_201_CREATED)
async def create_content_folder(
    payload: ContentFolderCreate, _: CurrentRealm
) -> ContentFolderOut:
    return await content_service.create_content_folder(payload)


@router.delete("/content/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/content/collections/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content_folder(folder_id: str, _: CurrentRealm) -> None:
    await content_service.delete_content_folder(folder_id)


@router.get("/content/{content_piece_id}")
async def get_content(content_piece_id: str, _: CurrentRealm) -> ContentPieceOut:
    return await content_service.get_content_piece(content_piece_id)


@router.post("/content", status_code=status.HTTP_201_CREATED)
async def create_content(payload: ContentPieceCreate, _: CurrentRealm) -> ContentPieceOut:
    return await content_service.create_content_piece(payload)


@router.patch("/content/{content_piece_id}")
async def update_content(
    content_piece_id: str,
    payload: ContentPieceUpdate,
    _: CurrentRealm,
) -> ContentPieceOut:
    return await content_service.update_content_piece(content_piece_id, payload)


@router.post("/content/upload", status_code=status.HTTP_201_CREATED)
async def upload_content(
    _: CurrentRealm,
    title: Annotated[str, Form(...)],
    file: Annotated[UploadFile, File(...)],
    path: Annotated[str | None, Form()] = None,
    folder_id: Annotated[str | None, Form()] = None,
    collection_id: Annotated[str | None, Form()] = None,
    description: Annotated[str | None, Form()] = None,
    tags: Annotated[str | None, Form()] = None,
) -> ContentPieceOut:
    parsed_tags = [tag.strip() for tag in (tags or "").split(",") if tag.strip()]
    return await content_service.upload_content_piece(
        path=path,
        folder_id=folder_id or collection_id,
        title=title,
        file=file,
        description=description,
        tags=parsed_tags,
    )


@router.get("/content/{content_piece_id}/file")
async def download_content_file(content_piece_id: str, _: CurrentRealm):
    return await content_service.download_content_file(content_piece_id)


@router.get("/content/{content_piece_id}/file-url")
async def get_content_file_url(content_piece_id: str, _: CurrentRealm) -> dict[str, str | None]:
    return {"url": await content_service.get_content_file_url(content_piece_id)}


@router.delete("/content/{content_piece_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(content_piece_id: str, _: CurrentRealm) -> None:
    await content_service.delete_content_piece(content_piece_id)
