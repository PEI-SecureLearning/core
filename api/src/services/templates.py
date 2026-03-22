import re
from datetime import datetime
from typing import Optional, List, Literal, Dict, Any

from fastapi import HTTPException, status
from pydantic import BaseModel, Field, model_validator

from pymongo import ReturnDocument

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


class TemplateBase(BaseModel):
    name: str = Field(..., description="Template display name")
    path: PathLiteral = Field(..., description="Content path to organize templates")
    subject: Optional[str] = Field(None, description="Email subject line")
    category: Optional[str] = Field(None, description="Grouping, e.g. 'finance'")
    description: Optional[str] = Field(None, description="Short description for UI")
    html: str = Field(..., description="HTML content of the phishing template")

class TemplateCreate(TemplateBase):

    @model_validator(mode='after')
    def validate_template_requirements(self) -> 'TemplateCreate':
        if self.path == "/templates/emails/":
            if not self.subject or not self.subject.strip():
                raise ValueError("Email templates must have a subject line.")
            if "${{redirect}}" not in self.html or "${{pixel}}" not in self.html:
                raise ValueError("Email templates must include both ${{redirect}} and ${{pixel}}.")
        elif self.path == "/templates/pages/":
            if "${{redirect}}" not in self.html:
                raise ValueError("Landing page templates must include the ${{redirect}} variable.")
            self.subject = None
        return self


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    path: Optional[PathLiteral] = None
    subject: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    html: Optional[str] = None

    @model_validator(mode='after')
    def validate_template_requirements(self) -> 'TemplateUpdate':
        if self.path == "/templates/emails/":
            if self.subject is not None and not self.subject.strip():
                raise ValueError("Email templates must have a valid subject line.")
            if self.html is not None:
                if "${{redirect}}" not in self.html or "${{pixel}}" not in self.html:
                    raise ValueError("Email templates must include both ${{redirect}} and ${{pixel}}.")
        elif self.path == "/templates/pages/":
            if self.html is not None and "${{redirect}}" not in self.html:
                raise ValueError("Landing page templates must include the ${{redirect}} variable.")
            self.subject = None
        return self


class TemplateOut(TemplateBase):
    id: str
    org_id: str = "platform"
    created_at: datetime
    updated_at: datetime


async def list_templates(org_id: str, include_platform: bool = False) -> List[TemplateOut]:
    collection = get_templates_collection()
    
    platform_conds = [{"org_id": "platform"}, {"org_id": {"$exists": False}}, {"org_id": None}]
    
    if org_id == "platform":
        query = {"$or": platform_conds}
    else:
        query = {"org_id": org_id}
        if include_platform:
            query = {"$or": [{"org_id": org_id}] + platform_conds}
            
    cursor = collection.find(query).sort("updated_at", -1)
    results: List[TemplateOut] = []
    async for doc in cursor:
        doc_dict = serialize_document(doc)
        if "org_id" not in doc_dict or not doc_dict["org_id"]:
            doc_dict["org_id"] = "platform"
        results.append(TemplateOut.model_validate(doc_dict))
    return results


async def get_template(template_id: str, org_id: str, can_view_platform: bool = False) -> TemplateOut:
    collection = get_templates_collection()
    try:
        oid = to_object_id(template_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid template id")

    doc = await collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
        
    doc_dict = serialize_document(doc)
    doc_org_id = doc_dict.get("org_id") or "platform"
    doc_dict["org_id"] = doc_org_id
    
    if doc_org_id != org_id:
        if not (can_view_platform and doc_org_id == "platform"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this template")

    return TemplateOut.model_validate(doc_dict)


async def create_template(template: TemplateCreate, org_id: str) -> TemplateOut:
    collection = get_templates_collection()
    now = datetime.utcnow()
    payload = template.model_dump()
    payload["org_id"] = org_id
    payload["created_at"] = now
    payload["updated_at"] = now

    result = await collection.insert_one(payload)
    doc = await collection.find_one({"_id": result.inserted_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create template")
        
    doc_dict = serialize_document(doc)
    doc_dict["org_id"] = org_id
    return TemplateOut.model_validate(doc_dict)


async def update_template(template_id: str, template: TemplateUpdate, org_id: str) -> TemplateOut:
    collection = get_templates_collection()
    try:
        oid = to_object_id(template_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid template id")
        
    payload = {k: v for k, v in template.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    payload["updated_at"] = datetime.utcnow()

    filter_q: Dict[str, Any] = {"_id": oid}
    if org_id == "platform":
        filter_q["$or"] = [{"org_id": "platform"}, {"org_id": {"$exists": False}}, {"org_id": None}]
    else:
        filter_q["org_id"] = org_id

    doc = await collection.find_one_and_update(
        filter_q,
        {"$set": payload},
        return_document=ReturnDocument.AFTER
    )
    
    if not doc:
        # Fallback to check if it's 404 or 403
        existing = await collection.find_one({"_id": oid})
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this template")
        
    doc_dict = serialize_document(doc)
    doc_dict["org_id"] = doc_dict.get("org_id") or "platform"
    return TemplateOut.model_validate(doc_dict)


async def delete_template(template_id: str, org_id: str) -> None:
    collection = get_templates_collection()
    try:
        oid = to_object_id(template_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid template id")

    filter_q: Dict[str, Any] = {"_id": oid}
    if org_id == "platform":
        filter_q["$or"] = [{"org_id": "platform"}, {"org_id": {"$exists": False}}, {"org_id": None}]
    else:
        filter_q["org_id"] = org_id

    deleted = await collection.find_one_and_delete(filter_q)
    if not deleted:
        existing = await collection.find_one({"_id": oid})
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this template")

