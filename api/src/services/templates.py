import re
from datetime import datetime
from typing import Optional, List, Literal, Dict, Any

from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from src.core.mongo import get_templates_collection, serialize_document, to_object_id


PathLiteral = Literal["/templates/emails/", "/templates/pages/"]


def render_template(html: str, variables: Dict[str, Any]) -> str:
    """
    Render a template by substituting ${{ variable }} placeholders.
    
    Args:
        html: The raw HTML template.
        variables: Dictionary mapping variable names to values.
        
    Returns:
        The rendered HTML with variables substituted.
    """
    pattern = re.compile(r'\$\{\{\s*(\w+)\s*\}\}')
    
    def replace(match: re.Match) -> str:
        var_name = match.group(1)
        return str(variables.get(var_name, match.group(0)))
    
    return pattern.sub(replace, html)


class TemplateCreate(BaseModel):
    name: str = Field(..., description="Template display name")
    path: PathLiteral = Field(..., description="Content path to organize templates")
    subject: str = Field(..., description="Email subject line")
    category: Optional[str] = Field(None, description="Grouping, e.g. 'finance'")
    description: Optional[str] = Field(None, description="Short description for UI")
    html: str = Field(..., description="HTML content of the phishing template")


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    path: Optional[PathLiteral] = None
    subject: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    html: Optional[str] = None


class TemplateOut(TemplateCreate):
    id: str
    created_at: datetime
    updated_at: datetime


async def list_templates() -> List[TemplateOut]:
    collection = get_templates_collection()
    cursor = collection.find().sort("updated_at", -1)
    results: List[TemplateOut] = []
    async for doc in cursor:
        results.append(TemplateOut.model_validate(serialize_document(doc)))
    return results


async def get_template(template_id: str) -> TemplateOut:
    collection = get_templates_collection()
    try:
        oid = to_object_id(template_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid template id")

    doc = await collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return TemplateOut.model_validate(serialize_document(doc))


async def create_template(template: TemplateCreate) -> TemplateOut:
    collection = get_templates_collection()
    now = datetime.utcnow()
    payload = template.model_dump()
    payload["created_at"] = now
    payload["updated_at"] = now

    result = await collection.insert_one(payload)
    doc = await collection.find_one({"_id": result.inserted_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create template")
    return TemplateOut.model_validate(serialize_document(doc))


async def update_template(template_id: str, template: TemplateUpdate) -> TemplateOut:
    collection = get_templates_collection()
    try:
        oid = to_object_id(template_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid template id")

    payload = {k: v for k, v in template.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    payload["updated_at"] = datetime.utcnow()

    result = await collection.update_one({"_id": oid}, {"$set": payload})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    doc = await collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return TemplateOut.model_validate(serialize_document(doc))


async def delete_template(template_id: str) -> None:
    collection = get_templates_collection()
    try:
        oid = to_object_id(template_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid template id")

    result = await collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

