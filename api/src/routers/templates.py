from typing import List

from fastapi import APIRouter, status

from src.services import templates as template_service
from src.services.templates import TemplateCreate, TemplateUpdate, TemplateOut

router = APIRouter()


@router.get("/templates", response_model=List[TemplateOut])
async def list_templates() -> List[TemplateOut]:
    return await template_service.list_templates()


@router.get("/templates/{template_id}", response_model=TemplateOut)
async def get_template(template_id: str) -> TemplateOut:
    return await template_service.get_template(template_id)


@router.post("/templates", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(template: TemplateCreate) -> TemplateOut:
    return await template_service.create_template(template)


@router.put("/templates/{template_id}", response_model=TemplateOut)
async def update_template(template_id: str, template: TemplateUpdate) -> TemplateOut:
    return await template_service.update_template(template_id, template)


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(template_id: str) -> None:
    await template_service.delete_template(template_id)
