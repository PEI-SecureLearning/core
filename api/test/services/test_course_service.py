import os

os.environ.update(
    {
        "POSTGRES_SERVER": "localhost",
        "POSTGRES_USER": "testuser",
        "POSTGRES_PASSWORD": "testpassword",
        "RABBITMQ_HOST": "localhost",
        "RABBITMQ_USER": "guest",
        "RABBITMQ_PASS": "guest",
        "RABBITMQ_QUEUE": "email_queue",
    }
)

import pytest
from datetime import datetime
from unittest.mock import MagicMock, patch, AsyncMock
from src.services.courses import (
    create_course, 
    list_courses, 
    list_enrolled_courses,
    get_course,
    update_course,
    patch_course,
    delete_course
)
from src.models import (
    CourseCreate,
    CourseUpdate,
    CoursePatch,
    CourseDifficulty,
)
from bson import ObjectId
from fastapi import HTTPException

@pytest.mark.anyio
async def test_create_course_success():
    # Arrange
    payload = CourseCreate(
        title="Test Course",
        description="Test Description",
        category="Test Category",
        difficulty=CourseDifficulty.EASY,
        expected_time="1 hour",
        modules=["65f1a2b3c4d5e6f7a8b9c0d1"]
    )
    created_by = "user-123"
    
    mock_id = ObjectId()
    mock_result = MagicMock()
    mock_result.inserted_id = mock_id
    
    # Mock MongoDB collection
    mock_col = AsyncMock()
    mock_col.insert_one.return_value = mock_result
    
    with patch("src.services.courses.get_courses_collection", return_value=mock_col):
        # Act
        result = await create_course(payload, created_by)
        
        # Assert
        assert result.title == payload.title
        assert result.created_by == created_by
        assert result.id == str(mock_id)
        assert len(result.modules) == 1
        assert result.created_at is not None
        assert result.updated_at is not None
        
        # Verify collection call
        mock_col.insert_one.assert_called_once()
        sent_data = mock_col.insert_one.call_args[0][0]
        assert sent_data["title"] == payload.title
        assert sent_data["created_by"] == created_by
        assert "created_at" in sent_data
        assert "updated_at" in sent_data

class MockCursor:
    def __init__(self, items):
        self.items = items
    def sort(self, *args, **kwargs): return self
    def skip(self, *args, **kwargs): return self
    def limit(self, *args, **kwargs): return self
    async def __aiter__(self):
        for item in self.items:
            yield item

@pytest.mark.anyio
async def test_list_courses():
    # Arrange
    mock_items = [
        {"_id": ObjectId(), "title": "C1", "description": "D1", "category": "Cat1", "difficulty": "Easy", "expected_time": "1h", "modules": [], "created_at": datetime.now(), "updated_at": datetime.now()},
        {"_id": ObjectId(), "title": "C2", "description": "D2", "category": "Cat2", "difficulty": "Hard", "expected_time": "2h", "modules": [], "created_at": datetime.now(), "updated_at": datetime.now()},
    ]
    
    # Mock collection
    mock_col = MagicMock()
    mock_col.count_documents = AsyncMock(return_value=2)
    mock_col.find.return_value = MockCursor(mock_items)
    
    with patch("src.services.courses.get_courses_collection", return_value=mock_col):
        # Act
        res = await list_courses(search="C", category="Cat1", difficulty="Easy")
        
        # Assert
        assert res.total == 2
        assert len(res.items) == 2
        assert res.items[0].title == "C1"

@pytest.mark.anyio
async def test_list_enrolled_courses():
    oid = ObjectId()
    mock_items = [{"_id": oid, "title": "C", "description": "D", "category": "Cat", "difficulty": "Easy", "expected_time": "1h", "modules": [], "created_at": datetime.now(), "updated_at": datetime.now()}]
    
    mock_col = MagicMock()
    mock_col.find.return_value = MockCursor(mock_items)
    
    with patch("src.services.courses.get_courses_collection", return_value=mock_col):
        res = await list_enrolled_courses([str(oid)])
        assert len(res) == 1
        assert res[0].id == str(oid)

@pytest.mark.anyio
async def test_get_course_success():
    oid = ObjectId()
    mock_doc = {"_id": oid, "title": "C", "description": "D", "category": "Cat", "difficulty": "Easy", "expected_time": "1h", "modules": [], "created_at": datetime.now(), "updated_at": datetime.now()}
    
    mock_col = AsyncMock()
    mock_col.find_one.return_value = mock_doc
    
    with patch("src.services.courses.get_courses_collection", return_value=mock_col):
        res = await get_course(str(oid))
        assert res.id == str(oid)

@pytest.mark.anyio
async def test_get_course_not_found():
    mock_col = AsyncMock()
    mock_col.find_one.return_value = None
    
    with patch("src.services.courses.get_courses_collection", return_value=mock_col):
        with pytest.raises(HTTPException) as exc:
            await get_course(str(ObjectId()))
        assert exc.value.status_code == 404

@pytest.mark.anyio
async def test_update_course_success():
    oid = ObjectId()
    mock_doc = {"_id": oid, "title": "Old", "description": "D", "category": "Cat", "difficulty": "Easy", "expected_time": "1h", "modules": [], "created_at": datetime.now(), "updated_at": datetime.now()}
    
    payload = CourseUpdate(title="New", description="D", category="Cat", difficulty=CourseDifficulty.EASY, expected_time="1h")
    
    mock_col = AsyncMock()
    mock_col.find_one.side_effect = [mock_doc, {**mock_doc, "title": "New"}]
    mock_col.update_one.return_value = MagicMock()
    
    with patch("src.services.courses.get_courses_collection", return_value=mock_col):
        res = await update_course(str(oid), payload)
        assert res.title == "New"
        mock_col.update_one.assert_called_once()

@pytest.mark.anyio
async def test_patch_course_success():
    oid = ObjectId()
    mock_doc = {"_id": oid, "title": "Old", "description": "D", "category": "Cat", "difficulty": "Easy", "expected_time": "1h", "modules": [], "created_at": datetime.now(), "updated_at": datetime.now()}
    
    payload = CoursePatch(title="Patched")
    
    mock_col = AsyncMock()
    mock_col.find_one.side_effect = [mock_doc, {**mock_doc, "title": "Patched"}]
    
    with patch("src.services.courses.get_courses_collection", return_value=mock_col):
        res = await patch_course(str(oid), payload)
        assert res.title == "Patched"

@pytest.mark.anyio
async def test_delete_course_success():
    oid = ObjectId()
    mock_col = AsyncMock()
    mock_col.find_one.return_value = {"_id": oid}
    
    with patch("src.services.courses.get_courses_collection", return_value=mock_col):
        await delete_course(str(oid))
        mock_col.delete_one.assert_called_once_with({"_id": oid})

@pytest.mark.anyio
async def test_to_object_id_invalid():
    with pytest.raises(HTTPException) as exc:
        from src.services.courses import _to_object_id
        _to_object_id("invalid-id")
    assert exc.value.status_code == 422

@pytest.mark.anyio
async def test_list_enrolled_courses_empty():
    res = await list_enrolled_courses([])
    assert res == []
    
    res = await list_enrolled_courses(["invalid"])
    assert res == []

@pytest.mark.anyio
async def test_update_course_not_found():
    mock_col = AsyncMock()
    mock_col.find_one.return_value = None
    with patch("src.services.courses.get_courses_collection", return_value=mock_col):
        with pytest.raises(HTTPException) as exc:
            await update_course(str(ObjectId()), CourseUpdate(title="N", description="D", category="C", difficulty=CourseDifficulty.EASY, expected_time="1"))
        assert exc.value.status_code == 404

@pytest.mark.anyio
async def test_patch_course_not_found():
    mock_col = AsyncMock()
    mock_col.find_one.return_value = None
    with patch("src.services.courses.get_courses_collection", return_value=mock_col):
        with pytest.raises(HTTPException) as exc:
            await patch_course(str(ObjectId()), CoursePatch(title="N"))
        assert exc.value.status_code == 404

@pytest.mark.anyio
async def test_patch_course_empty():
    oid = ObjectId()
    mock_doc = {"_id": oid, "title": "Old", "description": "D", "category": "Cat", "difficulty": "Easy", "expected_time": "1h", "modules": [], "created_at": datetime.now(), "updated_at": datetime.now()}
    mock_col = AsyncMock()
    mock_col.find_one.return_value = mock_doc
    with patch("src.services.courses.get_courses_collection", return_value=mock_col):
        res = await patch_course(str(oid), CoursePatch())
        assert res.title == "Old"

@pytest.mark.anyio
async def test_delete_course_not_found():
    mock_col = AsyncMock()
    mock_col.find_one.return_value = None
    with patch("src.services.courses.get_courses_collection", return_value=mock_col):
        with pytest.raises(HTTPException) as exc:
            await delete_course(str(ObjectId()))
        assert exc.value.status_code == 404
